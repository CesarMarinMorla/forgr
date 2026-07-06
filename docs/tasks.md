# forgr — Tasks

## Done

### Project setup
- [x] Git repo initialized, remote set (git@github.com:CesarMarinMorla/forgr.git)
- [x] AGENTS.md copied and updated (IBM Plex Sans/Mono as priority fonts, Inter references removed)
- [x] .gitignore (node_modules, *.pdf, .env, logs, editor dirs, dist/, coverage/)
- [x] package-lock.json untracked and ignored
- [x] README.md with accurate install instructions and Chromium prompt workflow

### Milestone 1 — Barebones CLI
- [x] package.json — all dependencies pinned (playwright at exact 1.61.1, no ^ or ~)
- [x] postinstall script wired (playwright install chromium)
- [x] bin/forgr entry point (executable)
- [x] src/cli.js — commander setup, --output flag, --preset flag
- [x] src/pipeline.js — orchestrator: read file, render markdown, assemble HTML, generate PDF
- [x] src/markdown.js — markdown-it with highlight.js, emoji, sub, sup plugins
- [x] src/markdown.js — mermaid fence renderer (fenced mermaid -> .mermaid div, no regex pass)
- [x] src/markdown.js — core rule stripping leading N. / N) prefixes from h2 headings
- [x] src/template.js — Handlebars compilation, preset CSS loading, font base64 embedding
- [x] src/pdf.js — Playwright browser lifecycle, mermaid.run() unconditional, 2cm margins, partial file cleanup on error
- [x] src/templates/base.html — Handlebars layout with @font-face declarations and doc-meta header
- [x] src/templates/presets/stock.css — Systems Log preset (design tokens, h2 counters, NOTE callouts, terminal dots)
- [x] src/templates/presets/anthropic.css — warm editorial preset (not fully tested)
- [x] src/templates/presets/minimal.css, technical.css, academic.css — placeholders
- [x] Chromium missing error message — clear prompt to run `npx playwright install chromium`
- [x] Output path resolution — default same dir as input, --output override, silent overwrite
- [x] doc-meta header label populated from input filename (not hardcoded)

### Fonts downloaded (valid woff2 confirmed via `file` command)
- [x] IBMPlexSans-Variable.woff2 (45KB) — from @fontsource-variable/ibm-plex-sans
- [x] IBMPlexMono-400.woff2 (14KB) — from @fontsource/ibm-plex-mono
- [x] IBMPlexMono-600.woff2 (15KB) — from @fontsource/ibm-plex-mono
- [x] JetBrainsMono-Regular.woff2 (90KB) — from github.com/JetBrains/JetBrainsMono
- [x] Urbanist-Variable.woff2 (27KB) — from @fontsource-variable/urbanist

### Test suite
- [x] test/markdown.test.js — 11 unit tests (paragraph, heading, mermaid fence, code blocks, inline code, blockquote, table, sub/sup, h2 number stripping)
- [x] test/pipeline.test.js — 4 unit tests (output path resolution)
- [x] test/integration.test.js — 1 integration test (real PDF generated, magic bytes verified)
- [x] npm run test:unit and npm test scripts in package.json
- [x] Last confirmed passing state: 15/15 unit + integration tests

### Other
- [x] scripts/font-diagnostic.js — generates font-diagnostic.pdf showing all font combinations
- [x] test/fixtures/sample.md — general test fixture
- [x] test/fixtures/anthropic-design.md — brandmd Anthropic design doc fixture
- [x] docs/font-investigation.md — detailed notes on font loading problem

---

## Pending — immediate (font issue, must resolve before any commit)

- [ ] **Confirm whether IBMPlexMono-400.woff2 (14KB subset) actually loads in Chromium PDF**
      Run `node scripts/font-diagnostic.js` and check font-name-test.pdf.
      If 14KB subset fails, re-download full 293KB version from @fontsource/ibm-plex-mono
      (the fontsource pack contains it — extract ibm-plex-mono-latin-400-normal.woff2).

- [ ] **Confirm Urbanist-Variable.woff2 renders in h2 text (not falling back to system sans)**
      Add a row to font-diagnostic.js comparing Urbanist vs system sans at the same size.

- [ ] **Confirm h2::before (IBM Plex Mono 400) is visually distinct from h2 text (Urbanist 700)**
      User confirmed they look identical. Suspected cause: fontsource subset missing digit glyphs
      or font-family name mismatch. See docs/font-investigation.md for full details.

- [ ] **Once fonts confirmed: visual review of design-stock.pdf against reference screenshot**
      Reference: /Users/cesar/Downloads/files/SCR-20260706-duvm.png

- [ ] **Once visual review approved: commit all pending changes**
      Files changed but not committed:
      - src/templates/presets/stock.css
      - src/templates/presets/anthropic.css
      - src/templates/base.html
      - src/template.js
      - src/cli.js
      - src/pipeline.js
      - src/markdown.js
      - src/assets/fonts/ (all font files)
      - scripts/font-diagnostic.js
      - test/fixtures/anthropic-design.md
      - docs/font-investigation.md
      - docs/tasks.md (this file)

- [ ] **Run full test suite after commit to confirm nothing regressed**

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
- Heading fonts: IBM Plex Mono 400 for section numbers, Urbanist 700 for heading text
- Section number color: #1C756E
- Fail loudly on all errors — no silent degradation anywhere in the pipeline
