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

The default **terminal** preset uses IBM Plex Sans for body text, IBM Plex Mono for code, labels, and section markers, a graphite-and-cold-teal palette, auto-numbered sections, and terminal-style code blocks.

## Presets

Pick a design with `--preset <name>`. Each preset is a standalone CSS theme built from the ground up, so the five are visually distinct rather than reskins of one template.

| Preset | Identity | Best for |
|---|---|---|
| `terminal` | All-mono headings, graphite/cold-teal palette, dark terminal-pane code blocks, `01 02 03` section counters | Infra reports, status dashboards, incident reviews |
| `minimal` | System sans, single gray, hairline rules, no accent | Clean, neutral documents |
| `technical` | Fully monospace, amber accent, full-grid tables, tinted code panels, `[NN]` bracket section markers | Runbooks, config specs, ops notes |
| `academic` | Book serif throughout, pine-green accent, arabic section numbers in the margin against a hairline vertical rule | Papers, theses, scholarly write-ups |
| `newsletter` | Warm off-white paper, serif headings, sans-serif body, terra-cotta coral accent, generous measure | Product changelogs, editorial round-ups, org announcements |

```bash
forgr document.md --preset technical
```

## Roadmap

- Milestone 1 - barebones CLI, stock preset (done)
- Milestone 2 - Mermaid rendering, image embedding
- Milestone 3 - TUI preset picker
- Milestone 4 - live PDF preview in TUI
- Milestone 5 - config files, watch mode, cover page
