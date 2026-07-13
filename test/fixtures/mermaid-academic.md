# Mermaid Diagrams — Academic

## Flowchart

```mermaid
flowchart TD
  Question([Research question]) --> Review[Literature review]
  Review --> Hypothesis[Form hypothesis]
  Hypothesis --> Design[Design study]
  Design --> Collect[Collect data]
  Collect --> Analyze[Analyze results]
  Analyze --> Significant{Significant?}
  Significant -->|Yes| Publish([Manuscript])
  Significant -->|No| Null[Null result]
  Null --> Publish
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant R as Researcher
  participant J as Journal Portal
  participant R1 as Reviewer 1
  participant R2 as Reviewer 2
  participant E as Editor
  R->>J: submit manuscript
  J->>E: assign handling editor
  E->>R1: invite review
  E->>R2: invite review
  R1-->>J: submit review
  R2-->>J: submit review
  J->>E: compile decision
  E-->>R: revise & resubmit
  R->>J: revised version
  J->>E: final decision
  E-->>R: accepted
```

## State

```mermaid
stateDiagram-v2
  [*] --> Idea
  Idea --> Literature: background
  Literature --> Methodology: design
  Methodology --> DataCollection: IRB approved
  DataCollection --> Analysis: collected
  Analysis --> Drafting: findings
  Drafting --> Submitted: manuscript
  Submitted --> UnderReview: assigned
  UnderReview --> Revise: minor/major
  Revise --> Submitted: resubmit
  UnderReview --> Accepted: approved
  Accepted --> Published: typeset
  Published --> [*]
```

## Class

```mermaid
classDiagram
  class Manuscript {
    +string title
    +string author
    +string abstract
    +submit()
    +revise()
    +withdraw()
  }
  class Review {
    +int score
    +string comments
    +recommend()
    +flagConflict()
  }
  class Citation {
    +string doi
    +string journal
    +int year
    +format()
  }
  Manuscript "1" --> "*" Citation : cites
  Manuscript "1" --> "*" Review : receives
```

## Entity Relationship

```mermaid
erDiagram
  AUTHOR ||--o{ MANUSCRIPT : writes
  MANUSCRIPT ||--|| JOURNAL : submitted to
  MANUSCRIPT ||--o{ REVIEW : receives
  REVIEW ||--|| REVIEWER : written by
  MANUSCRIPT {
    int id PK
    string doi UK
    string title
    date submittedAt
    string status
  }
  REVIEW {
    int id PK
    int manuscriptId FK
    int reviewerId FK
    int score
    text comments
  }
```

## Gantt

```mermaid
gantt
  title Research Timeline
  dateFormat YYYY-MM-DD
  axisFormat %b %Y
  section Preparation
    Literature survey :l1, 2024-01-01, 60d
    Ethics approval   :e1, after l1, 30d
  section Study
    Data collection   :d1, after e1, 90d
    Analysis          :a1, after d1, 45d
  section Publication
    Write manuscript  :w1, after a1, 60d
    Peer review       :crit, p1, after w1, 120d
    Revisions         :r1, after p1, 30d
```

## Pie

```mermaid
pie title Citation Sources
  "Journals" : 50
  "Conference Proceedings" : 25
  "Books" : 15
  "Preprints" : 10
```

## Mindmap

```mermaid
mindmap
  root((Research))
    Methods
      Quantitative
      Qualitative
      Mixed
    Domains
      Computer Science
      Linguistics
      Cognitive Science
    Outputs
      Journal articles
      Conference papers
      Datasets
      Software
```

## Timeline

```mermaid
timeline
  title Dissertation Timeline
  2023-Fall : Proposal
  2024-Spring : Experiments
  2024-Fall : Analysis
  2025-Spring : Writing
  2025-Fall : Defense
```

## Git Graph

```mermaid
gitGraph
  commit id: "proposal"
  branch experiment-1
  checkout experiment-1
  commit id: "pilot-data"
  commit id: "analysis"
  checkout main
  merge experiment-1
  commit id: "draft"
  branch revisions
  checkout revisions
  commit id: "peer-feedback"
  commit id: "final"
  checkout main
  merge revisions
  commit id: "published"
```
