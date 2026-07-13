# Mermaid Diagrams — Newsletter

## Flowchart

```mermaid
flowchart TD
  Draft([Draft]) --> Edit[/Editor review/]
  Edit --> Approve{Approved?}
  Approve -->|No| Revise[Revise]
  Revise --> Edit
  Approve -->|Yes| Schedule[Schedule send]
  Schedule --> Send([Published])
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant R as Reader
  participant S as Signup Form
  participant D as Database
  participant M as Mailer
  R->>S: submit email
  S->>D: INSERT subscriber
  D-->>S: confirmation token
  S-->>R: verify inbox
  R->>S: click confirm
  S->>D: activate subscription
  D-->>M: queue welcome
  M-->>R: welcome email
```

## State

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Edited: first pass
  Edited --> Reviewed: peer check
  Reviewed --> Approved: sign-off
  Approved --> Scheduled: queue
  Scheduled --> Sent: deployed
  Sent --> [*]
```

## Class

```mermaid
classDiagram
  class Article {
    +string title
    +string author
    +string body
    +publish()
    +archive()
  }
  class Issue {
    +date sendDate
    +addArticle(a)
    +removeArticle(a)
  }
  class Subscriber {
    +string email
    +bool active
    +unsubscribe()
  }
  Issue "1" --> "*" Article : contains
  Issue "1" --> "*" Subscriber : delivers to
```

## Entity Relationship

```mermaid
erDiagram
  ISSUE ||--o{ ARTICLE : contains
  ISSUE ||--|{ DELIVERY : triggers
  SUBSCRIBER ||--o{ DELIVERY : receives
  ARTICLE {
    int id PK
    string headline
    string section
    date writtenAt
  }
  ISSUE {
    int id PK
    date sendDate
    string subject
  }
```

## Gantt

```mermaid
gantt
  title Editorial Calendar
  dateFormat YYYY-MM-DD
  axisFormat %b %d
  section Writing
    Lead story :w1, 2024-11-01, 5d
    Sidebar   :w2, after w1, 3d
  section Review
    Fact check :r1, after w2, 2d
    Copy edit  :r2, after r1, 2d
  section Production
    Layout  :p1, after r2, 3d
    Ship    :crit, s1, after p1, 1d
```

## Pie

```mermaid
pie title Content Mix
  "Features" : 40
  "News" : 25
  "Opinion" : 20
  "Reviews" : 10
  "Sponsored" : 5
```

## Mindmap

```mermaid
mindmap
  root((Newsletter))
    Sections
      Politics
      Tech
      Culture
      Science
    Formats
      Long read
      Brief
      Interview
      Infographic
    Audience
      Subscribers
      Social
```

## Timeline

```mermaid
timeline
  title Newsletter Milestones
  2023-01 : Launch
  2023-06 : 10k subscribers
  2024-01 : Weekly cadence
  2024-06 : Sponsored content
  2025-01 : Redesign
```

## Git Graph

```mermaid
gitGraph
  commit id: "init"
  branch weekly-issue
  checkout weekly-issue
  commit id: "lead-story"
  commit id: "sidebar"
  checkout main
  merge weekly-issue
  commit id: "deploy"
```
