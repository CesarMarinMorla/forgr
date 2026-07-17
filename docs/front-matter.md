# forgr front-matter reference

All properties are set inside a YAML front-matter block at the top of a `.md` file. Keys outside the `forgr:` namespace are shared/common fields. Keys inside `forgr:` are forgr-specific.

```yaml
---
title: My Document
date: 2026-07-17
author: Cesar Marin
forgr:
  preset: academic
  toc: on
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
|---|---|---|---|
| `preset` | string | `terminal` | CSS preset: `terminal`, `minimal`, `technical`, `academic`, `newsletter` |
| `toc` | string | `auto` | Table of contents: `auto` (word/page threshold), `on` (always), `off` (never) |
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
- forgr never writes to the input `.md` file.
