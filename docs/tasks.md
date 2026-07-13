# forgr — Tasks

## Status

| Milestone | Scope | State |
|---|---|---|
| 1 | Published CLI (v0.1.0) | Done |
| 2 | Mermaid rendering & image embedding | Done |
| 2.5 | Preset expansion & polish (newsletter preset, academic revamp, spacing, mermaid colors) | Done |
| 3 | TUI preset picker (v0.6.0) | Done |
| 4 | TUI with live PDF preview | Pending |
| 5 | Config, watch mode, cover page | Pending |

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
- [x] `test/mermaid.test.js` — Playwright integration test asserting `.mermaid` → `<svg>`
- [x] 8 image embedding unit tests
- [x] `.mermaid` CSS in `base.html`: `break-inside: avoid; break-before: avoid;` — headings stay with their diagrams

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

## Milestone 4 — TUI with Live PDF Preview (Pending)

- [ ] After preset selection, render first page as PNG via Playwright screenshot
- [ ] Display PNG in terminal via terminal-image
- [ ] Cache by content_hash + preset_hash (~200ms warm target)
- [ ] Fallback to text mode if terminal lacks image support

---

## TOC — Done (implemented outside Milestone 5)

TOC is implemented without template partials — it runs at the markdown-render level and injects HTML into the body.

- [x] markdown-it-anchor plugin — headings get id slugs
- [x] TOC HTML generation — nested nav with level-based indentation classes
- [x] CLI --toc / --no-toc flags
- [x] Two-pass page count decision (word count >= 8000 OR pages >= 3 triggers TOC; 2nd render only when first guess was wrong)
- [x] TOC styling in all 5 presets (.toc, .toc__title, .toc__list, .toc__item--hN)
- [x] Input: docs/elements.md — checklist of all basic styling elements

### Hardcoded constants (configurable later via .forgrrc)

| Constant | Location | Value |
|---|---|---|
| `LONG_DOC_WORDS` | `src/pipeline.js` | `8000` |
| `MIN_PAGES_FOR_TOC` | `src/pipeline.js` | `3` |

## Milestone 5 — Config, Watch, Cover (Pending)

- [ ] .forgrrc config file support
- [ ] Frontmatter support in Markdown files
- [ ] Watch mode (--watch flag, re-render on file change)
- [ ] Plugin system for custom Markdown transformations
- [ ] Implement cover_page preset feature flag (cover.html partial)
- [ ] Implement section_numbering preset feature flag
- [ ] Populate templates/partials/ directory

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
