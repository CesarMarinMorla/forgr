# Mermaid Diagrams

This fixture exercises the mermaid fence renderer. Each block is emitted as a
`<div class="mermaid">` so the pipeline can hand it to an in-browser mermaid
runtime (Milestone 4 wiring) when one is present.

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
