# Mermaid sizing fixture

This document exercises the mermaid sizing and placement logic: a wide gantt, a tall vertical flowchart, and several sections that push diagrams across page boundaries. All content is synthetic.

## 1. Wide Diagram

Wide diagrams such as gantt charts are capped at the content width so they never overflow the page.

```mermaid
gantt
    title Release schedule
    dateFormat YYYY-MM-DD
    section Planning
    Write proposal        :a1, 2026-01-01, 30d
    Gather requirements   :a2, 2026-02-01, 45d
    Design architecture   :a3, 2026-03-15, 60d
    section Development
    Implement core module :d1, 2026-05-15, 90d
    Implement second part :d2, 2026-08-15, 75d
    Implement third part  :d3, 2026-11-01, 60d
    section Testing
    Unit and integration  :t1, 2027-01-01, 60d
    Load and stress tests :t2, 2027-03-01, 45d
    User acceptance       :t3, 2027-04-15, 30d
    section Release
    Package and document  :r1, 2027-05-15, 20d
    Deploy and monitor    :r2, 2027-06-01, 15d
```

## 2. Tall Diagram

A vertical flowchart taller than a page is scaled down so the whole diagram fits on one page instead of splitting mid-diagram.

```mermaid
flowchart TD;
    Start --> Step1 --> Step2 --> Step3 --> Step4 --> Step5 --> Step6
    Step6 --> Step7 --> Step8 --> Step9 --> Step10 --> Step11 --> Step12
    Step12 --> Step13 --> Step14 --> Step15 --> Step16 --> Step17 --> Step18
    Step18 --> Step19 --> Step20 --> Step21 --> Step22 --> Step23 --> Step24
    Step24 --> Step25 --> Step26 --> Step27 --> Step28 --> Step29 --> Step30
    Step30 --> Check{Valid?} -->|Yes| Done
    Check -->|No| Step2
```

## 3. Page-Boundary Sections

Each section below pairs a heading with a small diagram. The paragraph length is tuned so diagrams land near page boundaries and the placement pass keeps them with their headings.

### 3.1 First Flow

A short paragraph that carries the previous content across the page boundary. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

```mermaid
flowchart LR; A-->B; B-->C; C-->D
```

### 3.2 Second Flow

Another paragraph of comparable length so the next diagram sits close to the bottom of the page. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.

```mermaid
flowchart LR; A-->B; B-->C; C-->D
```

### 3.3 Third Flow

Yet more text to nudge the following diagram across the next page boundary. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores.

```mermaid
flowchart LR; A-->B; B-->C; C-->D
```

### 3.4 Fourth Flow

Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.

```mermaid
flowchart LR; A-->B; B-->C; C-->D
```

### 3.5 Fifth Flow

Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.

```mermaid
flowchart LR; A-->B; B-->C; C-->D
```

### 3.6 Sixth Flow

Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.

```mermaid
flowchart LR; A-->B; B-->C; C-->D
```

### 3.7 Seventh Flow

Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.

```mermaid
flowchart LR; A-->B; B-->C; C-->D
```

### 3.8 Eighth Flow

Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur. Vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.

```mermaid
flowchart LR; A-->B; B-->C; C-->D
```
