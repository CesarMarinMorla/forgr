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

This installs the forgr CLI and its dependencies, including Playwright. Chromium is not downloaded yet at this point.

On your first `forgr` run, the tool detects that Chromium is missing and downloads it automatically (~130MB, one time) into `~/.forgr/browsers`. Subsequent runs skip this step entirely.

If you want to download Chromium upfront before the first run (e.g. in CI to separate the download from the render job):

```bash
npm install -g forgr
forgr --version          # ensures the package is ready
npm run install-chromium # downloads Chromium explicitly
```

## Uninstall

Free up the Chromium cache (~130MB) without removing the tool:

```bash
forgr uninstall
```

The next `forgr` run will re-download Chromium automatically.

Full removal:

```bash
forgr uninstall
npm uninstall -g forgr
```

**`npm uninstall -g forgr` alone will attempt to clean up the cache via a `preuninstall` hook, but this is not guaranteed in all npm versions. Run `forgr uninstall` first to be safe.**

## Usage

```bash
# Output goes to the same directory as the input file
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

The default **systems-log** preset uses IBM Plex Sans for body text, IBM Plex Mono for code, labels, and section markers, a graphite-and-cold-teal palette, auto-numbered sections, and terminal-style code blocks. Additional presets (anthropic, minimal, technical, academic) are available via `--preset`.

## Roadmap

- Milestone 1 - barebones CLI, stock preset (done)
- Milestone 2 - TUI preset picker
- Milestone 3 - live PDF preview in TUI
- Milestone 4 - Mermaid diagrams, image embedding
- Milestone 5 - config files, watch mode, cover page, TOC
