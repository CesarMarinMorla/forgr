# forgr

Convert Markdown files into polished PDFs. One command, zero config.

```
forgr report.md
```

Outputs `report.pdf` in the same directory.

## Install

```bash
npm install -g forgr
```

The first time you run `forgr`, it will prompt you to install Chromium (~130MB) if it's not already present:

```bash
npx playwright install chromium
```

This is a one-time step. The browser binary is stored in Playwright's cache directory (`~/Library/Caches/ms-playwright` on macOS) and does not touch your existing Chrome installation.

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
