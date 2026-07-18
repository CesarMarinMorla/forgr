# forgr front-matter reference

All properties are set inside a YAML front-matter block at the top of a `.md` file. Keys outside the `forgr:` namespace are shared/common fields. Keys inside `forgr:` are forgr-specific.

```yaml
---
title: My Document
date: 2026-07-17
author: Cesar Marin
forgr:
  preset: academic
  toc: true
  cover: true
  footer: page-x-of-y
---
```

## Shared fields

These are standard front-matter keys recognized by many tools (Obsidian, Hugo, Jekyll, 11ty, etc.). forgr reads them but does not write them.

| Key | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Document title, shown in the doc-meta header |
| `date` | string | today's ISO date (e.g. `2026-07-17`) | Overrides auto-generated date in the header |
| `author` | string | — | Author name, shown in the doc-meta header |

## forgr namespace

These go under a `forgr:` key and control rendering behavior.

| Key | Type | Default | Description |
|---|---|---|---|---|
| `preset` | string | `terminal` | CSS preset: `terminal`, `minimal`, `technical`, `academic`, `newsletter` |
| `toc` | bool/string | `auto` | Table of contents: `auto` (word/page threshold), `true` (always), `false` (never) |
| `tocTitle` | string | `Contents` | Custom heading text for the table of contents |
| `cover` | boolean | `false` | Enable a cover page |
| `sectionNumbering` | boolean | `false` | Auto-number sections (h2+) in output |
| `docMeta` | boolean | `true` | Show the doc-meta header bar (date, title, author) |
| `footer` | string | `page-numbers` | Footer style: `page-numbers`, `page-x-of-y`, or `none` |
| `dateFormat` | string | `iso` | Date display: `iso` (e.g. `2026-07-17`) or `locale` |
| `paperFormat` | string | `A4` | Page size: `A4` or `Letter` |
| `margins` | object | `{ top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }` | CSS-length strings for all four margins |

## Merge priority

CLI flags > front-matter `forgr:` keys > front-matter shared keys > built-in defaults.

```
--preset technical  >  forgr: { preset: academic }  >  preset: academic  >  DEFAULTS.preset
```

## Notes

- Files without front-matter render with all defaults — nothing is required.
- Unrecognized keys are silently ignored (safe with Obsidian, Jekyll, etc.).

## Writing settings back with `--write`

Passing `--write` saves the CLI flags into the file's front-matter so the file renders the same way without flags next time.

### What gets written

Only the keys you explicitly set on the command line go into the `forgr:` block. If your file already has `forgr: { footer: none }` and you run `--preset academic --write`, the result is:

```yaml
forgr:
  preset: academic
  footer: none
```

`preset` is written (you passed it), `footer` stays (you didn't). Keys matching built-in defaults are omitted — the file stays clean and picks up future default changes automatically.

### What is preserved

Every key outside the `forgr:` namespace is left untouched — `tags`, `category`, Obsidian front-matter, anything. Shared keys (`title`, `date`, `author`) are only written if explicitly passed on the command line.

### Merge source priority

```
CLI flag  >  existing file  >  built-in DEFAULTS
```

### What stays read-only

The following settings cannot be saved via `--write` because forgr does not write to the user's file without an explicit flag:

```sh
forgr doc.md --preset academic       # reads front-matter, ignores --write
forgr doc.md --preset academic --write  # saves preset into front-matter
```
