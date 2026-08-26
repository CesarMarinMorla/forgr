# forgr

> Convert Markdown to PDFs. One command, zero config.

<div align="center">

![npm version](https://img.shields.io/npm/v/forgr.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)

</div>

## Features

- **Five presets**: `terminal`, `minimal`, `technical`, `academic`, `newsletter`
- **Diagrams**: native Mermaid rendering with per-preset color theming
- **Images**: local images inlined as base64 data URIs automatically
- **Table of contents**: generated for longer documents, or forced on/off
- **Cover page**: optional cover page with title, author, and date
- **Interactive TUI**: `forgr --tui` (or `forgr-tui`) for preset picking, settings, and batch rendering

## Install

```bash
npm install -g forgr
```

Chromium (~195MB) downloads on your first run, not during `npm install`.

## Uninstall

```bash
forgr uninstall             # remove Chromium cache (~195MB)
npm uninstall -g forgr      # remove forgr entirely
```

The next `forgr` run will re-download Chromium automatically.

## Quick start

```bash
forgr report.md                         # output next to input
forgr report.md --output /path/to.pdf   # custom output path
forgr report.md --preset academic       # choose a preset
```

## Presets

| Preset | Identity | Best for |
|---|---|---|
| `terminal` | Mono headings, graphite/teal, dark code blocks | Infra reports, dashboards |
| `minimal` | System sans, single gray, no accent | Clean documents |
| `technical` | Full mono, amber accent, grid tables | Runbooks, config specs |
| `academic` | Book serif, pine-green accent | Papers, theses |
| `newsletter` | Off-white paper, serif headings, coral accent | Changelogs, announcements |

### User presets

Drop a JSON descriptor and CSS file into `~/.config/forgr/presets/`:

```json
{ "name": "brand", "description": "Company colors", "css_file": "brand.css" }
```

Render with `forgr document.md --preset brand`. See [docs/front-matter.md](docs/front-matter.md) for full reference.

## Learn more

- [CLI reference](docs/CLI.md) - flags, watch mode, doctor, uninstall
- [Front-matter reference](docs/front-matter.md) - control rendering from inside your Markdown
- [Interactive TUI](docs/TUI.md) - terminal UI for preset picking and batch rendering
- [Known issues](docs/KNOWN_ISSUES.md) - bugs and limitations
- [Contributing](CONTRIBUTING.md) - development setup and commit style

## License

MIT: see [LICENSE](LICENSE).
