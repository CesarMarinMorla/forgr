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

The first install downloads Chromium (~130MB) automatically. This is a one-time step and takes longer than a typical package install. Subsequent installs use the cached binary.

## Usage

```bash
# Basic
forgr document.md

# Custom output path
forgr document.md --output /path/to/output.pdf
```

## Requirements

- Node.js 18+

## Design

Output uses the "Systems Log" preset by default: IBM Plex Sans for headings, IBM Plex Mono for code and labels, a graphite-and-teal palette, auto-numbered sections, and terminal-style code blocks.

## Roadmap

- Milestone 1 — barebones CLI, stock preset
- Milestone 2 — TUI preset picker
- Milestone 3 — live PDF preview in TUI
- Milestone 4 — Mermaid diagrams, image embedding
- Milestone 5 — config files, watch mode, cover page, TOC
