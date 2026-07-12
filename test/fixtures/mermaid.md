# Mermaid Diagrams

This fixture exercises the mermaid fence renderer. Each block is emitted as a
`<div class="mermaid">` so the pipeline can hand it to an in-browser mermaid
runtime. It covers the most widely used diagram types so every preset's
mermaid palette is exercised end to end.

## Flowchart

```mermaid
flowchart TD
  Start([Start]) --> Input[/Read config/]
  Input --> Validate{Valid?}
  Validate -->|No| Error[Log error]
  Validate -->|Yes| Process[Process records]
  Process --> Output[/Write report/]
  Output --> Stop([Stop])
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant A as App
  participant D as Database
  U->>A: submit form
  A->>D: INSERT row
  D-->>A: row id
  A-->>U: success (id)
```

## State

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Running: start
  Running --> Succeeded: done
  Running --> Failed: error
  Failed --> Pending: retry
  Succeeded --> [*]
```

## Class

```mermaid
classDiagram
  class Pipeline {
    +run(input)
    +render()
    -cleanup()
  }
  class PdfWriter {
    +write(path)
  }
  Pipeline --> PdfWriter : uses
```

## Entity Relationship

```mermaid
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  CUSTOMER {
    string name
    string email
  }
  ORDER {
    int orderNumber
    date createdAt
  }
  LINE_ITEM {
    int quantity
    float price
  }
```

## Gantt

```mermaid
gantt
  title Release Schedule
  dateFormat YYYY-MM-DD
  axisFormat %m/%d
  section Planning
    Research :done, p1, 2024-01-01, 7d
    Design :p2, after p1, 5d
  section Build
    Implement :b1, after p2, 10d
    Test :b2, after b1, 4d
  section Ship
    Publish :crit, s1, after b2, 2d
```

## Pie

```mermaid
pie title Preset Usage
  "Terminal" : 40
  "Minimal" : 20
  "Technical" : 25
  "Academic" : 10
  "Newsletter" : 5
```

## Mindmap

```mermaid
mindmap
  root((forgr))
    Presets
      terminal
      minimal
      technical
      academic
      newsletter
    Features
      Mermaid
      Images
      TOC
```

## Timeline

```mermaid
timeline
  title Project History
  2024-01 : Concept
  2024-03 : MVP
  2024-06 : v0.1.0 published
  2024-09 : v0.2.0 presets
```

## Git Graph

```mermaid
gitGraph
  commit
  branch develop
  checkout develop
  commit
  commit
  checkout main
  merge develop
  commit
```
