# Known issues

This file tracks known bugs and limitations that are not fully resolved. Each entry lists the symptom, impact, workaround, and the milestone that touched it. Update this file when an issue changes status. Do not remove a resolved entry; mark it as fixed with the milestone that fixed it.

Status values: `open`, `workaround`, `fixed`.

## Current issues

| ID | Status | Symptom | Impact | Workaround | Milestone |
|---|---|---|---|---|---|
| 1 | fixed | Phantom spacing: the `.mermaid` container reserves more vertical space than the diagram draws | A blank gap under every diagram | None needed; the svg is `display: block` | 2.8.1, 2.82, 2.83 |
| 2 | open | Graceful spacing: spacing that is intentional but handled clumsily, such as a diagram alone on a page, an orphaned heading, or an oversized diagram margin | Layout looks unpolished; not a defect, a quality issue | Review rendered fixture PDFs and tune spacing behavior per case | 2.8, 2.8.1, 2.82, 2.83 |
| 3 | open | Diagrams render at natural mermaid size, so large diagrams can spill past the page box | A wide or tall diagram can overflow or push a section to the next page | Split the diagram in source, or scale it with CSS in a user preset | 2.8, 2.8.1, 2.82 |
| 4 | open | `forgr-tui` has no version flag; only `-h`/`--help` is supported | Cannot report the TUI version from the CLI, complicating bug reports and scripts that pin the installed version | Run `forgr -V`; both binaries ship from the same package and version | 0.17.0 |

## Issue 1 — phantom spacing (P1, defect)

The `.mermaid` container claimed more vertical height than the drawn diagram, so blank gaps appeared under diagrams.

Root cause: the svg is an inline element by default, so the descender baseline added ~4px of space below it inside its container. The fix makes the svg `display: block` (`.mermaid svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }`), so the container height matches the drawn box.

Verification: `test/mermaid/render.test.js` ".mermaid container has no phantom height" asserts the container height equals the svg box within 0.5px.

Status: **fixed**. A diagram no longer reserves space it does not draw.

## Issue 2 — graceful spacing (P2, polish)

Spacing that is technically intentional but handled clumsily. It is not a defect, but space that could be handled better. Examples:

- A diagram alone on a page with most of the page blank
- A heading orphaned from its diagram, or a diagram separated from its heading
- The `1.4em` container margin reading as excessive against the document rhythm
- A tall diagram pushing a whole section to the next page

### Reported cases

- `test/mermaid/fixtures/academic.md`, first diagram (Flowchart)
- `test/mermaid/fixtures/technical.md`, fourth diagram (Entity Relationship) and seventh diagram (Mindmap)
- `test/fixtures/comprehensive.md`, section 6.4 Authentication Sequence

Placement now comes from native CSS fragmentation only: `h1..h6 { break-after: avoid }` keeps a heading with its content, and `.mermaid { break-inside: avoid }` keeps a diagram whole. There is no JS placement pass. Whitespace left by a diagram moving to the next page is normal pagination.

Status: **open**. Not a defect to fix mechanically; each case is a judgment call, and only for the cases the owner chooses.

## Issue 3 — diagrams have no size cap

Diagrams render at the size mermaid produces, constrained only by CSS: `.mermaid { max-width: 100% }` and `.mermaid svg { max-width: 100%; height: auto }`. A diagram wider than the content box scales down to it. Nothing caps diagram height, so a tall diagram can push its section onto the next page or run past the page box.

The scale-to-fit sizing system (content extent measurement, legibility floor, whole-page treatment, page-1 cap, `forgr.mermaidMaxWidth` / `forgr.mermaidMaxHeight`) was removed from main because it kept producing new edge cases. It lives on the `smart-spacing` branch.

Status: **open**. The fixture PDFs in `test/fixtures/` are the visual reference; re-render and inspect them after any change to diagram layout.

## Issue 4 — forgr-tui has no version flag

The `forgr-tui` binary accepts only `-h`/`--help` and a positional file argument. It has no `--version` or `-V` option, so there is no way to report which version of the TUI is installed. `forgr --version` returns `0.17.0`; `forgr-tui --version` exits with `error: unknown option '--version'` and `forgr-tui -V` fails the same way.

The impact is small but real: bug reports and scripts that want to pin the installed version have to call `forgr -V` instead. Because both binaries ship from the same package and version, that output is a reliable proxy for the TUI version.

Status: **open**. Add a `-V`/`--version` option to `bin/forgr-tui` when the CLI is next touched. A suitable fix is to define an explicit option before the positional file argument so the flag parses instead of falling through to the "unknown option" path.
