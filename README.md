# forgr

Convert Markdown files into polished PDFs. One command, zero config.

```
forgr report.md
```

Outputs `report.pdf` in the same directory.

## Install

```bash
npm install -g --allow-scripts=forgr forgr
```

The `--allow-scripts=forgr` flag is required for npm to run the `postinstall` step that downloads Chromium (~130MB). This is a one-time download. Subsequent installs use the cached binary.

If you installed without the flag and got no Chromium, run this once:

```bash
playwright install chromium
```

### Why Chromium?

Chromium is the only rendering engine forgr uses. There is no fallback. The download happens once and is stored in Playwright's own cache directory (`~/Library/Caches/ms-playwright` on macOS) — it does not touch your existing Chrome installation or modify system paths.

## Usage

```bash
# Basic — output goes to same directory as input
forgr document.md

# Custom output path
forgr document.md --output /path/to/output.pdf
```

## Requirements

- Node.js 18+

## Design

Output uses the "Systems Log" preset by default: IBM Plex Sans for headings, IBM Plex Mono for code and labels, a graphite-and-teal palette, auto-numbered sections, and terminal-style code blocks.

## Roadmap

- Milestone 1 — barebones CLI, stock preset (done)
- Milestone 2 — TUI preset picker
- Milestone 3 — live PDF preview in TUI
- Milestone 4 — Mermaid diagrams, image embedding
- Milestone 5 — config files, watch mode, cover page, TOC
