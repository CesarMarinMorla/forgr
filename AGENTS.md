# Forgr — Agent Implementation Specification

## Overview
Forgr is a CLI tool (and eventually a TUI) that converts Markdown files into highly polished PDFs. The visual target is the "Artifacts" document style from Claude/Codex: clean sans-serif headers, generous whitespace, warm accent colour, subtle code blocks, and optionally Mermaid diagrams.
The MVP is a single command: `forgr test.md` -> `test.pdf`.

This document is the authoritative blueprint for implementing the entire tool, covering architecture, tool stack, pipeline, styling, preset system, and all milestones.

---

## Design Goals
- **Zero-config polished output** — one command, beautiful PDF.
- **Single Chromium instance** — no separate Mermaid CLI; everything happens in one browser context.
- **Preset system** — swappable design themes (stock, minimal, technical, etc.) with zero code changes.
- **Extensible** — users can drop in custom CSS/JSON presets.
- **TUI** — interactive preset picker (text-based) in Milestone 2, with live PDF thumbnail preview in Milestone 3.
- **Self-contained** — font bundled as base64, no network dependency for rendering.

---

## Architecture Decision: Hybrid Node.js + Playwright
We combine the best of two approaches:

| Concern | Solution |
|--------|----------|
| **Runtime** | Node.js (single language for CLI, pipeline, TUI) |
| **Markdown -> HTML** | `markdown-it` with plugins (highlight.js, emoji, sub/sup) |
| **Templating** | Handlebars (partials, conditionals, preset switching) |
| **Mermaid diagrams** | Mermaid.js runs inside the same Playwright page; no separate `mmdc` process |
| **PDF generation** | Playwright (Chromium) — single browser launch handles rendering + PDF |
| **Syntax highlighting** | `highlight.js` via `markdown-it-highlightjs` (server-side, no browser needed) |
| **Fonts** | `IBM Plex Sans` (display/headings) + `IBM Plex Mono` (code/labels) embedded as base64 in the final HTML |
| **CSS design system** | Single `base.css` with CSS custom properties; presets override a few variables |

**Why not...**
- **mmdc (mermaid-cli)** -> would require a second Chromium instance; complex and heavy.
- **Python + Jinja2 + Playwright** -> we keep Node.js for markdown-it's superior plugin ecosystem and to stay in one language for future TUI (Ink).

**Single Chromium lifecycle**
1. Launch Playwright Chromium once.
2. Set the assembled HTML (with Mermaid.js included).
3. Wait for Mermaid to finish rendering — exact implementation (awaited
   `mermaid.run()`, `window.mermaidReady` flag, timeout behavior) is specified
   in full under **Mermaid & Image Handling** below; this is the single
   source of truth, not restated here to avoid drift.
4. Call `page.pdf()`.
5. Close browser.

No external processes, no temp SVG files, one browser start cost.

---

## Detailed Pipeline (MVP)

1. **CLI entry** — `commander` parses `forgr <input.md> [-o output.pdf]`.
2. **Read file** — `fs-extra` reads the Markdown.
3. **Markdown -> HTML body** — `markdown-it` with plugins produces an HTML
   fragment. Fenced code blocks with `language="mermaid"` are configured to
   render as `<div class="mermaid">...</div>` directly via markdown-it's own
   fence renderer (a custom renderer rule for the `mermaid` language token,
   not a separate regex pre-processing pass over the raw Markdown string).
   **There is no standalone "extract Mermaid blocks" step** — this was an
   earlier draft's approach and is superseded by the unconditional
   `mermaid.run()` call described in **Mermaid & Image Handling** below,
   which runs on every document regardless of whether Mermaid blocks are
   present. Do not implement a regex-based detection/extraction pass; it is
   redundant with markdown-it's existing fence-handling and would
   reintroduce the "did we correctly detect a Mermaid block" branching this
   architecture deliberately avoids.
4. **Assemble full HTML** — Handlebars renders the base template, injecting:
   - Embedded `base.css` (stock preset)
   - Base64-encoded IBM Plex Sans and IBM Plex Mono fonts
   - The HTML body
   - Mermaid.js script (if diagrams present)
5. **PDF generation** — Playwright loads the HTML string, waits for any Mermaid rendering, and captures a PDF with print-optimised settings (`printBackground: true`, generous margins).
6. **Output** — PDF written according to the output-path resolution rules in
   **CLI Behavior & Error Handling** below (default location, overwrite
   behavior, and failure modes are specified there, not restated here).

---

## CLI Behavior & Error Handling

This section is the single source of truth for output-path resolution and
failure modes across the whole tool. Individual pipeline steps and later
milestones should point back here rather than restating or re-deciding
these rules — this is intentional, to prevent inconsistent behavior as
`--watch` (Milestone 5), the TUI (Milestone 2/3), and other entry points are
added on top of the same core pipeline.

### Output path resolution

- Default output path: same directory as the input file, same basename,
  `.pdf` extension (`report.md` -> `report.pdf`).
- `--output <path>` overrides this explicitly.
- **If the resolved output path already exists: overwrite it silently, no
  prompt.** This is a deliberate choice, not an oversight — `forgr` is
  expected to be re-run repeatedly against the same input during normal
  editing workflows (this is also the exact behavior `--watch` in
  Milestone 5 depends on: each file-change triggers a re-render into the
  same output path, which must not pause on a confirmation prompt or it
  breaks the watch loop entirely). A destructive-overwrite prompt is the
  wrong default for a tool meant to be run over and over against the same
  file.
- If the resolved output *directory* does not exist or is not writable
  (permissions error), fail loudly — see General failure-mode contract
  below. Do not attempt to create missing parent directories implicitly;
  an unexpected new directory appearing is a worse surprise than a clear
  error naming the problem.

### General failure-mode contract (applies to the whole CLI, not just Mermaid)

The **fail loudly, never degrade silently** rule established for Mermaid
rendering (see Mermaid & Image Handling) is a project-wide principle, not
a Mermaid-specific one. It applies identically to every other failure mode
in the pipeline:

- **Malformed or unreadable Markdown file** (file doesn't exist, isn't
  valid UTF-8, etc.) — exit with a clear, specific error message naming the
  file and the problem. Non-zero exit code. No partial or empty PDF is ever
  written.
- **Output path unwritable** (bad permissions, path is actually a
  directory, disk full mid-write) — same: clear error, non-zero exit, no
  partial file left behind. If a PDF write fails partway through, the
  partial file must be deleted, not left as a corrupt artifact that looks
  like a valid (if broken) output.
- **Playwright/Chromium launch failure** (corrupted cache, incompatible
  OS) — clear error distinguishing this from a Markdown-content problem,
  since the fix is completely different (reinstall/repair the Chromium
  cache vs. fix the input file). Suggest re-running
  `playwright install chromium` as the recovery step in the error text.
- **Mermaid rendering timeout/failure** — as already specified: fail
  loudly with the offending diagram's source and position.

The unifying rule for every case above: **a failed conversion that clearly
explains what went wrong is always preferable to a PDF that "mostly"
succeeded.** This mirrors the same principle from the original Mermaid ADR
(a document that looks broken is worse than a tool that admits it can't
produce one right now) and should be treated as inherited project-wide
behavior for any new failure mode introduced in later milestones, not
something each new feature re-decides independently.

---

## Project Structure

```
forgr/
├── bin/
│   └── forgr           # Entry point (node script)
├── src/
│   ├── cli.js          # Commander setup, argument parsing
│   ├── pipeline.js     # Orchestrator: markdown -> template -> PDF
│   ├── markdown.js     # markdown-it configuration, mermaid fence renderer rule
│   ├── template.js     # Handlebars compilation, partial loading
│   ├── pdf.js          # Playwright browser/PDF lifecycle
│   ├── templates/
│   │   ├── base.html   # Main Handlebars layout
│   │   ├── partials/   # Optional cover, toc, section partials
│   │   └── presets/
│   │       ├── stock.css     # Default Claude-like aesthetic
│   │       ├── minimal.css
│   │       ├── technical.css
│   │       └── academic.css
│   └── assets/
│       ├── fonts/
│       │   ├── IBMPlexSans-Variable.woff2
│       │   └── IBMPlexMono.woff2
│       └── mermaid.min.js    # Bundled Mermaid for in-browser rendering
├── package.json
└── README.md
```

---

## Styling & Presets

### Stock Preset (MVP default) — "Systems Log"

**This preset is confirmed and final — this is the actual source of truth,
not a placeholder.** The design deliberately avoids generic AI-report
aesthetics (no cream/terracotta, no near-black/acid-green, no soft-rounded
corporate-template look) in favor of a technical, infra-tooling-inspired
visual language: monospace-forward type, a graphite-and-cold-teal palette,
sharp corners, and structural elements borrowed from terminal output and
systems dashboards. The full rationale: infra/technical reports (the kind
this tool's actual usage skews toward — Kubernetes, RBAC, pfSense-style
content) read better as something that looks like it came from the tooling
itself, not a marketing document wearing a report template.

**Design tokens (exact values, not approximations):**

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#1C2128` | Primary text, headings |
| `--ink-soft` | `#4A5262` | Section number labels, blockquote text |
| `--graphite` | `#6E7683` | Metadata, table headers, muted labels |
| `--signal` | `#2DD4BF` | The one accent — status dot, blockquote rule, link underline, keyword highlight |
| `--signal-dim` | `#0F766E` | Darker accent step — link text, section number prefix, inline code text |
| `--signal-bg` | `#ECFDFB` | Reserved, not yet used — future tinted-background element |
| `--line` / `--line-soft` | `#D8DCE2` / `#EAECEF` | Hairline rules — table borders, header underline |
| `--surface` | `#F7F8FA` | Inline code background, table row hover |
| `--surface-code` | `#12161C` | Code block background — near-black, reads as a terminal pane |
| `--radius` | `3px` | Sharp corners throughout — deliberately not the soft 6–8px common in generic report templates |

**Governing rule:** exactly one accent hue (cold cyan-teal) at two lightness
steps, everything else neutral graphite/ink grayscale. Do not add a second
accent color anywhere — that single-hue discipline is what keeps this
reading as systems tooling rather than a branded marketing document.

**Fonts:** `IBM Plex Sans` for display/headings, `IBM Plex Mono` for
metadata, code, and structural labels. Both are bundled as base64 `.woff2`
files embedded in the final HTML — `IBMPlexSans-Variable.woff2` and
`IBMPlexMono.woff2` (see Project Structure). Fallback stack:
`-apple-system, 'Segoe UI', sans-serif` for display,
`'JetBrains Mono', 'Consolas', monospace` for mono.

**Signature structural elements (these carry real information, not just decoration):**

- **Doc-meta header strip** — a fixed top bar showing a small status dot
  (`--signal` colored) plus a monospace breadcrumb-style label (e.g.
  `forgr / stock / systemslog`) and a render timestamp, right-aligned. This
  is the one signature element the preset is built around — reads like a
  CI job header. Populate the breadcrumb and timestamp via Handlebars
  template variables, not hardcoded text.
- **Auto-numbered `h2` sections** (`01`, `02`, `03`...) via CSS counters
  (`counter-reset: section` on `body`, `counter-increment: section` on
  `h2`, rendered via `h2::before { content: counter(section, decimal-leading-zero) }`).
  This is genuine structure, not decoration — these reports are read
  section-by-section, so the numbering carries real navigational meaning.
- **Blockquotes get a `NOTE` mono-label prefix** (`blockquote::before { content: "NOTE" }`)
  — turns a generic quote block into a log-style annotation callout.
  Sharp left rule only (`--signal`, 2px), no background fill, no rounded
  corner on the rule side.
- **Code blocks render as terminal panes** — near-black background
  (`--surface-code`), 2em top padding reserved for a row of three small
  graphite dots (`pre::before`, using `box-shadow` to draw all three dots
  in one pseudo-element rather than three separate DOM nodes) mimicking
  terminal window chrome. This is a real, finished detail — not a
  scaffold — confirm the dots actually render (three 8px circles,
  `#4A5262` at 55% opacity, 14px apart) before treating this preset as
  complete; an earlier draft of this CSS had the `pre::before` positioning
  rule in place but never actually drew the dots, which is an easy thing
  to silently miss since the code block still looks acceptable without them.

**Full CSS is provided as a project asset** (`stock.css`) — implementing
agents should use the actual file rather than reconstructing it from this
description, for the same reason stated in earlier drafts of this spec:
exact spacing, the counter logic, and the `box-shadow` dot-drawing trick
are fiddly enough that a paraphrase risks drifting from the confirmed
design. Treat the table above as a verification checklist against the real
file, not as implementation instructions on their own.

All presets are CSS files that override CSS custom properties (or whole rules) in `base.css`. The template loads the selected preset.

### Confirmed margin behavior (do not change without re-confirming with project owner)

**Margins are 2cm on all four sides, set exclusively via Playwright's
`page.pdf()` call** — never via CSS body padding, which must stay at
`padding: 0` under `@media print` (already correct in the stock CSS; leave
this rule alone). This split was verified by rendering both ways side by
side: CSS-only padding under Playwright's default zero-margin `page.pdf()`
call produces content flush against the page edge (a real, confirmed
failure mode — not hypothetical), while explicit Playwright margins produce
correct, evenly-inset output.

```javascript
// Required in pdf.js — do not omit or the output will have zero margin:
await page.pdf({
  path: outputPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
});
```

Content column is additionally capped at `max-width: 720px` inside that
margin box (set in the CSS body rule), giving a touch of extra breathing
room beyond the page margin itself — this is a deliberate readability
choice, not redundant with the Playwright margin.

### Preset Configuration
Stored as JSON in `~/.config/forgr/presets/`:
```json
{
  "name": "stock",
  "description": "LLM aesthetic - airy, serif body, rounded code, cover page",
  "css_file": "stock.css",
  "features": {
    "cover_page": true,
    "toc": true,
    "section_numbering": false
  }
}
```

**Feature flag status (explicit, so no agent assumes these are wired up
prematurely):**

- `cover_page` and `toc` are **schema placeholders in the MVP (Milestone 1)**.
  The preset JSON format includes them from the start so the config shape
  never needs a breaking change later, but **no cover page or TOC partial
  exists yet, and neither flag has any effect until Milestone 5** (see
  Milestones section — cover page and TOC generation are part of the
  Handlebars partials work introduced there, alongside `.forgrrc` and
  frontmatter support).
- Until Milestone 5 ships: these flags are read but ignored. Setting either
  to `true` in a custom preset before then must **not** throw an error and
  must **not** silently produce a broken/half-rendered PDF — it's simply a
  no-op. This keeps `forgr file.md` safe to run against any preset file at
  every milestone stage, including presets a user hand-writes early and
  expects to "just start working" once the feature ships.
- `section_numbering` follows the same inert-until-implemented rule.

## Mermaid & Image Handling (Milestone 4)

- **Mermaid**: The assembled HTML includes `<script src="mermaid.min.js">`. After
  `page.setContent()`, we execute `mermaid.run()` inside the page and explicitly
  set a completion flag once its returned promise resolves — we do **not** rely
  on Mermaid's automatic DOMContentLoaded init, since Playwright already fully
  controls page load and a manual, awaited call removes any ambiguity about
  when rendering is actually finished.

  Exact implementation (this is the literal contract, not a paraphrase):

  ```javascript
  // Inside pdf.js, after page.setContent(assembledHtml):

  await page.evaluate(async () => {
    window.mermaidReady = false;
    // mermaid.run() returns a Promise that resolves once all
    // `.mermaid` divs on the page have been rendered to SVG in-place.
    await mermaid.run({ querySelector: '.mermaid' });
    window.mermaidReady = true;
  });

  await page.waitForFunction(() => window.mermaidReady === true, {
    timeout: 15000, // fail loudly rather than hang forever on a bad diagram
  });
  ```

  If the page has zero `.mermaid` divs (no Mermaid blocks in the source
  document), `mermaid.run()` resolves immediately with nothing to do — this
  block is safe to run unconditionally on every document, not just ones
  detected to contain Mermaid syntax. This removes an entire class of "did we
  correctly detect a Mermaid block" bugs: the pipeline doesn't need to branch
  on whether Mermaid is present at all.

  If `page.waitForFunction` times out (malformed Mermaid syntax, or a Mermaid
  bug), the pipeline must **fail loudly** with the offending diagram's source
  and position in the document — never fall back to a partial PDF or a
  placeholder box. A failed conversion is preferable to a silently degraded
  one.

- **Images**: Local image references in Markdown are resolved to file paths,
  read as base64, and inlined as data URIs during HTML generation, so the PDF
  is self-contained.

Both are deferred after MVP but the architecture already supports them with
minimal changes.

## Milestones & Roadmap

### Milestone 1 — Barebones CLI (MVP)

Goal: `forgr file.md` -> beautiful PDF (stock preset only)
What ships:
- Markdown parsing (markdown-it)
- Syntax highlighting via `markdown-it-highlightjs` (this is a markdown-it
  plugin configured at parse time, not a separate rendering step — it ships
  from day one, not deferred to a later milestone)
- Single hardcoded stock CSS
- Playwright PDF generation
- No frontmatter, no config, no flags except `--output`

Not in MVP: presets, TUI, Mermaid, image embedding
Success criteria: One command, zero config, output looks designed.

### Milestone 2 — TUI Preset Picker (text-only)

Goal: `forgr file.md --interactive` shows preset list, user picks one, renders.
TUI: Built with Ink (React in terminal) or blessed. Displays preset names and text descriptions; no PDF preview.
Preset system: Reads JSON preset files; user can drop custom CSS/JSON into `~/.config/forgr/presets/`.

### Milestone 3 — TUI with Live PDF Preview

Goal: Same TUI, but shows an actual rendered thumbnail of the first page.
How: After user selects a preset, Playwright renders the first page and takes a screenshot (viewport set to A4 dimensions). The PNG is displayed in the terminal via `terminal-image` (if supported). Caching by content_hash + preset_hash ensures fast switching (~200ms warm). Falls back to text mode if terminal lacks image support.

### Milestone 4 — Mermaid, Images

Already built into the architecture; just wire up:
- Mermaid in-browser with `mermaid.run()`
- Image inlining (base64 data URIs)

(Syntax highlighting is **not** part of this milestone — it shipped in the
MVP, Milestone 1, above. It's listed there, not here, to avoid the earlier
draft's duplication across two milestones.)

### Milestone 5 — Config Files, Watch Mode, Plugins, Cover Page & TOC

- Configuration files (`.forgrrc`, frontmatter support)
- Watch mode (re-render on file change)
- Plugin system for custom Markdown transformations
- **Implements the `cover_page`, `toc`, and `section_numbering` preset feature
  flags** (declared in the preset JSON schema since Milestone 1, inert until
  now — see Preset Configuration section above). This is where the
  `templates/partials/` directory referenced in the Project Structure
  actually gets populated with `cover.html` and `toc.html` partials, wired
  into `template.js` conditionally based on these flags.

## Dependencies & Installation

### User install

```bash
npm install -g forgr
```

That is the **entire** install. A single command, nothing else required
before `forgr file.md` works.

**Chromium is core, mandatory functionality — not an optional feature.**
Unlike Mermaid support (which degrades gracefully if a dependency is
missing), Chromium via Playwright is the *only* rendering path this
architecture has. There is no fallback PDF engine. If Chromium isn't
present, `forgr` cannot produce a single PDF, not even a plain document
with no diagrams. This means the Chromium download **cannot** be a second,
optional, or manually-triggered step — it must complete as part of the one
install command, every time, unconditionally.

**Implementation requirement:** wire `playwright install chromium` into a
`postinstall` script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "playwright install chromium"
  }
}
```

This makes the Chromium download run automatically and silently as part of
`npm install -g forgr` — the user never sees it as a separate step, and
there is no broken intermediate state where `forgr` is on `PATH` but
non-functional because Chromium hasn't been fetched yet.

**Where it installs (does not touch global system state):**
`playwright install chromium` downloads the browser binary into
Playwright's own managed cache directory — `~/.cache/ms-playwright` on
Linux, `~/Library/Caches/ms-playwright` on macOS, or
`%USERPROFILE%\AppData\Local\ms-playwright` on Windows. It does **not**:
- touch or replace the user's actual installed Chrome/Chromium browser
- modify the system `PATH`
- modify global npm config
- require sudo (user-directory cache, not a system location)

This is the same "scoped, self-contained, trivially removable" property that
a consent-gated local install (like the original MarkForge project's
`~/.markforge/tools` design) aimed for — Playwright provides it natively
here, no custom scoping logic needed, and no consent prompt is required for
this specific case since Chromium is mandatory core functionality, not an
optional extra.

**User-facing expectation to set in the README/CLI help text:** the first
`npm install -g forgr` will take noticeably longer than a typical CLI tool
install (~100–150MB Chromium download on top of the npm packages). This
should be stated up front so it doesn't read as a hang. A `postinstall` log
line such as `Downloading Chromium for PDF rendering (one-time, ~130MB)...`
is sufficient — no interactive prompt is needed here, unlike Mermaid's
consent gate, because this isn't an optional extra the user is being asked
to opt into; it's the one and only way this tool functions at all, so
consent was already given the moment they chose to install `forgr`.

### Package dependencies (dev)
- commander
- markdown-it + markdown-it-highlightjs, markdown-it-emoji, markdown-it-sub, markdown-it-sup
- handlebars
- **playwright — pin to an exact version, not a caret/tilde range.**
  `package.json` must specify `"playwright": "1.4x.x"` (exact, no `^` or `~`),
  not `"^1.4x.0"`. Rationale: `postinstall` fetches whichever Chromium build
  matches the installed Playwright version. An unpinned range means two
  users installing `forgr` a week apart could silently receive different
  Chromium builds, which can shift text layout, font rendering, or
  print-to-PDF behavior in small ways — directly undermining the
  "same input always produces the same output" goal carried over from the
  project's original deterministic-rendering intent. Exact-pinning trades a
  small amount of dependency freshness for a real determinism guarantee,
  which is the correct tradeoff here. Bump the pin deliberately (a reviewed,
  intentional version bump commit) rather than letting it drift via range
  resolution.
- fs-extra
- terminal-image (for Milestone 3)
- ink (for TUI)
- highlight.js (shipped with markdown-it-highlightjs)

## Key Technical Decisions Summary

- Single Chromium via Playwright — no mermaid-cli.
- Handlebars for composable templates and preset switching.
- `IBM Plex Sans` (display/headings) + `IBM Plex Mono` (code/labels) bundled as base64 inside the HTML.
- Syntax highlighting on the server via markdown-it-highlightjs.
- Mermaid runs in the browser via an awaited `mermaid.run()` call, gated by a
  `window.mermaidReady` flag and a 15s timeout that fails loudly on bad
  diagrams — see **Mermaid & Image Handling** for the exact code contract.
- Preset system = JSON config + CSS file; user presets live in `~/.config/forgr/presets/`.
- Fail loudly, never degrade silently — applies project-wide (bad input,
  bad output path, Chromium launch failure, Mermaid errors alike), not just
  to Mermaid. See **CLI Behavior & Error Handling** for the full contract.
- Output overwrites silently by default (no confirmation prompt) — required
  for `--watch` mode in Milestone 5 to function at all. See **CLI Behavior
  & Error Handling**.
- Playwright is version-pinned exactly (no `^`/`~` range) so Chromium build
  drift can't silently undermine deterministic rendering across installs.

## Success Criteria (End of MVP)

- `forgr document.md` produces a PDF in the same folder.
- Output PDF visually matches the Claude Artifacts aesthetic (clean, warm, professional).
- Zero configuration required.
- Single command, no extra files, no internet needed **to render** (install
  itself does require network access once, to fetch Chromium via
  `postinstall` — see Dependencies & Installation).

This specification is the complete, final blueprint for implementation. All styling tweaks happen inside the CSS presets; all pipeline logic is described above. Agents should implement Milestone 1 first, then proceed incrementally.
