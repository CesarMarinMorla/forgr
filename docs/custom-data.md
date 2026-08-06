# Custom data in forgr

This file describes what the custom front-matter data is and what the converter can do with it. The roadmap is split into tiers. Tier 0 is implemented. The later tiers describe features that build on it.

Milestone and task tracking lives in [docs/tasks.md](tasks.md) — the tiers here map to the R2, R3, and R4 roadmap items there.

## What is custom data

Every markdown file can carry YAML front-matter. forgr reads three kinds of keys:

- Shared keys: `title`, `date`, `author`, `tags`, `category`, and any other key common tools use.
- Namespaced keys: everything under `forgr:`. These control rendering behavior.
- Custom keys: any key forgr does not recognize. They are ignored during rendering but kept in the data.

Example:

```yaml
---
title: Ops Guide
author: Cesar Marin
tags: [infra, runbook]
category: internal
forgr:
  preset: technical
  toc: true
---

The {{product}} engine renders this file.
```

The full front-matter object is called `data` in this file. It is the raw YAML data, so the structure matches what the author wrote. A value lives at `data.tags`, `data.forgr.preset`, `data.category`, and so on.

## Tier 0. Data foundation (implemented)

Tier 0 makes the data available where rendering happens. No user-facing feature ships with it. Every later tier depends on this plumbing.

The data reaches three places:

1. The markdown renderer. `renderMarkdown` receives the data and passes it into the render environment. Markdown rules can read it.
2. The template. The Handlebars context receives the data as `data`, so a template can read `{{ data.title }}` or `{{ data.forgr.preset }}`. The built-in `base.html` does not use it yet. User presets are CSS-only and reuse `base.html`, so they do not consume `data` either; custom templates that read it land with Tier 2 authoring power (roadmap R4).
3. The PDF options object. The data is carried into `generatePdf` so a later tier can stamp PDF metadata (title, author, keywords).

### Body variables

The one visible behavior in Tier 0 is body variable substitution. A `{{ key }}` token in the markdown body is replaced with the matching value from the data. Dotted keys work for nested values.

```yaml
---
forgr:
  vars:
    product: forgr
---

The {{product}} engine renders PDFs.
```

Becomes "The forgr engine renders PDFs."

Rules:

- Unknown keys stay literal. `{{ missing }}` is printed as written.
- Values are inserted as text, so HTML characters are escaped. A value of `Acme & Co` renders as `Acme &amp; Co`.
- Substitution does not happen inside fenced code blocks or inline code.
- The rule only touches text, so headings and the table of contents resolve variables too.

This is the smallest feature that proves the markdown data path. It is also the building block for the authoring-power features in Tier 1 and Tier 2.

## Tier 1. Quick wins

These features are small and low risk. They use the Tier 0 plumbing directly. Each one is listed with the front-matter shape it would accept.

### PDF document metadata

Write the title, author, and keywords into the PDF properties. Chromium reads the document title for the PDF title. The author and keyword fields need a small metadata step in `generatePdf`.

```yaml
---
title: Ops Guide
author: Cesar Marin
keywords: [infra, runbook]
---
```

Value: the PDF file shows a title in the viewer and search engines index the keywords.

### Tags as keyword chips

Render `tags` as small colored chips under the title or in the doc-meta header.

```yaml
---
tags: [infra, runbook, internal]
---
```

Value: documents read as classified or organized. The template gets a `tags` array and renders one chip per tag.

### Body variables

Already implemented in Tier 0. It is listed here because it is the first authoring-power feature and the model for the rest.

### Output filename templating

Template the output filename from metadata.

```yaml
---
forgr:
  output: "{title}-{date}"
---
```

Value: `report-2026-08-06.pdf` instead of `report.pdf`. The pattern fills from the data and falls back to the file name when a field is missing.

### Draft or watermark banner

Render a full-page banner for drafts and review copies.

```yaml
---
forgr:
  banner:
    text: DRAFT
    opacity: 0.08
---
```

Value: a diagonal text overlay on every page. Useful for review cycles without changing the content.

### Read-time estimate

Compute an estimate from the word count and show it on the cover or in the header.

```yaml
---
forgr:
  readTime: auto
---
```

Value: the reader knows the scope before starting.

### Cover layout modes

Pick a cover composition and let the converter compose it from metadata.

```yaml
---
forgr:
  cover: true
  coverLayout: editorial
---
```

Value: centered and editorial cover layouts, with subtitle, version, and tagline fields added to the template data.

## Tier 2. Structural and data-to-content

These features are bigger. They change the document structure or generate content from data.

### Per-section configuration

Configure parts of a document independently, keyed by heading.

```yaml
---
forgr:
  sections:
    Installation:
      preset: technical
      newPage: true
---
```

Value: one document can mix styles. The converter splits the rendered HTML at the heading and applies the per-section options.

### Chapter mode

Start every `h1` on a new page.

```yaml
---
forgr:
  chapter: true
---
```

Value: long documents get a book-like structure with a single CSS flag.

### Auto-diagrams from data

Generate a mermaid diagram from a data structure.

```yaml
---
forgr:
  timeline:
    - 2026-Q1: Proposal
    - 2026-Q2: Experiments
---
```

Value: `forgr.timeline` becomes a mermaid timeline, `forgr.flow` becomes a flowchart. The author writes data, the converter draws the visual. This reuses the existing mermaid fence path.

### Markdown includes

Splice other markdown files into the document.

```yaml
---
forgr:
  includes:
    - sections/intro.md
    - sections/review.md
---
```

Value: reusable parts across documents. This overlaps with the Liquid `{% include %}` work in R5 (extended format support).

### CSV tables

Render a CSV file as a styled table.

```yaml
---
forgr:
  tables:
    comparison: data/comparison.csv
---
```

Value: `{{ table.comparison }}` in the body becomes a table with the preset styling.

### Conditional and loop blocks

Control blocks over the data, like `{% if %}` and `{% for %}`.

```markdown
{% for member in team %}
- {{ member.name }} ({{ member.role }})
{% endfor %}
```

Value: generate repeated content from a list. This overlaps with R5 (extended format support / Liquid). It is listed here for the roadmap but should be built inside R5, not before it.

## Tier 3. Intelligence

These features make the converter decide for itself. This is the priority direction. The converter infers, checks, and adapts instead of only following instructions.

### Auto-preset detection

Pick a preset from the content when the author asks.

```yaml
---
forgr:
  preset: auto
---
```

Signals the converter can read:

- Math blocks present: academic.
- Code-heavy document (many fenced blocks): technical.
- Mostly prose with little structure: newsletter.
- Neutral fallback: terminal.

The decision uses counts over the token stream, so it needs no new data and works on any file.

### Pre-render lint

Check the document before rendering and report problems.

```yaml
---
forgr:
  lint: true
---
```

Checks:

- Broken image links.
- Duplicate heading ids.
- Malformed mermaid fences.
- Diagrams that would render too small to read.
- Sections that would produce a near-empty page.

Value: problems surface before the PDF is opened, not after.

### Language-aware typography

Use the declared language for typographic choices.

```yaml
---
lang: es
---
```

The converter sets the date locale, chooses quote styles, and can swap the body font. Shared key `lang` is already carried in the data, so this is a consumer of Tier 0.

### Auto cover stats

Compose a small statistics block on the cover from the rendered document.

```yaml
---
forgr:
  coverStats: true
---
```

Shows word count, diagram count, and read time. These numbers come from the render pass, not from the author.

## Priority and sequencing

1. Tier 0 is done. It is the foundation.
2. Tier 3 (intelligence) is the priority direction. Auto-preset detection and pre-render lint are the first candidates because they add value with no new front-matter burden.
3. Tier 1 quick wins come next as low-risk polish.
4. Tier 2 authoring power comes after the foundations are proven. The conditional and loop blocks belong to R5 (extended format support).
