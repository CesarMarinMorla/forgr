# Mermaid Diagrams — Terminal

## Flowchart

```mermaid
flowchart TD
  Input[/Raw data/] --> Parse[Parse input]
  Parse --> Validate{Valid?}
  Validate -->|No| Error[Log error]
  Validate -->|Yes| Transform[Transform]
  Transform --> Output[/Formatted output/]
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant A as API
  participant D as Database
  participant W as Worker
  C->>A: POST /jobs
  A->>D: INSERT job
  D-->>A: job id
  A-->>C: 202 Accepted
  D-->>W: poll job
  W->>D: UPDATE status
  D-->>C: webhook done
```

## State

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Running: dispatch
  Running --> Succeeded: exit 0
  Running --> Failed: exit non-zero
  Failed --> Pending: retry
  Succeeded --> [*]
```

## Class

```mermaid
classDiagram
  class Pipeline {
    +run(input)
    +render(output)
    -validate()
    #cleanup()
  }
  class Plugin {
    +process(ctx)
    +name
  }
  class Config {
    +preset
    +output
    +parse(args)
  }
  Pipeline "1" --> "*" Plugin : uses
  Pipeline --> Config : reads
```

## Entity Relationship

```mermaid
erDiagram
  PROJECT ||--|{ JOB : contains
  JOB ||--|| WORKER : assigned to
  JOB ||--o{ LOG : produces
  JOB {
    int id PK
    string status
    date startedAt
  }
  WORKER {
    int id PK
    string name
    string version
  }
```

## Gantt

```mermaid
gantt
  title Release Sprint
  dateFormat YYYY-MM-DD
  axisFormat %m/%d
  section Core
    Auth module  :a1, 2024-10-01, 5d
    API routes   :a2, after a1, 4d
  section UI
    Components   :u1, after a1, 6d
    Tests        :u2, after u1, 3d
  section Ship
    Staging     :s1, after a2, 2d
    Production  :crit, p1, after s1, 1d
```

## Pie

```mermaid
pie title Language Distribution
  "JavaScript" : 45
  "Rust" : 25
  "Python" : 15
  "Go" : 10
  "Other" : 5
```

## Mindmap

```mermaid
mindmap
  root((Terminal))
    CLI
      Commands
      Flags
      Aliases
    Engine
      Parser
      Renderer
      Plugin API
    Output
      PDF
      HTML
      JSON
```

## Timeline

```mermaid
timeline
  title Project Milestones
  2023-Q1 : Proof of concept
  2023-Q3 : First release
  2024-Q1 : Plugin system
  2024-Q3 : v2 rewrite
  2025-Q1 : Stable API
```

## Git Graph

```mermaid
gitGraph
  commit id: "init"
  branch feat-auth
  checkout feat-auth
  commit id: "auth"
  commit id: "tests"
  checkout main
  merge feat-auth
  commit id: "v1.0"
  branch hotfix-crash
  checkout hotfix-crash
  commit id: "fix"
  checkout main
  merge hotfix-crash
```
