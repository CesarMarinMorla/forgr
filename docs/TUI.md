# Interactive TUI

`forgr-tui` launches a terminal UI that scans the current directory for `.md` files and guides you through preset selection, rendering options, and batch conversion.

```bash
forgr-tui                    # scan current directory for .md files
forgr-tui report.md          # process a specific file (skips file picker)
```

## Flow

1. **File picker**: if 2+ `.md` files found, select which to render (space to toggle, enter to confirm). If 0 files, exits with a message. If 1 file, auto-selects it. Pass a file argument to skip this step entirely.
2. **Preset picker**: choose from the five built-in presets or any user preset (see [User presets](README.md#user-presets)).
3. **Settings screen**: configure table of contents (auto/on/off), doc-meta header, date format, footer style, cover page, and section numbering. Arrow keys to navigate, Enter to render.
4. **Batch render**: files render one at a time with per-file progress. A failure does not stop the batch.
5. **Result screen**: shows per-file success/failure, truncated to 6 visible files with `... N more`. Press `s` to save the current settings to all files' front-matter, `o` to open the folder, Enter to go back.
