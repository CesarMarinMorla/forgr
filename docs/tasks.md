# forgr — Tasks

## Status

| Milestone | Scope | State |
|---|---|---|
| 1 | Published CLI (v0.1.0) | Done |
| 2 | Mermaid rendering & image embedding | Done |
| 2.5 | Preset expansion & polish (newsletter preset, academic revamp, spacing, mermaid colors) | Done |
| 2.75 | TUI & CLI polish | Pending |
| 3 | TUI preset picker (v0.6.0) | Done |
| 3.5 | Front-matter parsing | Done |
| 4 | TUI settings form | Pending |
| 5 | Watch mode & user presets | Pending |
| 7 | `forgr doctor` diagnostic | Done |
| — | Structural cleanup (P1–P3) | Done |

## Milestone 1 — Published (v0.1.0)

### Project setup
- [x] Git repo initialized, remote set
- [x] AGENTS.md written with full spec
- [x] .gitignore (node_modules, *.pdf, .env, logs, editor dirs, dist/, coverage/)
- [x] package-lock.json committed for CI reproducibility (`npm ci` in release workflow)
- [x] package.json — repository, bugs, homepage, author, keywords, files fields
- [x] LICENSE (MIT)

### Core pipeline
- [x] package.json — all dependencies pinned (playwright-core at exact 1.61.1)
- [x] Chromium downloaded on first `forgr` run, not during install
- [x] `forgr uninstall` command removes Chromium cache without removing the tool (primary path)
- [x] `preuninstall` npm script exists in package.json but its script file is NOT published (`scripts/preuninstall.js` excluded from `"files"`), so npm uninstall does not auto-clean the cache
- [x] bin/forgr entry point (executable)
- [x] src/cli.js — commander, --output, --preset, uninstall command, defaults to terminal
- [x] src/browsers-path.js — canonical BROWSERS_PATH (~/.forgr/browsers) with env var injection
- [x] src/pipeline.js — orchestrator: read -> render -> template -> PDF
- [x] src/markdown.js — markdown-it + highlight.js, emoji, sub, sup, mermaid fence renderer
- [x] src/markdown.js — h2 number stripping (core rule)
- [x] src/markdown.js — wrapTableNumbers() wraps <td> numbers in .num spans
- [x] src/template.js — Handlebars, preset CSS loading, font base64 embedding
- [x] src/pdf.js — Playwright lifecycle, mermaid.run(), 2cm margins, partial file cleanup
- [x] src/pdf.js — ensureChromium() downloads headless shell on first run
- [x] src/templates/base.html — @font-face blocks, doc-meta header (dot, label, timestamp)

### Presets
- [x] src/templates/presets/terminal.css — default preset (all-mono IBM Plex Mono headings, graphite/teal palette, terminal code blocks, NOTE callouts, tabular numbers, pagination control)
- [x] src/templates/presets/minimal.css, technical.css, academic.css — built from the ground up with four distinct identities (see HIGH PRIORITY section below)

### Fonts
- [x] IBMPlexSans-Variable.woff2 (45KB) — @fontsource-variable
- [x] IBMPlexMono-400.woff2 (49KB) — full file from @ibm/plex-mono@2.5.0 (replaced 14KB subset)
- [x] IBMPlexMono-600.woff2 (50KB) — full file from @ibm/plex-mono@2.5.0 (replaced 15KB subset)

### Styling details
- [x] Doc-meta header: left-aligned label with 6px --signal dot, timestamp right-aligned
- [x] h2: IBM Plex Mono 400 all-mono uppercase, teal ::before counter (01 02 03...)
- [x] Code blocks: terminal-pane style with 3-dot chrome (box-shadow)
- [x] Blockquotes: NOTE mono label, signal left rule
- [x] Table headers: IBM Plex Mono uppercase
- [x] Table cell numbers: IBM Plex Mono via .num spans (words stay body font)
- [x] Ordered list markers: IBM Plex Mono, graphite color, 2em padding to prevent clipping
- [x] Print pagination: break-after avoid on headings, break-inside avoid on tables/pre/blockquote, widows/orphans 2 on paragraphs

### Test suite
- [x] test/markdown.test.js — unit tests for markdown rendering + table number wrapping
- [x] test/pipeline.test.js — output path resolution tests
- [x] test/integration.test.js — end-to-end PDF generation test (globs all fixtures)
- [x] npm test = 38 tests (30 unit + 8 integration), all passing
- [x] npm run test:unit = unit tests only (30 tests, excludes integration)
- [x] integration test accepts `FORGR_PRESET` env var (terminal|minimal|technical|academic|newsletter, default terminal) to validate one preset at a time; rejects unknown values
- [x] Rendered fixture PDFs stay in test/fixtures/ (gitignored) for visual review — do not delete them after a run

### Dev tooling
- [x] scripts/font-diagnostic.js — 7-comparison side-by-side font diagnostic PDF
- [x] scripts/postinstall.js — manual Chromium install script
- [x] scripts/preuninstall.js — Chromium cache cleanup on uninstall
- [x] test/fixtures/ — 8 .md fixtures (basic, code, comprehensive, converter_features, formatting, lists, tables, mermaid)
- [x] test/fixtures/mermaid.md — flowchart, sequence, state, and class diagrams exercising the mermaid fence renderer
- [x] test/fixtures/comprehensive.md — two mermaid diagrams added as sections 6.3 (request flow) and 6.4 (auth sequence)
- [x] docs/font-investigation.md — font issue investigation and resolution notes

### Published
- [x] npm pack — 21 files, 190KB unpacked, 159KB compressed
- [x] npm publish — forgr@0.1.0 live on registry.npmjs.org
- [x] Verified: install -> first run -> render -> uninstall (cleanup confirmed)

---

## Presets — all 5 complete (terminal, minimal, technical, academic, newsletter)

### minimal.css — black-on-white from source template
- [x] Adapt MarkForge minimal.css: system sans, one gray (#666), hairline rules, no accent
- [x] Remove @page margin/size (forgr handles via pdf.js)
- [x] Add @page background for full-page white
- [x] Style .doc-meta: restrained (no dot, mono timestamp, thin rule)
- [x] Add hljs token overrides (black/gray only, no accent color)
- [x] Add @media print break controls
- [x] Add h1:first-of-type page-break-before: avoid
- [x] Test with all fixture files

### technical.css — from functional stub to intentional design
- [x] Define technical's design identity (dense, monospace-heavy, grid-like tables)
- [x] Write full CSS with distinct palette, infra/ops tooling feel (full monospace, amber accent, full-grid tables, tinted code panels, bracket section markers)
- [x] Test with all fixture files

### academic.css — from functional stub to intentional design
- [x] Initial release: typeset-journal (rubric blue, roman numerals, superscript citations, QED, drop cap)
- [x] **Revamp (Modern Scholarly)**: pine green accent, Georgia serif body + IBM Plex Sans headings → later switched to pure serif, marginal arabic counters against hairline rule, clean restrained typography
- [x] Line spacing tightened from 1.7 → 1.45 (book standard Butterick range)
- [x] Paragraph spacing, heading spacing, blockquote/pre margins tightened to match
- [x] Fixed ASCII art alignment bug (text-align: justify bleeding into pre blocks)
- [x] Fixed mermaid edge label colors (lineColor: brownish #244233 → true dark #1B4A36)
- [x] Added secondaryColor for diamond nodes, edgeLabelBackground, primaryBorderColor
- [x] Test with all fixture files (38 tests pass)

### newsletter.css — new preset (warm editorial)
- [x] Warm off-white paper (#FAF8F5), dark warm gray ink (#2D2A24), terra-cotta coral accent (#C85A48)
- [x] Serif display headings (Georgia), IBM Plex Sans body, spacious 700px measure
- [x] Coral left-border code blocks, italic pull-quotes, dot section dividers, card-style TOC
- [x] Registered in cli.js, template.js, pdf.js, integration test
- [x] Published as part of v0.2.0

---

## Milestone 2 — Mermaid Rendering & Image Embedding (Done)

- [x] Add `mermaid` 11.16.0 to `package.json` (exact pin)
- [x] Load mermaid dist into Playwright page via `page.addScriptTag`
- [x] Per-preset mermaid theme config in `pdf.js` (5 presets: terminal, minimal, technical, academic, newsletter)
- [x] Render each `.mermaid` div individually with `mermaid.render()` — error collection, fail loud
- [x] Inline local images to base64 data URIs in `markdown.js` (PNG/JPEG/GIF/WebP/SVG)
- [x] Pass `baseDir` from `pipeline.js` for image resolution
- [x] Remote URLs and data URIs pass through unchanged
- [x] Missing local image throws
- [x] Test fixtures: `test/fixtures/mermaid.md` (4 diagrams), 7 images in `test/fixtures/assets/`
- [x] `test/mermaid/render.test.js` — Playwright integration test asserting `.mermaid` → `<svg>`
- [x] 8 image embedding unit tests
- [x] `.mermaid` CSS in `base.html`: `break-inside: avoid; break-before: avoid;` — headings stay with their diagrams

### Mermaid theming & fixture reorg (v0.7.0 feature branch: `feat/mermaid-theming`)

- [x] Gantt contrast fix — remove gantt text color overrides from all 5 presets (mermaid defaults are readable)
- [x] Timeline contrast fix — inject `cScale[0-11]` (light fill) and `cScaleLabel[0-11]` (dark text) to compensate for mermaid's 25% darken
- [x] ER diagram parser compatibility — avoid reserved word `to` in labels; avoid `o{`/`o|`/`}|` relationship tokens (only `||` and `|{` work in 11.16)
- [x] Per-preset fixture files — 10 diagram types each, content tailored to preset aesthetic
- [x] Old monolithic `test/fixtures/mermaid.md` deleted
- [x] `test/mermaid/pie.test.js` — pie label regression + per-preset fixture rendering tests
- [x] Test modularization — all mermaid tests + fixtures moved to `test/mermaid/`
- [ ] **Mermaid sizing & layout** — diagrams are currently rendered at default mermaid size, leading to inconsistent proportions. Need to research mermaid dimension options, test what works in Playwright/PDF context, and create intelligent sizing (fit content, cap max width, handle wide diagrams like gantt/timeline gracefully)

---

## Milestone 2.75 — TUI & CLI Polish (Pending)

### CLI output

- [ ] Colored prefixes: ✓ success, ✗ error, ℹ info
- [ ] Inline spinner during PDF generation (replaces silent gap)
- [ ] Completion summary: page count, word count, file size, preset, elapsed
- [ ] Chromium download as single-line progress (no Playwright noise)

### TUI (Ink)

- [ ] Visual preset cards with accent color swatch beside each name
- [ ] Confirmation animation before generation kicks off
- [ ] Result screen after render: file path, page count, preset, time — "done" state, q quits
- [ ] Consistent accent color for TUI chrome (separate from document presets)

### Error format (both paths)

- [ ] Chromium not found → message + fix hint, no stack trace
- [ ] Invalid preset → formatted list of available presets
- [ ] Pipeline errors → single line + hint, never raw dump

---

## Milestone 3 — TUI Preset Picker (Done, v0.6.0)

Launched via the `forgr-tui` command (separate bin), not an `--interactive` flag.

- [x] `src/presets.js` — central preset registry (`BUILTIN_PRESETS`, `scanUserPresets`, `listPresets`)
- [x] Move `ink` (5.1.0) and add `react` (18.3.1, ink peer) to runtime `dependencies`
- [x] `src/tui.js` — Ink-based picker: list presets + descriptions, arrow-key navigation, Enter to select, `q`/`esc` to quit
- [x] `bin/forgr-tui` — new bin; parses input/output/toc, launches TUI, renders with chosen built-in preset
- [x] Scan `~/.config/forgr/presets/*.json` for user presets and display them (tagged `(user)`)
- [x] Non-TTY guard: `launchTui` throws a clear error when stdin is not a TTY
- [x] `test/presets.test.js` — registry + user-preset scan (valid, malformed, incomplete)
- [x] `test/tui.test.js` — TUI non-TTY guard
- User-preset *rendering* is deferred to Milestone 5 (config); selecting a user preset prints an informative message
- No PDF preview in this milestone (that is Milestone 4)

---

## Milestone 3.5 — Front-Matter Parsing (Done)

### Reading

- [x] Parse YAML front-matter (delimited by `---`) at top of `.md` files (via `gray-matter`)
- [x] Shared fields: `layout` / `preset`, `title`, `date`, `author`
- [ ] Namespaced fields: `forgr.toc`, `forgr.cover`, `forgr.footer`, `forgr.section_numbering`
- [x] Ignore unrecognized fields (Obsidian/Jekyll/Typora safe)
- [x] Files without front-matter render unchanged

### Merge priority

- [x] CLI flags win over front-matter
- [ ] TUI settings win over front-matter (TUI settings form not yet implemented)
- [x] Front-matter is the baseline (no CLI flags + no TUI = file config)
- [ ] TUI form pre-fills from front-matter when available (TUI settings form not yet implemented)

### Write discipline

- [x] forgr never writes to the input `.md` file
- [x] Settings are ephemeral per render
- [ ] Future `--write` flag to save TUI settings as front-matter

### README

- [ ] Document all supported front-matter keys with examples
- [ ] Show minimal block for fully automated render (title + layout = zero CLI flags)

---

## Milestone 4 — TUI Settings Form (Pending)

After the Ink preset picker exits, the TUI moves to an inline (npm-style) settings form:

### UX

- [ ] Settings appear as sequential prompts after the Ink picker
- [ ] Defaults shown in brackets, Enter accepts default
- [ ] Form pre-fills from front-matter when available
- [ ] Final confirmation: "Render with these settings? [Y/n]"

### Settings (sequential prompts)

**Cover page**
- [ ] on/off toggle
- [ ] Editable fields: title, author, date (only shown when cover is on)
- [ ] Cover renders as separate first page before body

**Table of Contents**
- [ ] 3-way choice: auto / on / off (overrides two-pass heuristic)
- [ ] Auto is default (word count >= 8000 OR pages >= 3)

**Doc-meta header**
- [ ] show/hide toggle
- [ ] Editable label text (default: `forgr / {preset} / {filename}`)
- [ ] Editable timestamp format

**Footer (page numbers)**
- [ ] Switchable: none / "1 / 10" / "Page 1 of 10"
- [ ] Optionally include title or preset name alongside numbers

**Section numbering**
- [ ] on/off toggle

**Output path**
- [ ] Optional: show inferred path, let user edit it

### Architecture

- [ ] TUI returns structured config merging: front-matter < TUI overrides < CLI flags
- [ ] Pipeline accepts cover, footer mode, section numbering options
- [ ] Cover page rendered via template partial (separate first page)
- [ ] Footer/header mode drives Playwright displayHeaderFooter

---

## TOC — Done (implemented outside Milestone 5)

TOC is implemented without template partials — it runs at the markdown-render level and injects HTML into the body.

- [x] markdown-it-anchor plugin — headings get id slugs
- [x] TOC HTML generation — nested nav with level-based indentation classes
- [x] CLI --toc / --no-toc flags
- [x] Two-pass page count decision (word count >= 8000 OR pages >= 3 triggers TOC; 2nd render only when first guess was wrong)
- [x] TOC styling in all 5 presets (.toc, .toc__title, .toc__list, .toc__item--hN)
- [x] Input: docs/elements.md — checklist of all basic styling elements

### Hardcoded constants (now in `src/config.js`)

| Key | Default |
|---|---|
| `tocWordThreshold` | `8000` |
| `minPagesForToc` | `3` |
| `paperFormat` | `A4` |
| `margins` | `{ top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }` |
| `footer` | `'page-numbers'` |
| `dateFormat` | `'iso'` |
| `docMeta` | `true` |
| `cover` | `false` |
| `sectionNumbering` | `false` |

## Milestone 5 — Watch Mode & User Presets (Pending)

- [ ] Watch mode (`--watch` flag, re-render on file change)
- [ ] User-preset rendering (discovery done in M3)
- [ ] Plugin system for custom Markdown transformations

---

## Milestone 6 — LaTeX Math (On Demand)

*Not started. Ships after Milestones 1-5 are fully polished.*

### LaTeX Math Notation
- [ ] Math rendering via `markdown-it-texmath` or `markdown-it-katex`
  - [ ] Inline math: `$...$` and `\(...\)`
  - [ ] Display math: `$$...$$`, `\[...\]`, and fenced `` ```math `` blocks
- [ ] KaTeX CSS bundled per-preset (or a shared math stylesheet)
- [ ] Font loading for math glyphs (KaTeX fonts embedded or CDN)
- [ ] Math in mermaid labels (stretch goal — mermaid's built-in math is experimental)
- [ ] Test fixtures with mixed math/markdown content

---

## Milestone 7 — `forgr doctor` diagnostic command (Done)

*Self-check command at `src/doctor.js`, registered as `forgr doctor` in `cli.js`.*

### What it checks

- [x] **Chromium binary** — verify `~/.forgr/browsers/chromium_headless_shell-*` exists and is executable
- [x] **Preset CSS files** — for each built-in preset, check the CSS file exists at the expected path inside the package
- [x] **User preset files** — validate all `~/.config/forgr/presets/*.json` are parseable and have required fields
- [x] **User preset CSS targets** — for presets that reference an external CSS path, check the file exists and is readable
- [x] **Font files** — verify `IBMPlexSans-Variable.woff2`, `IBMPlexMono-400.woff2`, `IBMPlexMono-600.woff2` exist in the package assets dir
- [x] **Template file** — verify `base.html` exists
- [x] **Node version** — warn if below the minimum supported version

### Fix modes

- [x] `forgr doctor` — report-only (exit code 0 = all good, non-zero = issues found)
- [x] `forgr doctor --fix` — auto-fix where possible:
  - Re-download Chromium if missing/corrupt
  - Reinstall package if built-in files are missing (prompt user to run `npm install` or re-download)
  - Remove malformed user preset files
- [x] `forgr doctor --verbose` — print full paths inspected, file sizes, and timestamps

### Output format

- [x] Colored output: green OK / red FAIL / yellow WARN per check
- [x] Summary line: "N passed, N warnings, N errors"
- [x] Suggestions for each failure

---

## Structural cleanup (P1–P3) — Done

Three-phase refactor eliminating duplicated code and centralizing hardcoded configuration.

### P1 — Extract duplicates

- [x] `getChromiumInstallCmd()` in `browsers-path.js` — replaces `npx` string in `pdf.js`, `doctor.js`, `postinstall.js`
- [x] `removeFfmpeg()` in `browsers-path.js` — extracted from `pdf.js` and `postinstall.js`
- [x] Preset name list — `cli.js` and `template.js` read from `BUILTIN_PRESETS` (single source)
- [x] `normalizeTocOption()` in `utils.js` — shared by `cli.js` and `bin/forgr-tui`
- [x] `printOutputMsg()` in `utils.js` — shared by `cli.js` and `bin/forgr-tui`
- [x] `handleCliError()` in `utils.js` — shared by `cli.js` and `bin/forgr-tui`

### P2 — Config object

- [x] `src/config.js` — single `DEFAULTS` object with all hardcoded values
- [x] `buildConfig()` in `pipeline.js` — merges CLI options > front-matter > DEFAULTS
- [x] Config flows through `pipeline.js` → `pdf.js`, `template.js` instead of loose options
- [x] `toc` field uses `'auto' | 'on' | 'off'` strings (merged via priority: CLI > FM > defaults)
- [x] `dateFormat`, `docMeta`, `cover`, `footer`, `sectionNumbering` ready for TUI/front-matter wiring

### P3 — Front-matter merge

- [x] `gray-matter` dependency added for YAML parsing
- [x] `parseFrontMatter()` in `markdown.js` — extracts `preset`, `title`, `date`, `author`, `toc`
- [x] Merged into config in `pipeline.js` — front-matter sits between CLI flags and DEFAULTS
- [x] Title, author, date passed to template context and rendered conditionally in `base.html`

### Extra — `npx` lockfile pollution fix

- [x] `getChromiumInstallCmd()` resolves playwright-core CLI path via `require.resolve` instead of shelling to `npx`, preventing random `package-lock.json` files in the working directory

---

## Publishing workflow

- **Automatic**: semantic-release on push to `main`. Conventional commits drive version bumps.
- [x] `.releaserc` configured (branches: main, default plugins)
- [x] `.github/workflows/release.yml` — push-to-main trigger, OIDC trusted publisher
- [x] OIDC configured on npmjs.com (org: CesarMarinMorla, workflow: release.yml)
- [x] `package-lock.json` committed for CI reproducibility
- [x] `feat:` → minor bump, `fix:` → patch, `BREAKING CHANGE` → major
- [x] `docs:` / `chore:` commits do NOT trigger a release

## npm v12 compatibility

- [x] `.npmrc` with `allow-scripts=false` to prevent postinstall warnings
- [x] `preuninstall.js` removed from published `"files"` array in package.json

---

## Design decisions locked in (do not revisit without owner sign-off)

- Margins: 2cm all sides via Playwright page.pdf(), never via CSS body padding
- Output: silent overwrite, no confirmation prompt (required for --watch)
- Playwright version: pinned exactly at 1.61.1 (no ^ or ~)
- Heading (terminal preset): all-mono IBM Plex Mono 400, section counter in teal (#1C756E). Other presets define their own heading treatments (see Presets section).
- Fail loudly on all errors — no silent degradation anywhere in the pipeline
- `.mermaid { break-inside: avoid; break-before: avoid; }` — prevents diagrams from splitting across pages away from their heading
- Academic preset: justified body text must be overridden to `text-align: left` on `<pre>` blocks to preserve ASCII art alignment

---

## Architecture Assessment (post-Milestone 1)

Assessed 2026-07-06. Overall structure is sound — module boundaries match the spec and pipeline separation is clean. No major restructuring needed. The issues below are real but non-blocking for Milestone 1; items 1 and 2 will cause friction when the TUI (Milestone 2) and watch mode (Milestone 5) are added on top of the same pipeline.

### Issue 1 — process.exit() scattered across modules (priority: resolved)

`pdf.js`, `template.js`, `pipeline.js`, and `cli.js` all call `process.exit(1)` directly. This has two consequences:

- Unit tests cannot test error paths without mocking `process.exit`.
- The TUI (Milestone 2) and watch mode (Milestone 5) will both reuse the pipeline; a `process.exit` inside a library module kills the whole process instead of letting the caller handle the error gracefully.

**Correct pattern:** modules throw typed errors; only `cli.js` (the entry point) catches them and exits. Example:

```js
// pdf.js — throw instead of exit
throw new Error(`Output directory not writable: ${outputDir}`);

// cli.js — single exit boundary
try {
  await run(input, options);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
```

Affects: `src/pdf.js`, `src/template.js`, `src/pipeline.js`.

### Issue 2 — BROWSERS_PATH / FORGR_DIR defined in multiple places (priority: resolved)

The path constants are defined independently in:
- `src/browsers-path.js` (canonical)
- `src/cli.js` (duplicate — `FORGR_DIR` and `BROWSERS_PATH` re-derived)
- `scripts/postinstall.js` (duplicate — `BROWSERS_PATH` re-derived)

`cli.js` should import from `browsers-path.js` instead of re-deriving. `postinstall.js` runs outside the src tree and cannot import from it, so its duplicate is acceptable — but it should have a comment acknowledging this.

Affects: `src/cli.js`.

### Issue 3 — markdown.js is doing two jobs (priority: resolved)

`markdown.js` now handles both highlight.js initialisation (35+ imports and registrations, ~100 lines) and markdown-it configuration. These are separate concerns. As the language list grows the file will become hard to scan.

Suggested split: extract hljs setup to `src/highlighter.js`, import the configured instance into `markdown.js`.

Affects: `src/markdown.js`.

### Issue 4 — Stub presets produce unstyled output (priority: resolved)

`minimal.css`, `technical.css`, and `academic.css` were empty placeholder files (35 bytes each). They have been populated with a complete CSS variable set and element rules. Each preset has its own palette (minimal/technical use graphite-teal, academic uses serif/brown).

### Issue 5 — Silent font fallback violates the fail-loudly principle (priority: resolved)

In `template.js`, all three font reads use `.catch(() => null)`. If a font file is missing, the template silently falls back to system fonts with no log output. The output looks wrong without any indication of why.

Per the project-wide fail-loudly rule (AGENTS.md, CLI Behavior section), this should at minimum log a warning to stderr when a font file is not found.

Affects: `src/template.js`.

### Issue 6 — No error boundary in pipeline.js (priority: resolved)

`pipeline.js` calls `renderMarkdown`, `renderTemplate`, and `generatePdf` with no wrapping try/catch. If any of those throw an unhandled error (rather than calling `process.exit`), Node surfaces it as an unhandled promise rejection with a raw stack trace. A single try/catch at the pipeline level that re-throws a clean, user-facing error would fix this, and pairs well with Issue 1 (once modules throw instead of exiting, the pipeline is the right place to catch and re-format).

Affects: `src/pipeline.js`.

---

## Refactoring tasks (derived from assessment above)

- [x] Refactor pdf.js, template.js, pipeline.js to throw errors instead of calling process.exit — add single exit boundary in cli.js (Issue 1, 6)
- [x] Import BROWSERS_PATH from browsers-path.js in cli.js instead of re-deriving (Issue 2)
- [x] Extract hljs setup to src/highlighter.js (Issue 3)
- [x] Log a warning in template.js when a font file is not found (Issue 5)

---

## Future — Deno Desktop port (deferred)

*Not started. Evaluate once `BrowserWindow.printToPdf()` stabilises in Deno 2.10+.
This would replace Playwright + Chromium (~300MB dependency) with the OS-native WebView.*

### What Deno Desktop has today (Deno 2.9, canary)

| Feature | Status |
|---------|--------|
| `Deno.BrowserWindow` | Shipped — lifecycle, navigation, events |
| `executeJs()` | Shipped — run JS in WebView, get JSON result |
| `window.print()` | Shipped — triggers OS print dialog (not headless) |
| `visible: false` (headless window) | PR #35967 — ready, not merged |
| `printToPdf()` (programmatic PDF) | PR #35967 — ready, not merged |
| `printToPdf()` with page size / margins / header/footer options | **Not designed yet** — PR API is minimal `{ path?: string }` |

### What forgr needs that Deno doesn't cover yet

- **Page size control** — Playwright's `page.pdf({ format: 'A4' })`. In Deno, this would need to come from CSS `@page { size: A4 }` if the WebView respects it, or be added to `printToPdf()` options.
- **Margin control** — Playwright's `margin: { top, bottom, left, right }`. Same story — CSS `@page { margin: 2cm }` might work, needs testing.
- **PDF header/footer** — forgr uses Playwright's `headerTemplate`/`footerTemplate` for page numbers. Deno has no equivalent; page numbering would need a CSS-based approach (e.g., `@page { @bottom-center { content: counter(page) } }`) or a future API addition.
- **Font subsetting / embedding control** — Playwright handles this automatically. Deno's WebView would use system fonts, so the same base64-embedded `@font-face` approach forgr already uses would work — no Playwright dependency there.
- **Mermaid in headless WebView** — Doable via `executeJs()` but unproven. Mermaid's `.render()` is synchronous and the WebView needs a full DOM. A hidden window with `visible: false` should work, but needs a real test.

### Porting plan

- [ ] Re-evaluate once `BrowserWindow.printToPdf()` ships in stable Deno — confirm CSS `@page` rules for margins/size are respected by the OS WebView
- [ ] Port markdown pipeline (markdown-it, highlight.js, Handlebars) to Deno runtime (pure JS, should be trivial)
- [ ] Implement mermaid rendering via hidden WebView: inject mermaid.js → `executeJs()` → extract SVGs
- [ ] Port PDF generation: replace Playwright's `page.pdf()` with `BrowserWindow.printToPdf()`
- [ ] Port image inlining, font embedding, CSS preset loading (all pure JS — no Playwright dependency)
- [ ] Drop `playwright-core`, `node_modules/.browsers` (~300MB), simplify install
- [ ] Single-binary distribution: `deno compile` for CLI, `deno desktop` for optional native GUI
- [ ] Evaluate whether forgr-tui becomes a native desktop window (instead of Ink terminal rendering)
