# Known issues

This file tracks known bugs and limitations that are not fully resolved. Each entry lists the symptom, impact, workaround, and the milestone that touched it. Update this file when an issue changes status. Do not remove a resolved entry; mark it as fixed with the milestone that fixed it.

Status values: `open`, `workaround`, `fixed`.

## Current issues

| ID | Status | Symptom | Impact | Workaround | Milestone |
|---|---|---|---|---|---|
| 1 | fixed | Phantom spacing: a diagram reserves more vertical space than its drawn content, leaving empty space with no reason to exist | Blank gaps and near-empty pages; layout looks unbalanced, diagrams can sit far from their heading | Cap the diagram box with `forgr.mermaidMaxWidth` / `forgr.mermaidMaxHeight` in front-matter | 2.8.1, 2.82, 2.83 |
| 2 | fixed | Graceful spacing: spacing that is intentional but handled clumsily, such as a diagram alone on a page, an orphaned heading, or an overly large diagram margin | Layout looks unpolished; not a defect, a quality issue | Review rendered fixture PDFs and tune spacing behavior per case | 2.8, 2.8.1, 2.82, 2.83 |
| 3 | open | Mermaid sizing and placement is under active iteration | Behavior can change between releases as the layout engine is refined | Pin expectations by reviewing rendered fixture PDFs after an upgrade | 2.8, 2.8.1, 2.82 |

## Issue 1 — phantom spacing (P1, defect)

Empty space with no reason to exist. The `.mermaid` container claims more vertical height than the drawn diagram occupies, so the layout pass reserves space that shows up as blank gaps or near-empty pages.

Mermaid sizing was switched from the SVG `viewBox` to a measured content extent (union of all child bounding boxes) in milestone 2.8.1, which removed the worst phantom space. Reports continue: the measured extent still does not always match the space the layout pass reserves, so blank gaps and near-empty pages reappear in some diagrams, especially sequence diagrams and diagrams near a page boundary.

The whole-page path added in milestone 2.82 routes the largest diagrams to a full page, which avoids the gap for those cases, but the content-box path can still produce phantom space.

### Resolution (milestone 2.83)

The remaining phantom space came from the SVG being an inline element: the descender baseline added ~4px of space below the SVG inside its `.mermaid` container, so the container reserved more height than the diagram drew. The fix makes the SVG `display: block` (`.mermaid svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }`), so the container height now matches the drawn box exactly.

Verification: `test/mermaid/sizing.test.js` ".mermaid container has no phantom height" asserts the container height equals the SVG box within 0.5px.

Status: **fixed**. A diagram no longer reserves space it does not draw.

## Issue 2 — graceful spacing (P2, polish)

Spacing that is technically intentional but handled clumsily. This is the lesser priority: it is not a defect, but space that could be handled more gracefully. Examples:

- A diagram alone on a page with most of the page blank (a `break-before: page` outcome)
- A heading orphaned from its diagram, or a diagram separated from its heading
- The `1.4em` container margin reading as excessive against the document rhythm
- A whole-page diagram forcing a fresh page even when the previous page has room

### Reported cases

The layout pass applies `mermaid--new-page` (`break-before: page`) when a diagram crosses a page boundary, but it measures page positions in screen space where that CSS class has no effect. As a result the pass never applies `mermaid--keep-heading` to the heading above the break, and the printed PDF puts the heading alone on a page with roughly 95% of the vertical space blank while the diagram starts on the next page. The diagram itself fits in 35% to 40% of the page height, so the sizes are correct and the waste is pure placement.

Confirmed on these fixture diagrams:

- `test/mermaid/fixtures/academic.md`, first diagram (Flowchart)
- `test/mermaid/fixtures/technical.md`, fourth diagram (Entity Relationship) and seventh diagram (Mindmap)
- `test/fixtures/comprehensive.md`, section 6.4 Authentication Sequence

Status: **resolved**. The JS placement pass (`layoutMermaid`) was redundant with the native CSS fragmentation rules and actively harmful, so it was removed. The browser keeps a heading attached to its diagram through `h1..h6 { break-after: avoid }` and keeps diagrams whole through `.mermaid { break-inside: avoid }`, both already in the templates. Rendered PDFs now place each flagged diagram on the same page as its heading.

One placement case remains handled in the renderer: when the first diagram plus its heading chain is taller than the first page, the diagram height is capped to the space left below the chain (as long as the text stays readable) so the whole block stays on page 1 instead of pushing to page 2 and leaving the first page blank. Diagrams too large to fit this way fall through to the existing whole-page or page-break behavior.

Handle only after phantom spacing (issue 1) is resolved, and only for the specific cases the owner chooses. Not a defect to fix mechanically; each case is a judgment call.

## Issue 3 — mermaid sizing is a work in progress

Mermaid rendering and placement are not treated as stable. Milestones 2.8, 2.8.1, and 2.82 changed sizing behavior (scale-to-fit, content-aware extent, whole-page treatment). Expect further changes. The fixture PDFs in `test/fixtures/` are the visual reference; re-render and inspect them after any change to the sizing or placement code.
