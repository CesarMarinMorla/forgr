# Forgr — Implementation Specification

*Last reviewed 2026-07-17 against the source tree. Where this doc and the code disagree, the code wins.*

## Overview

Forgr is a CLI tool that converts Markdown into polished PDFs. The visual target is the "Artifacts" document style: clean sans-serif headers, generous whitespace, a single accent colour, subtle code blocks, and optional Mermaid diagrams.

The core command is `forgr file.md` -> `file.pdf` with zero configuration. A companion `forgr-tui` command opens an interactive preset picker.

## Design Goals

- **Zero-config polished output** — one command, a designed PDF.
- **Single Chromium instance** — Mermaid rendering happens in the same Playwright page, no separate process.
- **Preset system** — swappable CSS themes with no code changes.
- **Extensible** — users can drop custom CSS/JSON presets in `~/.config/forgr/presets/`.
- **Self-contained** — fonts embedded as base64, no network needed to render.

## Architecture

Node.js + Playwright. A single browser launch handles markdown rendering, Mermaid, and PDF capture.

| Concern | Solution |
|--------|----------|
| Markdown -> HTML | `markdown-it` + highlight.js, emoji, sub/sup, anchor |
| Templating | Handlebars (base template + preset CSS + embedded fonts) |
| Mermaid | Mermaid.js in the same Playwright page (awaited `mermaid.run()`) |
| PDF | Playwright Chromium, one launch per conversion |
| Syntax highlighting | highlight.js (server-side, curated language set in `src/highlighter.js`) |
| Fonts | IBM Plex Sans (display) + IBM Plex Mono (code/labels), base64-embedded |
| Presets | JSON registry (`src/presets.js`) + CSS files under `src/templates/presets/` |

### Pipeline

`pipeline.js` is the orchestrator. It reads the file, parses front-matter (`frontmatter.js`), builds the config from CLI flags > front-matter > `config.js` DEFAULTS, renders markdown (`markdown.js`), assembles the HTML (`template.js`), and generates the PDF (`pdf.js`). If TOC is auto, it renders once to measure word count and page count, then re-renders with the TOC when the threshold is met.

### Modules

| Module | Responsibility |
|---|---|
| `pipeline.js` | Orchestrator: read -> front-matter -> config -> render -> PDF |
| `frontmatter.js` | Parse/write YAML front-matter (shared keys + `forgr:` namespace) |
| `markdown.js` | markdown-it setup, image inlining, mermaid fences, TOC HTML |
| `template.js` | Handlebars compile, preset CSS + font embedding |
| `pdf.js` | Playwright lifecycle, mermaid render, page count, PDF write |
| `config.js` | Single `DEFAULTS` object |
| `presets.js` | Built-in preset registry + user-preset scan |
| `highlighter.js` | Curated highlight.js instance (~50 languages) |
| `utils.js` | `WRITEABLE_KEYS`, `buildWriteKeys()`, output/error helpers |
| `doctor.js` | `forgr doctor` health checks |
| `browsers-path.js` | Chromium path management + install command |
| `tui.js` | Ink/React interactive preset picker |

## CLI Surface

### `forgr`

- `convert <input>` (default command) — render Markdown to PDF.
  - `-o, --output <path>` — output path (default: same dir, `<basename>.pdf`)
  - `-p, --preset <name>` — preset (default `terminal`)
  - `--toc` / `--no-toc` — force TOC on/off
  - `--write` — persist `preset`/`toc` into the file's front-matter (only these two keys are writeable)
- `uninstall` — remove the Chromium cache at `~/.forgr/browsers`.
- `doctor` — diagnose the install.
  - `-f, --fix` — auto-fix where possible (download Chromium, remove malformed user presets)
  - `-v, --verbose` — show inspected paths, sizes, timestamps

**Output path resolution:** default is the same directory as the input file, same basename, `.pdf` extension. `--output` overrides it. **Overwrite is silent** — no prompt. A failed write removes any partial file.

### `forgr-tui`

Interactive preset picker (Ink/React). Lists built-in and user presets; selecting a built-in renders immediately. Selecting a user preset currently prints a "coming in Milestone 5" message and exits.

## Chromium

Chromium is mandatory — there is no fallback PDF engine. It is **not** downloaded on `npm install`. Instead it downloads lazily on the first `forgr convert`/`forgr-tui` run (or via `npm run install-chromium`, or `forgr doctor --fix`). The binary lives in `~/.forgr/browsers` (set via `PLAYWRIGHT_BROWSERS_PATH`).

## Presets

Five built-ins, each a CSS file overriding custom properties in `base.html`:

| Name | Look |
|---|---|
| `terminal` (default) | All-mono headings, graphite/teal palette, terminal code panes |
| `minimal` | Plain black-on-white, hairline rules, no accent |
| `technical` | Dense monospace ops/infra style, amber accent, full-grid tables |
| `academic` | Typeset-journal serif, marginal counters, restrained typography |
| `newsletter` | Warm editorial off-white, coral accents, pull-quotes |

User presets are JSON descriptors under `~/.config/forgr/presets/` referencing external CSS.

## Styling — `terminal` preset tokens

| Token | Value | Role |
|---|---|---|
| `--ink` | `#1C2128` | Primary text, headings |
| `--ink-soft` | `#4A5262` | Section-number labels, blockquote text |
| `--graphite` | `#6E7683` | Metadata, table headers |
| `--signal` | `#2DD4BF` | The one accent — status dot, blockquote rule, link underline |
| `--signal-dim` | `#0F766E` | Link text, section-number prefix, inline code |
| `--line` / `--line-soft` | `#D8DCE2` / `#EAECEF` | Hairline rules |
| `--surface` | `#F7F8FA` | Inline-code background, table-row hover |
| `--surface-code` | `#12161C` | Code-block background (terminal pane) |
| `--radius` | `3px` | Sharp corners throughout |

Fonts: IBM Plex Sans (display), IBM Plex Mono (meta/code/labels). Exactly one accent hue at two lightness steps — never a second accent.

Signature elements: a doc-meta header strip (status dot + mono label + timestamp), auto-numbered `h2` sections via CSS counters, `NOTE`-labelled blockquotes, and code blocks styled as terminal panes with three title-bar dots.

**Margins:** 2cm on all sides, set exclusively via Playwright's `page.pdf()` — never via CSS body padding (which stays `padding: 0` under `@media print`). The content column is capped at `max-width: 720px` inside that margin box.

## Defaults (`src/config.js`)

| Key | Default |
|---|---|
| `preset` | `terminal` |
| `toc` | `'auto'` |
| `tocWordThreshold` | `8000` |
| `minPagesForToc` | `3` |
| `tocTitle` | `Contents` |
| `docMeta` | `true` |
| `dateFormat` | `iso` |
| `footer` | `page-numbers` |
| `cover` | `false` |
| `sectionNumbering` | `false` |
| `paperFormat` | `A4` |
| `margins` | `{ top/bottom/left/right: '2cm' }` |

**TOC logic:** `toc: true` always renders; `false` never; `'auto'` (default) renders only when word count >= 8000 **and** page count >= 3.

## Front-matter

Keys live at the top of the `.md` file. Shared keys (`title`, `date`, `author`) are read but not written. `forgr:`-namespaced keys control rendering. Precedence: CLI flag > `forgr:` key > shared key > default. `layout` is accepted as a fallback for `preset`.

| Key | Type | Default |
|---|---|---|
| `preset` | string | `terminal` |
| `toc` | `true` / `false` / `'auto'` | `'auto'` |
| `tocTitle` | string | `Contents` |
| `docMeta` | boolean | `true` |
| `dateFormat` | `iso` / `locale` | `iso` |
| `footer` | `page-numbers` / `page-x-of-y` / `none` | `page-numbers` |
| `cover` | boolean | `false` |
| `sectionNumbering` | boolean | `false` |
| `paperFormat` | `A4` / `Letter` | `A4` |
| `margins` | object | all `2cm` |

`--write` persists only the `preset` and `toc` flags. Files without front-matter render with all defaults. Unrecognized keys are ignored (Obsidian/Jekyll/Hugo safe).

## Markdown Rendering

- Plugins: highlight.js (curated set, language required on fence), emoji (full), sub, sup, anchor.
- Local images inlined as base64 data URIs (png/jpg/gif/webp/svg); remote and data: URLs pass through.
- Mermaid fences render as `<div class="mermaid">` and become SVG in the browser. A bad diagram fails loudly with its source and position.
- H2 leading numerals are stripped (the CSS counter owns numbering). Table numeric cells get `.num` spans for tabular alignment.

## Testing

`npm test` runs 92 tests across `test/unit/` (pure modules), `test/integration/` (end-to-end across presets/fixtures), and `test/mermaid/` (per-preset diagram rendering). `npm run test:unit`, `test:integration`, `test:mermaid` scope individually. Integration tests accept `FORGR_PRESET` to validate one preset at a time.

## Key Decisions (locked)

- **Fail loudly, never degrade silently** — bad input, unwritable output, Chromium launch failure, or a broken Mermaid diagram all produce a clear error and a non-zero exit. No partial or empty PDF is ever written.
- **Silent overwrite** by default — required for future `--watch` mode.
- **Playwright pinned exactly** (`playwright-core` 1.61.1, no `^`/`~`) so Chromium build drift can't change rendering.
- **Margins via Playwright, not CSS** — verified: CSS-only padding renders content flush to the page edge.
- **Mermaid runs unconditionally** on every document (no block-presence detection) — removes a class of "did we detect Mermaid" bugs.
