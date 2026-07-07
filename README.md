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

This installs the forgr CLI and its dependencies. Chromium (~195MB) is not downloaded during install — it downloads automatically on your first `forgr` run into `~/.forgr/browsers`. Subsequent runs skip this step.


## Uninstall

Free up the Chromium cache (~195MB) without removing the tool:

```bash
forgr uninstall
```

The next `forgr` run will re-download Chromium automatically.

Full removal:

```bash
npm uninstall -g forgr
```

The `preuninstall` hook automatically removes the Chromium cache. No separate step needed.

## Usage

```bash
# Output goes to the same directory as the input file
forgr document.md

# Custom output path
forgr document.md --output /path/to/output.pdf

# Choose a preset
forgr document.md --preset terminal
```


## Requirements

- Node.js 18+

## Design

The default **terminal** preset uses IBM Plex Sans for body text, IBM Plex Mono for code, labels, and section markers, a graphite-and-cold-teal palette, auto-numbered sections, and terminal-style code blocks. Additional presets (minimal, technical, academic) are available via `--preset`.

## Roadmap

- Milestone 1 - barebones CLI, stock preset (done)
- Milestone 2 - TUI preset picker
- Milestone 3 - live PDF preview in TUI
- Milestone 4 - Mermaid diagrams, image embedding
- Milestone 5 - config files, watch mode, cover page, TOC
