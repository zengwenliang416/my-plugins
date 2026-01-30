# Multi-Model Parallel Divergence Prompts

## Architecture Overview

```
                    ┌─────────────────┐
                    │  Research Brief │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │     Codex       │           │     Gemini      │
    │  Tech/Feasibility│          │  Creative/User  │
    └────────┬────────┘           └────────┬────────┘
             │                             │
             │    ┌─────────────────┐      │
             └───►│   Ideas Pool    │◄─────┘
                  │  (Merge & Dedup) │
                  └─────────────────┘
```

## Codex Base Framework

### System Role

```
You are a senior technical architect and backend expert, skilled in:
- System design and architecture planning
- Technical feasibility assessment
- Performance optimization and scalability considerations
- Data model design
- API design
```

### Prompt Template

````
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
   - Where are the technical difficulties?
   - What tech stack is required?
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
- id: Unique identifier (format: {method_prefix}-{number})
- title: Concise idea title
- description: 2-3 sentences describing the core concept
- technical_complexity: Technical complexity 1-5 points
  - 1: Can be directly implemented with existing technology
  - 2: Requires minimal new technology learning
  - 3: Moderate technical challenge
  - 4: Higher technical barrier
  - 5: Cutting-edge technology exploration
- timeline: Implementation cycle
  - "short-term": < 1 week
  - "medium-term": 1-4 weeks
  - "long-term": > 1 month
- dependencies: List of key technical dependencies
- source: "codex"

## JSON Output Format

```json
[
  {
    "id": "C-1",
    "title": "Idea Title",
    "description": "Idea description...",
    "technical_complexity": 3,
    "timeline": "medium-term",
    "dependencies": ["dependency1", "dependency2"],
    "source": "codex"
  }
]
````

Please generate at least 10 high-quality ideas.

```

## Gemini Base Framework

### System Role

```

You are a senior creative designer and user experience expert, skilled in:

- User insights and empathy
- Innovative thinking and cross-domain association
- Experience design and emotional design
- Brand strategy and market positioning
- Trend capture and concept innovation

```

### Prompt Template

```

## Task Background

Topic: {topic}

Research Summary:
{research_brief_summary}

## Your Task

Based on the above background, use the {method} method to generate 10+ user-oriented ideas.

## Thinking Dimensions

Consider each idea from the following perspectives:

1. **User Value**
   - What user pain points does it solve?
   - What unique value does it bring?
   - Why would users choose this?

2. **Emotional Experience**
   - What emotional reactions will users have?
   - What will delight users?
   - How to build emotional connections?

3. **Innovation Level**
   - How is it different from existing solutions?
   - Is it incremental or disruptive?
   - Can it form a differentiated advantage?

4. **Market Potential**
   - Who is the target user group?
   - How large is the market size?
   - Where is the growth potential?

## Output Requirements

Each idea includes:

- id: Unique identifier (format: {method_prefix}-{number})
- title: Concise idea title
- description: 2-3 sentences describing the core concept
- user_value: User value 1-5 points
  - 1: Nice to have
  - 2: Somewhat helpful
  - 3: Solves real problems
  - 4: Significantly improves experience
  - 5: Disruptive value
- innovation_level: Innovation level
  - "incremental": Optimization of existing solutions
  - "breakthrough": Entirely new approach
- emotional_appeal: Emotional appeal keyword
  - e.g.: delight, trust, joy, reassurance, anticipation, accomplishment
- source: "gemini"

## JSON Output Format

```json
[
  {
    "id": "G-1",
    "title": "Idea Title",
    "description": "Idea description...",
    "user_value": 4,
    "innovation_level": "breakthrough",
    "emotional_appeal": "delight",
    "source": "gemini"
  }
]
```

Please generate at least 10 high-quality ideas, focusing on diversity and novelty.

```

## Method-Specific Prefixes

| Method | Codex Prefix | Gemini Prefix |
|--------|--------------|---------------|
| SCAMPER | S-1, C-1, A-1, M-1, P-1, E-1, R-1 | S-1, C-1, A-1, M-1, P-1, E-1, R-1 |
| Six Thinking Hats | W-1, R-1, B-1, Y-1, G-1, BL-1 | W-1, R-1, B-1, Y-1, G-1, BL-1 |
| Auto | C-1, C-2, ... | G-1, G-2, ... |

## Merge and Deduplication Strategy

### Similarity Judgment

Two ideas are considered similar (need merging) when:
- Title keyword overlap > 60%
- Description semantic similarity > 80%
- Same problem being solved

### Merge Rules

1. Keep the version with more detailed description
2. Merge advantage assessments from both versions
3. Mark dual sources: `[codex+gemini]`

### Post-Deduplication Numbering

Renumber uniformly after merging:
- `C-1, C-2, ...`: Codex source only
- `G-1, G-2, ...`: Gemini source only
- `M-1, M-2, ...`: Merged sources

## Quality Control

### Idea Quality Check

High-quality idea characteristics:
- Specific and actionable
- Clear value proposition
- Implementation path considered
- Differentiated highlights

Low-quality idea characteristics:
- Too abstract or vague
- Weak relevance to the topic
- Lack of feasibility consideration
- No difference from existing solutions

### Quantity Requirements

| Metric | Minimum Requirement | Ideal State |
|--------|---------------------|-------------|
| Total ideas | 20 | 30+ |
| Codex contribution | 8 | 12+ |
| Gemini contribution | 8 | 12+ |
| High-scoring ideas (>=4) | 5 | 10+ |
```
