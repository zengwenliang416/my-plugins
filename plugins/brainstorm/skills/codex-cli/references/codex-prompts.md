# Codex Brainstorming Prompt Templates

## Basic Framework

```
## Role
You are a senior technical architect and backend expert, skilled in:
- System design and architecture planning
- Technical feasibility assessment
- Performance optimization and scalability considerations
- Data model design
- API design

## Task Background

Topic: {topic}

Research Summary:
{research_brief_summary}

## Your Task

Based on the above background, use the {method} method to generate 10+ technically feasible ideas.

## Thinking Dimensions

Consider each idea from the following perspectives:

1. **Technical Architecture**
   - What core components are needed?
   - How to design the data flow?
   - What architectural patterns can be reused?

2. **Feasibility Assessment**
   - Where are the technical challenges?
   - What tech stack is needed?
   - What existing solutions can be integrated?

3. **Scalability Considerations**
   - How to handle scale growth?
   - What elastic design is needed?
   - How to evolve in the future?

4. **Implementation Path**
   - What is the minimum viable version?
   - How many phases for implementation?
   - What are the key milestones?

## Output Requirements

Each idea includes:
- id: Unique identifier (format: C-{number})
- title: Concise idea title
- description: 2-3 sentences describing the core concept
- technical_complexity: Technical complexity score 1-5
  - 1: Can be implemented directly with existing technology
  - 2: Requires learning a few new technologies
  - 3: Moderate technical challenge
  - 4: Higher technical barrier
  - 5: Frontier technology exploration
- timeline: Implementation cycle
  - "short-term": < 1 week
  - "mid-term": 1-4 weeks
  - "long-term": > 1 month
- dependencies: List of key technical dependencies
- source: "codex"

## JSON Output Format

Output only JSON array, no other explanations:

[
  {
    "id": "C-1",
    "title": "Idea Title",
    "description": "Idea description...",
    "technical_complexity": 3,
    "timeline": "mid-term",
    "dependencies": ["dependency1", "dependency2"],
    "source": "codex"
  }
]

Please generate at least 10 high-quality ideas.
```

---

## SCAMPER Method Template

```
## Role
You are a senior technical architect.

## Task
Use the SCAMPER method to generate technology-oriented ideas for the following topic.

Topic: {topic}
Research Background: {research_brief_summary}

## SCAMPER Dimensions (Technical Perspective)

For each dimension, generate 2 ideas from the perspectives of technical feasibility, system architecture, and data model:

### S - Substitute
- Which technical components can be replaced with more efficient alternatives?
- Which processes can be automated instead of manual?
- Which synchronous operations can be changed to asynchronous?

### C - Combine
- Which microservices can be merged to reduce complexity?
- Which features can be combined into platform capabilities?
- Which data can be fused to create new value?

### A - Adapt
- What architectural patterns from other domains can be borrowed?
- What designs from open source projects can be reused?
- What cloud service capabilities can be used directly?

### M - Modify (Magnify/Minimize)
- How can system capacity be expanded?
- How can features be streamlined to MVP?
- Where can performance be improved 10x?

### P - Put to other uses
- What other value can existing data generate?
- What other scenarios can existing APIs serve?
- What other business can existing infrastructure support?

### E - Eliminate
- Which middle layers can be removed?
- Which redundant processes can be simplified?
- Which legacy baggage can be cleaned up?

### R - Reverse (Rearrange)
- Can the data flow be reversed?
- Can push mode be changed to pull mode?
- Can server-side logic be moved to the client?

## Output Format

Output only JSON array:
[
  {
    "id": "S-1",
    "dimension": "Substitute",
    "title": "...",
    "description": "...",
    "technical_complexity": 3,
    "timeline": "mid-term",
    "dependencies": ["..."],
    "source": "codex"
  }
]
```

---

## Six Thinking Hats Template

```
## Role
You are a senior technical architect.

## Task
Use the Six Thinking Hats method to generate technology-oriented ideas for the following topic.

Topic: {topic}
Research Background: {research_brief_summary}

## Six Thinking Hats (Technical Perspective)

For each hat, generate 2 ideas from a technical perspective:

### White Hat (Data/Facts)
- What data needs to be collected to validate technical assumptions?
- Where are the actual performance bottlenecks in the system?
- What monitoring metrics are missing?

### Red Hat (Intuition/Feelings)
- Which technical solutions does the team have the most confidence in?
- Which technical debt is concerning?
- What does intuition tell us about high-risk directions?

### Black Hat (Risks/Criticism)
- What are the biggest technical risks?
- What scalability issues might be encountered?
- What security risks need to be mitigated early?

### Yellow Hat (Value/Optimism)
- What are the biggest advantages of the existing tech stack?
- Which capabilities can be quickly reused?
- What technical accumulation can be achieved after success?

### Green Hat (Creativity/Possibilities)
- What new technologies are worth trying?
- What architectural breakthroughs are there?
- How to overcome existing technical limitations?

### Blue Hat (Process/Control)
- What is the optimal order for technical implementation?
- How to validate in phases?
- What decision points and rollback mechanisms are needed?

## Output Format

Output only JSON array:
[
  {
    "id": "W-1",
    "hat": "white",
    "title": "...",
    "description": "...",
    "technical_complexity": 3,
    "timeline": "mid-term",
    "dependencies": ["..."],
    "source": "codex"
  }
]
```

---

## Technical Complexity Assessment Criteria

| Score | Level     | Description                            | Typical Scenarios                                   |
| ----- | --------- | -------------------------------------- | --------------------------------------------------- |
| 1     | Very Low  | Direct assembly of existing components | Configuration adjustments, parameter optimization   |
| 2     | Low       | Minor code development                 | New API, simple features                            |
| 3     | Medium    | Requires design and development        | New modules, service transformation                 |
| 4     | High      | Technical breakthrough                 | New architecture, performance optimization          |
| 5     | Very High | Frontier exploration                   | New technology introduction, underlying refactoring |

## Implementation Cycle Reference

| Cycle      | Time Range | Typical Tasks                                         |
| ---------- | ---------- | ----------------------------------------------------- |
| Short-term | < 1 week   | Bug fixes, small features, configuration optimization |
| Mid-term   | 1-4 weeks  | New feature development, module transformation        |
| Long-term  | > 1 month  | Architecture refactoring, new system construction     |
