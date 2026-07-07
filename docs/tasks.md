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
- [x] src/cli.js — commander, --output, --preset, uninstall command, defaults to systems-log
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
- [x] src/templates/presets/systems-log.css — default preset (all-mono IBM Plex Mono headings, graphite/teal palette, terminal code blocks, NOTE callouts, tabular numbers, pagination control)
- [x] src/templates/presets/anthropic.css — warm editorial preset
- [x] src/templates/presets/minimal.css, technical.css, academic.css — populated with full CSS variable set and element rules

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
- [x] test/integration.test.js — end-to-end PDF generation test
- [x] npm test = 22 tests (all passing)
- [x] npm run test:unit = unit tests only (excludes integration)

### Dev tooling
- [x] scripts/font-diagnostic.js — 7-comparison side-by-side font diagnostic PDF
- [x] scripts/postinstall.js — manual Chromium install script
- [x] scripts/preuninstall.js — Chromium cache cleanup on uninstall
- [x] test/fixtures/ — 7 .md fixtures (basic, code, comprehensive, converter_features, formatting, lists, tables)
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
- [ ] Define technical's design identity (dense, monospace-heavy, grid-like tables)
- [ ] Write full CSS with distinct palette, infra/ops tooling feel
- [ ] Test with all fixture files

### academic.css — from functional stub to intentional design
- [ ] Define academic's design identity (serif body, footnote annotations, citation-friendly)
- [ ] Write full CSS with distinct palette, scholarly typography
- [ ] Test with all fixture files

---

## Pending — Milestone 2 (TUI Preset Picker)

- [ ] `--interactive` flag on CLI
- [ ] Scan ~/.config/forgr/presets/*.json for user presets
- [ ] Ink-based TUI — display preset names and descriptions
- [ ] Arrow key navigation, Enter to select and render
- [ ] No PDF preview (that is Milestone 3)

---

## Pending — Milestone 3 (TUI with Live PDF Preview)

- [ ] After preset selection, render first page as PNG via Playwright screenshot
- [ ] Display PNG in terminal via terminal-image
- [ ] Cache by content_hash + preset_hash (~200ms warm target)
- [ ] Fallback to text mode if terminal lacks image support

---

## Pending — Milestone 4 (Mermaid + Images)

- [ ] Image inlining: resolve local image paths to base64 data URIs during HTML generation

---

## Pending — Milestone 5 (Config, Watch, Cover, TOC)

- [ ] .forgrrc config file support
- [ ] Frontmatter support in Markdown files
- [ ] Watch mode (--watch flag, re-render on file change)
- [ ] Plugin system for custom Markdown transformations
- [ ] Implement cover_page preset feature flag (cover.html partial)
- [ ] Implement toc preset feature flag (toc.html partial)
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
- Heading: all-mono IBM Plex Mono 400, section counter in teal (#1C756E)
- Fail loudly on all errors — no silent degradation anywhere in the pipeline

---

## Architecture Assessment (post-Milestone 1)

Assessed 2026-07-06. Overall structure is sound — module boundaries match the spec and pipeline separation is clean. No major restructuring needed. The issues below are real but non-blocking for Milestone 1; items 1 and 2 will cause friction when the TUI (Milestone 2) and watch mode (Milestone 5) are added on top of the same pipeline.

### Issue 1 — process.exit() scattered across modules (priority: medium)

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

### Issue 2 — BROWSERS_PATH / FORGR_DIR defined in multiple places (priority: low)

The path constants are defined independently in:
- `src/browsers-path.js` (canonical)
- `src/cli.js` (duplicate — `FORGR_DIR` and `BROWSERS_PATH` re-derived)
- `scripts/postinstall.js` (duplicate — `BROWSERS_PATH` re-derived)

`cli.js` should import from `browsers-path.js` instead of re-deriving. `postinstall.js` runs outside the src tree and cannot import from it, so its duplicate is acceptable — but it should have a comment acknowledging this.

Affects: `src/cli.js`.

### Issue 3 — markdown.js is doing two jobs (priority: low)

`markdown.js` now handles both highlight.js initialisation (35+ imports and registrations, ~100 lines) and markdown-it configuration. These are separate concerns. As the language list grows the file will become hard to scan.

Suggested split: extract hljs setup to `src/highlighter.js`, import the configured instance into `markdown.js`.

Affects: `src/markdown.js`.

### Issue 4 — Stub presets produce unstyled output (priority: resolved)

`minimal.css`, `technical.css`, and `academic.css` were empty placeholder files (35 bytes each). They have been populated with a complete CSS variable set and element rules. Each preset has its own palette (minimal/technical use graphite-teal, academic uses serif/brown).

### Issue 5 — Silent font fallback violates the fail-loudly principle (priority: low)

In `template.js`, all three font reads use `.catch(() => null)`. If a font file is missing, the template silently falls back to system fonts with no log output. The output looks wrong without any indication of why.

Per the project-wide fail-loudly rule (AGENTS.md, CLI Behavior section), this should at minimum log a warning to stderr when a font file is not found.

Affects: `src/template.js`.

### Issue 6 — No error boundary in pipeline.js (priority: medium)

`pipeline.js` calls `renderMarkdown`, `renderTemplate`, and `generatePdf` with no wrapping try/catch. If any of those throw an unhandled error (rather than calling `process.exit`), Node surfaces it as an unhandled promise rejection with a raw stack trace. A single try/catch at the pipeline level that re-throws a clean, user-facing error would fix this, and pairs well with Issue 1 (once modules throw instead of exiting, the pipeline is the right place to catch and re-format).

Affects: `src/pipeline.js`.

---

## Refactoring tasks (derived from assessment above)

- [ ] Refactor pdf.js, template.js, pipeline.js to throw errors instead of calling process.exit — add single exit boundary in cli.js (Issue 1, 6)
- [ ] Import BROWSERS_PATH from browsers-path.js in cli.js instead of re-deriving (Issue 2)
- [ ] Extract hljs setup to src/highlighter.js (Issue 3)
- [ ] Log a warning in template.js when a font file is not found (Issue 5)
