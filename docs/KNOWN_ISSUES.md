# Known issues

This file tracks known bugs and limitations that are not fully resolved. Each entry lists the symptom, impact, workaround, and the milestone that touched it. Update this file when an issue changes status. Do not remove a resolved entry; mark it as fixed with the milestone that fixed it.

Status values: `open`, `workaround`, `fixed`.

## Current issues

| ID | Status | Symptom | Impact | Workaround | Milestone |
|---|---|---|---|---|---|
| 1 | open | Mermaid phantom vertical spacing: a diagram claims more vertical space than its drawn content, leaving blank gaps or pushing a near-empty page | Layout looks unbalanced; diagrams can sit far from their heading | Cap the diagram box with `forgr.mermaidMaxWidth` / `forgr.mermaidMaxHeight` in front-matter | 2.8.1, 2.82 |
| 2 | open | Mermaid sizing and placement is under active iteration | Behavior can change between releases as the layout engine is refined | Pin expectations by reviewing rendered fixture PDFs after an upgrade | 2.8, 2.8.1, 2.82 |

## Issue 1 — phantom vertical spacing

Mermaid sizing was switched from the SVG `viewBox` to a measured content extent (union of all child bounding boxes) in milestone 2.8.1, which removed the worst phantom space. Reports continue: the measured extent still does not always match the space the layout pass reserves, so blank gaps and near-empty pages reappear in some diagrams, especially sequence diagrams and diagrams near a page boundary.

The whole-page path added in milestone 2.82 routes the largest diagrams to a full page, which avoids the gap for those cases, but the content-box path can still produce phantom space.

Follow-up work: reproduce with the smallest diagram that still shows the gap, compare measured extent against the reserved layout height, and reconcile the two.

## Issue 2 — mermaid sizing is a work in progress

Mermaid rendering and placement are not treated as stable. Milestones 2.8, 2.8.1, and 2.82 changed sizing behavior (scale-to-fit, content-aware extent, whole-page treatment). Expect further changes. The fixture PDFs in `test/fixtures/` are the visual reference; re-render and inspect them after any change to the sizing or placement code.
