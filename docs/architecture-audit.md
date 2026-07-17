# Architecture Audit

Audited 2026-07-17. 12 source modules, 8 test files, 2 binaries.

## Dependency Graph

Clean DAG. No cycles. `pipeline.js` is the hub.

```
pipeline.js
  → browsers-path.js   (side-effect only — see #2)
  → markdown.js        (parseFrontMatter, writeForgrFrontMatter, renderMarkdown)
  → template.js        (renderTemplate)
  → pdf.js             (generatePdf)
  → config.js          (DEFAULTS)

presets.js
  → template.js

doctor.js
  → pdf.js (getHeadlessShellPath)
  → presets.js
```

---

## Critical

### 1. `markdown.js` — 5 concerns in one module [RESOLVED]

Front-matter parsing/writing extracted to `src/frontmatter.js`. `markdown.js` now owns only the render pipeline (markdown-it setup, rules, ToC builder, `renderMarkdown`).

### 2. Side-effect import pattern [RESOLVED]

Replaced with explicit `initBrowsersPath()` call in `src/pipeline.js:3-4` and test files. The function is exported from `src/browsers-path.js`.

### 3. `getHeadlessShellPath()` — 3 copies [RESOLVED]

Consolidated into `src/browsers-path.js`. All callers import from there.

### 4. `doctor.js` — 172-line monolith with no internal structure [RESOLVED]

Each of the 6 health checks extracted to its own function (`checkChromium`, `checkPresets`, `checkUserPresets`, `checkFonts`, `checkTemplate`, `checkNodeVersion`). `runDoctor()` is now a 16-line loop over the check functions with no inline diagnostic logic.

### 5. `generatePdf()` — 97 lines, 6 concerns interleaved [RESOLVED]

Each concern extracted to its own exported function (`assertWritableDir`, `launchBrowser`, `hasMermaidDiagrams`, `renderMermaid`, `computeHeadingPages`, `generatePdfOptions`). `generatePdf()` is now a 35-line linear orchestrator with flat error handling.

---

## Moderate

### 6. `buildConfig()` uses inconsistent merge operators [RESOLVED]

All `||` operators in `buildConfig()` replaced with `??`. Empty-string and `false` values are now preserved instead of silently falling through to the default.

### 7. Two-pass render with zero caching

`src/pipeline.js:99-115`: When TOC is needed, the entire pipeline runs twice — markdown re-parsed, HTML regenerated, Chromium re-launched. No work is reused between passes. The second pass is a full re-execution from markdown to PDF.

**If this becomes a bottleneck**: The first pass's rendered HTML and Chromium page could be cached and reused.

### 8. `--write` duplicates option processing

`src/cli.js:88-94` manually mirrors Commander's option parsing:

```js
const writeKeys = {};
if (options.preset !== undefined) writeKeys.preset = options.preset;
if (options.toc !== undefined) writeKeys.toc = normalizeTocOption(options.toc);
```

Adding a new CLI flag means updating the option definition AND the `writeKeys` block in lockstep. This is a maintenance burden — expect it to be forgotten when someone adds e.g. `--footer`.

### 9. `toc` as string-triple

`toc` flows through the system as `'on'`/`'off'`/`'auto'`:

- CLI normalizes `true`/`false` to `'on'`/`'off'` via `normalizeTocOption()` (`src/utils.js:1`)
- Front-matter normalizes YAML booleans/strings via `normalizeTocFromYaml()` (`src/markdown.js:20`)
- `resolveToc()` (`src/pipeline.js:13`) switches on `'on'`/`'off'`/`'auto'`

Three normalization boundaries, each accepting a slightly different input format. The string encoding is non-standard and creates an impedance mismatch at every boundary.

**Prefer**: A `TocOption` enum or boolean + threshold approach.

### 10. 7 of 12 source modules have no unit tests

| Module | Coverage |
|---|---|
| `src/pdf.js` | Integration only |
| `src/template.js` | None |
| `src/config.js` | Used as import, no dedicated tests |
| `src/browsers-path.js` | None (side-effect import only) |
| `src/utils.js` | None |
| `src/doctor.js` | None |
| `src/cli.js` | None |

Functions like `buildConfig()`, `resolveToc()`, `normalizeTocOption()`, and `wordCount()` are only exercised via 60s integration tests, not fast unit tests.

---

## Low

### 11. Mermaid theme data should be external

`src/pdf.js:14-350` — 336 lines of repetitive theme objects. Five presets, each ~70 lines, with identical structure (`cScale0` through `cScale11` repeated in every preset). This is data, not code.

**Prefer**: JSON files or a shared base with per-preset overrides.

### 12. Module-level mutable cache

`src/pdf.js:381`: `let chromiumChecked = false`. Once set to `true`, `ensureChromium()` becomes a no-op for the entire process lifetime. The cache is never invalidated — fine for CLI usage but would break in a long-running server context.

### 13. `bin/forgr-tui` duplicates CLI patterns [RESOLVED]

`--write` flag added to `bin/forgr-tui`. Builds `writeKeys` from TUI-chosen preset and any explicit `--toc`/`--no-toc` flags.

### 14. Integration tests validate only PDF magic bytes

`test/integration/comprehensive.test.js` and `test/integration/integration.test.js` assert only:
- File exists
- Size > 1024 bytes
- Starts with `%PDF-`

No assertions on page count, TOC presence, correct mermaid rendering, or font embedding.

### 15. Config `_pdf` is hardcoded in merge [RESOLVED]

Removed from `buildConfig()`. `generatePdf()` reads `DEFAULTS._pdf` directly.

---

## Summary

| Severity | Finding | Location | Status |
|---|---|---|---|
| Critical | `markdown.js` violates SRP — 5 concerns | `src/markdown.js` | Resolved |
| Critical | Side-effect import pattern | `src/pipeline.js:3`, test files | Resolved |
| Critical | `getHeadlessShellPath()` 3 copies | `src/pdf.js:352`, test files | Resolved |
| Critical | `doctor.js` 172-line monolith | `src/doctor.js:51-223` | Resolved |
| Critical | `generatePdf()` 97 lines, 6 concerns | `src/pdf.js:420-517` | Resolved |
| Moderate | `buildConfig()` inconsistent `||` vs `??` | `src/pipeline.js:19-45` | Resolved |
| Moderate | Two-pass render no caching | `src/pipeline.js:99-115` | Open |
| Moderate | `--write` duplicates option processing | `src/cli.js:88-94` | Open |
| Moderate | `toc` string-triple normalization | 3 files | Open |
| Moderate | 7/12 modules lack unit tests | Multiple | Open |
| Low | Mermaid theme data inline | `src/pdf.js:14-350` | Open |
| Low | Module-level cache never invalidated | `src/pdf.js:381` | Open |
| Low | `bin/forgr-tui` duplicates `cli.js` | `bin/forgr-tui` | Resolved |
| Low | Integration tests shallow assertions | `test/integration/*.test.js` | Open |
| Low | `_pdf` hardcoded in merge | `src/pipeline.js:38` | Resolved |
