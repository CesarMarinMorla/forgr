# forgr — Tasks

## Milestone 1 — Barebones CLI (COMPLETE)

### Project setup
- [x] Git repo initialized, remote set
- [x] AGENTS.md written with full spec
- [x] .gitignore (node_modules, *.pdf, .env, logs, editor dirs, dist/, coverage/)
- [x] package-lock.json untracked and ignored

### Core pipeline
- [x] package.json — all dependencies pinned (playwright at exact 1.61.1)
- [x] postinstall script wires `playwright install chromium`
- [x] bin/forgr entry point (executable)
- [x] src/cli.js — commander, --output, --preset flags, defaults to systems-log
- [x] src/pipeline.js — orchestrator: read -> render -> template -> PDF
- [x] src/markdown.js — markdown-it + highlight.js, emoji, sub, sup, mermaid fence renderer
- [x] src/markdown.js — h2 number stripping (core rule)
- [x] src/markdown.js — wrapTableNumbers() wraps <td> numbers in .num spans
- [x] src/template.js — Handlebars, preset CSS loading, font base64 embedding
- [x] src/pdf.js — Playwright lifecycle, mermaid.run(), 2cm margins, partial file cleanup
- [x] src/templates/base.html — @font-face blocks, doc-meta header (dot, label, timestamp)

### Presets
- [x] src/templates/presets/systems-log.css — default preset (all-mono IBM Plex Mono headings, graphite/teal palette, terminal code blocks, NOTE callouts, tabular numbers, pagination control)
- [x] src/templates/presets/anthropic.css — warm editorial preset
- [x] src/templates/presets/minimal.css, technical.css, academic.css — placeholders

### Fonts
- [x] IBMPlexSans-Variable.woff2 (45KB) — @fontsource-variable
- [x] IBMPlexMono-400.woff2 (49KB) — full file from @ibm/plex-mono@2.5.0 (replaced 14KB subset)
- [x] IBMPlexMono-600.woff2 (50KB) — full file from @ibm/plex-mono@2.5.0 (replaced 15KB subset)
- [x] JetBrainsMono-Regular.woff2 (90KB) — from JetBrains GitHub
- [x] Urbanist-Variable.woff2 (27KB) — @fontsource-variable

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
- [x] npm test = 16 tests (all passing)
- [x] npm run test:unit = unit tests only (excludes integration)

### Dev tooling
- [x] scripts/font-diagnostic.js — 7-comparison side-by-side font diagnostic PDF
- [x] test/fixtures/ — 7 comprehensive .md fixtures (basic, code, comprehensive, converter_features, formatting, lists, tables)
- [x] docs/font-investigation.md — font issue investigation and resolution notes

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

- [ ] Bundle mermaid.min.js into src/assets/
- [ ] Wire mermaid.run() call in pdf.js (architecture already in place)
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

## Design decisions locked in (do not revisit without owner sign-off)

- Margins: 2cm all sides via Playwright page.pdf(), never via CSS body padding
- Output: silent overwrite, no confirmation prompt (required for --watch)
- Playwright version: pinned exactly at 1.61.1 (no ^ or ~)
- Heading: all-mono IBM Plex Mono 400, section counter in teal (#1C756E)
- Fail loudly on all errors — no silent degradation anywhere in the pipeline
