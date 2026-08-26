# Contributing to forgr

## Requirements

- Node.js 18+

## Development

```bash
npm test                  # full suite
npm run test:unit         # unit tests only
npm run test:integration  # integration tests only
npm run test:mermaid      # mermaid-specific tests only
```

Integration tests accept a `FORGR_PRESET` environment variable (`terminal`, `minimal`, `technical`, `academic`, `newsletter`) to validate one preset at a time.

## Commit style

Conventional commits: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`, `build`, `revert`.

```
feat: add user login endpoint
fix: correct validation error in form
```

## Project structure

- `src/` - source code
- `src/presets.js` - built-in preset definitions
- `src/themes/` - mermaid theme JSON files
- `src/templates/` - HTML templates (base.html)
- `src/tui.js` - interactive terminal UI
- `test/` - test files
