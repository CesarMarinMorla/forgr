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

Chromium (~130MB) is downloaded automatically on your first `forgr` run into `~/.forgr/browsers`. No manual steps needed.

To pre-download Chromium ahead of time (e.g., in CI):

```bash
npm run install-chromium
```

## Uninstall

To remove the Chromium cache (~130MB) without uninstalling the tool:

```bash
forgr uninstall
```

To fully remove forgr and its Chromium cache:

```bash
forgr uninstall
npm uninstall -g forgr
```

Running `npm uninstall -g forgr` alone also cleans up the cache automatically via a `preuninstall` hook, but this is not guaranteed to run in all npm versions. Running `forgr uninstall` first is the reliable path.

## Usage

```bash
# Basic — output goes to same directory as input
forgr document.md

# Custom output path
forgr document.md --output /path/to/output.pdf

# Choose a preset
forgr document.md --preset systems-log
forgr document.md --preset anthropic
```

## Requirements

- Node.js 18+

## Design

Output uses the **systems-log** preset by default: IBM Plex Sans body text, IBM Plex Mono for code/labels/markers, all-mono IBM Plex Mono for section headings, a graphite-and-cold-teal palette, auto-numbered sections, terminal-style code blocks, and numbered table data. Additional presets (anthropic, minimal, technical, academic) are available via `--preset`.

## Roadmap

- Milestone 1 — barebones CLI, stock preset (done)
- Milestone 2 — TUI preset picker
- Milestone 3 — live PDF preview in TUI
- Milestone 4 — Mermaid diagrams, image embedding
- Milestone 5 — config files, watch mode, cover page, TOC
