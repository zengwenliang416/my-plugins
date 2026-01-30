# Mermaid Visualization Templates

## Mind Map

### Basic Template - Idea Grouping

```mermaid
mindmap
  root((Topic Name))
    Product Features
      C-1: Feature idea title
      C-4: Feature idea title
      G-3: Feature idea title
    User Experience
      G-1: Experience idea title
      G-2: Experience idea title
    Technical Architecture
      C-2: Architecture idea title
      C-3: Architecture idea title
    Business Model
      C-5: Model idea title
    Operations Strategy
      G-4: Strategy idea title
```

### Variant - With Icons

```mermaid
mindmap
  root((🎯 Topic))
    💡 Product Features
      ⭐ C-1: Core feature
      C-4: Supporting feature
    🎨 User Experience
      ⭐ G-1: Key experience
      G-2: Enhanced experience
    ⚙️ Technical Architecture
      C-2: Infrastructure
    💰 Business Model
      C-5: Monetization method
```

### Variant - Hierarchical Expansion

```mermaid
mindmap
  root((Topic))
    Product Features
      New Features
        C-1: Idea 1
        C-2: Idea 2
      Feature Enhancements
        C-3: Idea 3
    User Experience
      Interaction Optimization
        G-1: Idea 1
      Emotional Design
        G-2: Idea 2
```

---

## Evaluation Matrix (Quadrant Chart)

### Basic Template - Impact vs Feasibility

```mermaid
quadrantChart
    title Idea Evaluation Matrix
    x-axis Low Feasibility --> High Feasibility
    y-axis Low Impact --> High Impact
    quadrant-1 Priority Execution
    quadrant-2 Strategic Reserve
    quadrant-3 Quick Trial
    quadrant-4 Temporarily Shelve
    C-1: [0.80, 0.90]
    C-2: [0.45, 0.85]
    G-1: [0.75, 0.70]
    G-2: [0.85, 0.60]
    C-3: [0.30, 0.75]
    G-3: [0.65, 0.55]
    C-4: [0.55, 0.40]
    G-4: [0.25, 0.35]
```

### Variant - With Color Annotations

```mermaid
%%{init: {"themeVariables": {"quadrant1Fill": "#d4edda", "quadrant2Fill": "#fff3cd", "quadrant3Fill": "#cce5ff", "quadrant4Fill": "#f8d7da"}}}%%
quadrantChart
    title Idea Priority Matrix
    x-axis High Implementation Difficulty --> Low Implementation Difficulty
    y-axis Low Value --> High Value
    quadrant-1 Act Immediately
    quadrant-2 Plan Implementation
    quadrant-3 Quick Test
    quadrant-4 Consider Abandoning
    Idea A: [0.8, 0.9]
    Idea B: [0.3, 0.85]
    Idea C: [0.75, 0.45]
```

### Coordinate Calculation Method

Convert 1-5 scores to 0-1 coordinates:

```
Coordinate Value = (Score - 1) / 4
```

| Score | Coordinate Value |
| ----- | ---------------- |
| 1     | 0.00             |
| 2     | 0.25             |
| 3     | 0.50             |
| 4     | 0.75             |
| 5     | 1.00             |

---

## Ranking Display (Flow Chart)

### Top 3 Display

```mermaid
graph LR
    subgraph "🏆 Top 3 Ideas"
        A["🥇 C-1<br/>Idea Title<br/>Score: 4.08"]
        B["🥈 G-1<br/>Idea Title<br/>Score: 4.03"]
        C["🥉 C-2<br/>Idea Title<br/>Score: 3.93"]
    end

    A --> B --> C
```

### Top 5 Vertical Display

```mermaid
graph TB
    subgraph "🎯 Top 5 Idea Ranking"
        A["🥇 1st Place - C-1<br/>Idea Title<br/>Score: 4.08"]
        B["🥈 2nd Place - G-1<br/>Idea Title<br/>Score: 4.03"]
        C["🥉 3rd Place - C-2<br/>Idea Title<br/>Score: 3.93"]
        D["4️⃣ 4th Place - G-3<br/>Idea Title<br/>Score: 3.88"]
        E["5️⃣ 5th Place - C-4<br/>Idea Title<br/>Score: 3.85"]
    end

    A --> B --> C --> D --> E
```

---

## Group Statistics (Pie Chart)

### Source Distribution

```mermaid
pie showData
    title Idea Source Distribution
    "Codex (Technical Perspective)" : 12
    "Gemini (User Perspective)" : 10
    "Merged Ideas" : 3
```

### Category Distribution

```mermaid
pie showData
    title Idea Category Distribution
    "Product Features" : 8
    "User Experience" : 6
    "Technical Architecture" : 4
    "Business Model" : 3
    "Operations Strategy" : 4
```

---

## Implementation Roadmap (Gantt)

### Priority-Based Roadmap

```mermaid
gantt
    title Idea Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Priority Execution
    C-1: Core Feature        :a1, 2026-01-20, 2w
    G-1: Experience Optimization        :a2, after a1, 1w
    section Quick Trial
    G-2: Small Feature Test      :b1, 2026-01-20, 1w
    C-4: Technical Validation        :b2, 2026-01-27, 1w
    section Strategic Reserve
    C-2: Architecture Upgrade        :c1, 2026-02-10, 4w
    C-3: Long-term Investment        :c2, 2026-03-01, 6w
```

---

## Evaluation Details (Table)

### Markdown Table Template

```markdown
| Rank | ID  | Idea       |   Impact   | Feasibility | Innovation | Alignment |  Score   |
| :--: | :-: | :--------- | :--------: | :---------: | :--------: | :-------: | :------: |
|  🥇  | C-1 | Idea Title | ⭐⭐⭐⭐⭐ |  ⭐⭐⭐⭐   |  ⭐⭐⭐⭐  | ⭐⭐⭐⭐  | **4.08** |
|  🥈  | G-1 | Idea Title |  ⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐  |  ⭐⭐⭐⭐  |  ⭐⭐⭐   | **4.03** |
|  🥉  | C-2 | Idea Title |  ⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐  |  ⭐⭐⭐⭐  | ⭐⭐⭐⭐  | **3.93** |
```

### Star Rating Conversion

| Score | Display    |
| ----- | ---------- |
| 5     | ⭐⭐⭐⭐⭐ |
| 4     | ⭐⭐⭐⭐   |
| 3     | ⭐⭐⭐     |
| 2     | ⭐⭐       |
| 1     | ⭐         |

---

## Usage Guidelines

### Mermaid Compatibility

1. Ensure code blocks use ` ```mermaid ` markup
2. Avoid special characters in node labels
3. Use `<br/>` for line breaks
4. Wrap Chinese content in quotes

### Rendering Test

After generation, preview in the following tools:

- GitHub/GitLab preview
- VS Code Mermaid plugin
- https://mermaid.live

### Handling Long Content

When idea count exceeds 20:

1. Mind map shows only top ideas
2. Evaluation matrix shows only key ideas
3. Use tables for complete listings
