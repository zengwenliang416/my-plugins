---
name: codex-cli
description: "Technical perspective idea generation"
allowed-tools:
  - Bash
  - Read
  - Task
---

# Codex CLI - Technical Perspective

Technical architect perspective for idea generation. Focus: technical feasibility, system architecture, implementation paths.

## Execution

```bash
# Standard call
~/.claude/bin/codeagent-wrapper codex \
  --role brainstorm \
  --prompt "$PROMPT" \
  --sandbox read-only

# Background parallel execution
~/.claude/bin/codeagent-wrapper codex \
  --role brainstorm \
  --prompt "$PROMPT" \
  --sandbox read-only &
```

## Roles

| Role       | Purpose                              |
| ---------- | ------------------------------------ |
| brainstorm | Generate technical perspective ideas |
| evaluator  | Assess technical feasibility         |
| architect  | Convert ideas to technical solutions |

## Workflow

### Step 1: Build Prompt

```bash
PROMPT="
## Role
You are a senior technical architect specializing in system design and feasibility assessment.

## Task
Based on the research background, generate technical-oriented ideas using ${METHOD} method.

## Topic
${TOPIC}

## Research Background
${RESEARCH_BRIEF_SUMMARY}

## Output Requirements
Generate 10+ ideas, each containing:
- id: Unique identifier (format: C-1, C-2, ...)
- title: Concise title
- description: 2-3 sentence description
- technical_complexity: 1-5
- timeline: short-term/mid-term/long-term
- dependencies: Technical dependency list
- source: \"codex\"

## Output Format
Output JSON array only:
[{...}, {...}]
"
```

### Step 2: Call Codex

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role brainstorm \
  --prompt "$PROMPT" \
  --sandbox read-only
```

### Step 3: Parse Output

Extract JSON idea list from Codex response.

## SCAMPER Focus Points

- **S (Substitute)**: Which technologies/components can be replaced?
- **C (Combine)**: Which functions/services can be combined?
- **A (Adapt)**: What can be borrowed from other domains?
- **M (Modify)**: How to adjust performance/scale?
- **P (Put to other uses)**: What else can existing capabilities solve?
- **E (Eliminate)**: Which steps can be simplified?
- **R (Reverse)**: Can processes/architecture be inverted?

## Output Format

```json
[
  {
    "id": "C-1",
    "title": "Microservices Migration",
    "description": "Split monolith into microservices for better scalability.",
    "technical_complexity": 4,
    "timeline": "long-term",
    "dependencies": ["Docker", "Kubernetes", "API Gateway"],
    "source": "codex"
  }
]
```

## Constraints

| Required                     | Forbidden                  |
| ---------------------------- | -------------------------- |
| Use `--sandbox read-only`    | Use output without review  |
| Output must be JSON          | Generate unstructured text |
| Include complete metadata    | Omit required fields       |
| Use Task tool for background | Terminate background tasks |

## Collaboration

1. **exa** provides research background
2. **codex-cli** generates technical ideas (current)
3. **gemini-cli** generates user ideas
4. Merge and dedupe -> ideas-pool.md
