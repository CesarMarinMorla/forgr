# forgr — Tasks

## Milestone 1 — Published (v0.1.0)

### Project setup
- [x] Git repo initialized, remote set
- [x] AGENTS.md written with full spec
- [x] .gitignore (node_modules, *.pdf, .env, logs, editor dirs, dist/, coverage/)
- [x] package-lock.json untracked and ignored
- [x] package.json — repository, bugs, homepage, author, keywords, files fields
- [x] LICENSE (MIT)

### Core pipeline
- [x] package.json — all dependencies pinned (playwright-core at exact 1.61.1)
- [x] Chromium downloaded on first `forgr` run, not during install
- [x] preuninstall script auto-removes Chromium cache
- [x] `forgr uninstall` command removes cache without removing the tool
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
- [x] npm test = 29 tests (21 unit + 8 integration), all passing
- [x] npm run test:unit = unit tests only (21 tests, excludes integration)
- [x] integration test accepts `FORGR_PRESET` env var (terminal|minimal|technical|academic, default terminal) to validate one preset at a time; rejects unknown values
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

## HIGH PRIORITY — Presets (3 non-stock need full redesign)

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
- [x] Define academic's design identity (typeset-journal: serif body, marginal section folios, citation-friendly)
- [x] Write full CSS with distinct palette, scholarly typography (serif + justified, rubric-blue accent, left margin rail with roman-numeral section folios, superscript citation links, ruled tables, QED halmos on blockquotes, TOC dot leaders, opening drop cap)
- [x] Test with all fixture files

---

## Pending — Milestone 2 (Mermaid Rendering & Image Embedding)

Done so far:
- [x] Mermaid fence renderer emits `<div class="mermaid">` with raw source (src/markdown.js)
- [x] Mermaid fixtures added: test/fixtures/mermaid.md (flowchart/sequence/state/class) + diagrams in comprehensive.md (sections 6.3, 6.4)
- [x] `pdf.js` already calls `mermaid.run()` when a `mermaid` global exists

Current gap: no mermaid library is loaded into the Playwright page (base.html has no script), so diagrams render as raw source. Local images are emitted as plain `<img src>` and are not inlined, so they do not resolve under `page.setContent()` (no base URL). Both need the same "embed without a base URL" capability.

### Approach
Render mermaid to SVG inside the existing Playwright page (reuse `pdf.js`'s page). Inline local images to base64 data URIs on the Node side during markdown rendering, using the input file's directory as the resolution root. Keep the single exit-boundary / throw-on-error discipline from the refactor (Issues 1, 6); no `process.exit` in library modules.

### Mermaid rendering
- [ ] Add `mermaid` to `package.json` pinned at an EXACT version (no `^`/`~`); record the version in the Architecture Assessment.
- [ ] Load the library into the page in `pdf.js`: before `mermaid.run()`, inject the dist once per page via `page.addScriptTag({ path: <mermaid dist> })` resolved from `node_modules` (cache the handle so it is added a single time).
- [ ] Configure per preset: `mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { primary, lineColor, textColor, ... } })` keyed by the active preset, derived from the preset's `--signal` / `--ink` so diagrams match each preset's accent (4 distinct diagram palettes).
- [ ] Render with `mermaid.run({ nodes: [...document.querySelectorAll('.mermaid')] })` and reuse the existing `mermaidReady` flag + `waitForFunction` until every `.mermaid` has an `<svg>`.
- [ ] Fail loudly: if a diagram throws during render, collect the error and `throw new Error(\`mermaid: failed to render diagram ${i}: ${message}\`)` — no silent drop, no raw-source leak.
- [ ] Style `.mermaid` (and its `<svg>`) in base.html: centered, `max-width: 100%`, vertical margin, light surface; per-preset accent comes from `themeVariables`, not from CSS overrides.

### Image embedding
- [ ] Pass the input file's directory into `renderMarkdown(source, { baseDir })` from `pipeline.js` (resolved input dir).
- [ ] Add a custom `md.renderer.rules.image` in `markdown.js` that, for a local `src` (not `http(s):` and not `data:`), resolves against `baseDir`, reads the file with `readFileSync`, detects mime by extension (.png/.jpg/.jpeg/.gif/.webp/.svg), and emits `<img src="data:<mime>;base64,…">`. Remote URLs and existing `data:` URIs pass through unchanged.
- [ ] Fail loudly: if a local image path does not exist, `throw new Error(\`image not found: ${path}\`)`.
- [ ] Unit-test in `markdown.test.js`: a relatively-referenced fixture image is inlined to a `data:` URI; an `http(s)` URL is left untouched; a missing local path throws.

### Shared: SVG/PNG serialization
- [ ] Add a helper that serializes a rendered mermaid `<svg>` to PNG (`svg → XML → Image → canvas → toDataURL`). Used by Milestone 3 (live preview) and as a fallback when SVG-in-PDF is undesirable. Reuses the same base64 path as image embedding.

### Preset theming
- [ ] Map each preset's tokens to mermaid `themeVariables` — terminal: teal, minimal: graphite, technical: amber, academic: rubric blue — so diagrams stay visually consistent with their preset.

### Testing
- [ ] Add `test/mermaid.test.js` (integration): render `test/fixtures/mermaid.md` for each preset in a Playwright page, assert every `.mermaid` div is replaced by an `<svg>` and no raw `<div class="mermaid">` remains, and that diagrams use the preset accent.
- [ ] Extend the per-preset integration run (`FORGR_PRESET`) to cover `mermaid.md`.
- [ ] Add a local-image fixture (e.g. `test/fixtures/assets/sample.png`) referenced from a markdown; assert it inlines and renders in the PDF.

---

## Pending — Milestone 3 (TUI Preset Picker)

- [ ] `--interactive` flag on CLI
- [ ] Scan ~/.config/forgr/presets/*.json for user presets
- [ ] Ink-based TUI — display preset names and descriptions
- [ ] Arrow key navigation, Enter to select and render
- [ ] No PDF preview (that is Milestone 4)

---

## Pending — Milestone 4 (TUI with Live PDF Preview)

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
- [x] TOC styling in all 4 presets (.toc, .toc__title, .toc__list, .toc__item--hN)
- [x] Input: docs/elements.md — checklist of all basic styling elements

### Hardcoded constants (configurable later via .forgrrc)

| Constant | Location | Value |
|---|---|---|
| `LONG_DOC_WORDS` | `src/pipeline.js` | `8000` |
| `MIN_PAGES_FOR_TOC` | `src/pipeline.js` | `3` |

## Pending — Milestone 5 (Config, Watch, Cover)

- [ ] .forgrrc config file support
- [ ] Frontmatter support in Markdown files
- [ ] Watch mode (--watch flag, re-render on file change)
- [ ] Plugin system for custom Markdown transformations
- [ ] Implement cover_page preset feature flag (cover.html partial)
- [ ] Implement section_numbering preset feature flag
- [ ] Populate templates/partials/ directory

---

## Publishing workflow

- `npm publish` is manual: run `npm publish` from the project root
- Authentication: `npm login` (passkey/browser) before publish
- Version bumps: update `version` in package.json, commit, tag (`v0.2.0`), then publish
- CI auto-publish: future option — wire up GitHub Actions to publish on `v*` tag push

---

## Design decisions locked in (do not revisit without owner sign-off)

- Margins: 2cm all sides via Playwright page.pdf(), never via CSS body padding
- Output: silent overwrite, no confirmation prompt (required for --watch)
- Playwright version: pinned exactly at 1.61.1 (no ^ or ~)
- Heading (terminal preset): all-mono IBM Plex Mono 400, section counter in teal (#1C756E). Other presets define their own heading treatments (see Presets section).
- Fail loudly on all errors — no silent degradation anywhere in the pipeline

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
