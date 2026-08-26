# CLI Reference

## Usage

```bash
forgr <input> [options]
```

## Global options

| Flag | Description |
|---|---|
| `--tui` | Launch the interactive terminal UI. Combines `forgr-tui` into the main binary. |

## Options

| Flag | Description |
|---|---|
| `--output <path>` | Write the PDF to a specific path instead of next to the input file. |
| `--preset <name>` | Apply a preset: `terminal` (default), `minimal`, `technical`, `academic`, `newsletter`. |
| `--toc` / `--no-toc` | Force the table of contents on or off. Without either, forgr decides automatically. |
| `--doc-meta` / `--no-doc-meta` | Show or hide the doc-meta header. |
| `--date-format <iso\|locale>` | Date display format (`iso`: `2025-01-15`, `locale`: `Jan 15, 2025`). |
| `--date-locale <locale>` | Locale for date formatting (e.g. `en-US`, `es-ES`). |
| `--footer <page-numbers\|page-x-of-y\|none>` | Footer style. |
| `--cover` | Enable a cover page (falls back to document title/author/date). |
| `--cover-title <text>` | Cover page title (default: document title). |
| `--cover-author <text>` | Cover page author (default: document author). |
| `--cover-date <text>` | Cover page date (default: document date). |
| `--section-numbering` / `--no-section-numbering` | Enable or disable heading section numbering. |
| `--write` | Persist CLI flags into the file's front-matter for repeatable builds. |
| `--watch` | Watch the input file and re-render the PDF when it changes. Press Ctrl+C to stop. |

## Commands

| Command | Description |
|---|---|
| `convert <input>` | Convert a Markdown file to PDF (default command). |
| `doctor` | Diagnose installation and fix common issues. |
| `doctor --fix` | Auto-fix detected issues (re-download Chromium, remove malformed user presets). |
| `doctor --verbose` | Show full paths, file sizes, and timestamps. |
| `uninstall` | Remove the Chromium cache (~195MB) without removing the tool. |

## Watch mode

Re-render the PDF automatically whenever the source file changes:

```bash
forgr report.md --watch
```

forgr renders once, then watches the file. Each save produces a fresh PDF. Re-render errors are printed and watching continues, so a broken edit does not kill the session. `--watch` cannot be combined with `--write`.

## Doctor

```bash
forgr doctor                 # check everything
forgr doctor --verbose       # full paths, file sizes
forgr doctor --fix           # auto-fix where possible
```

Checks Chromium, built-in presets, user presets, font files, the base template, and Node version. Reports a summary and exits with code 0 if all checks pass, 1 on failure.

`--fix` re-downloads Chromium if missing and removes malformed user preset files.

## Uninstall

```bash
forgr uninstall             # remove Chromium cache (~195MB)
npm uninstall -g forgr      # remove forgr entirely
```

The next `forgr` run will re-download Chromium automatically.
