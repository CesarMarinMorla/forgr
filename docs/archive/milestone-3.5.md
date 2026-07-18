# Milestone 3.5 — Front-matter processing

## Goal

All 13 user-facing forgr properties can be set from YAML front-matter. The parsing layer reads both shared keys (`title`, `date`, `author`) and the `forgr:` namespace. Unrecognized keys pass through silently. A `--write` flag saves CLI settings back into the file.

Rendering behavior of each property (what docMeta does, how cover looks, etc.) is **not** part of this milestone — that is M4.

## Current state

`parseFrontMatter()` in `src/markdown.js` reads 5 flat keys from top-level YAML. The `forgr:` namespace is not handled. `buildConfig()` in `src/pipeline.js` maps them manually into the config object.

## Scope

### 1. Namespace parsing

Update `parseFrontMatter()` to read both sources:

```yaml
---
title: My Doc                   # shared, fallback
forgr:
  title: My Real Doc            # namespaced, wins
  preset: academic
  footer: page-x-of-y
---
```

Per-key priority: `forgr.<key>` > `<key>` > undefined

### 2. Full key set

Parse all 13 properties. Most are not wired to rendering yet — they pass through the config object inert and become active in M4.

| Source | Keys |
|---|---|
| Shared (top-level) | `title`, `date`, `author` |
| `forgr:` namespace | `preset`, `toc`, `tocTitle`, `cover`, `sectionNumbering`, `docMeta`, `footer`, `dateFormat`, `paperFormat`, `margins` |

### 3. `--write` flag

Saves the current CLI config into the file's `forgr:` block.

**Merge behavior**: key-level shallow merge. Only the keys passed via CLI are written into `forgr:`. Existing `forgr:` keys are preserved unless overridden. Nested keys (e.g. `margins`) use deep merge.

**What gets written**: diff from DEFAULTS. Keys matching built-in defaults are omitted.

**What is preserved**: every key outside the `forgr:` namespace. Shared keys (`title`, `date`, `author`) are only written if explicitly passed on the command line.

**Priority**: CLI flag > existing `forgr:` in file > shared keys in file > DEFAULTS

### 4. Unrecognized keys

Silently ignored. Obsidian, Jekyll, Hugo, and 11ty front-matter keys pass through untouched.

## Out of scope

- Doc-meta header show/hide (M4)
- Footer style switching (M4)
- Cover page rendering (M4)
- Section numbering CSS (M4)
- TUI settings form (M4)

## Files to touch

| File | Change |
|---|---|
| `src/markdown.js` | `parseFrontMatter()` reads `forgr:` namespace, full key set |
| `src/pipeline.js` | `buildConfig()` uses merged front-matter as-is (already reads it) |
| `src/config.js` | No change (DEFAULTS already has all 13 keys) |
| `src/cli.js` | Add `--write` flag |
| `docs/front-matter.md` | Already documents the schema and write behavior |
