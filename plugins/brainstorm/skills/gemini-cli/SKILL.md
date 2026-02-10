---
name: gemini-cli
description: |
  【触发条件】Brainstorm 需要用户体验与创意视角的方案发散时
  【核心产出】用户价值导向的创意候选项与体验建议
  【不触发】仅关注后端实现细节且无需 UX 创意输入时
  【先问什么】目标用户、使用场景、体验优先级与创新方向
  [Resource Usage] Use `scripts/brainstorm_gemini.ts` with references/ and assets/ materials.
allowed-tools:
  - Bash
  - Read
  - Task
---

# Gemini CLI - User Perspective

UX and creative design expert perspective for idea generation. Focus: user value, emotional experience, innovation breakthroughs.

## Script Entry

```bash
npx tsx scripts/brainstorm_gemini.ts [args]
```

## Resource Usage

- Reference docs: `references/gemini-prompts.md`
- Assets: `assets/roles.json`
- Execution script: `scripts/brainstorm_gemini.ts`

## Execution

```bash
# Standard call
npx tsx scripts/brainstorm_gemini.ts \
  --role brainstorm \
  --prompt "$PROMPT" \
  --method "$METHOD"

# Background parallel execution
npx tsx scripts/brainstorm_gemini.ts \
  --role brainstorm \
  --prompt "$PROMPT" \
  --method "$METHOD" &
```

## Roles

| Role       | Purpose                         |
| ---------- | ------------------------------- |
| brainstorm | Generate user perspective ideas |
| evaluator  | Assess user value               |
| designer   | Convert ideas to UX solutions   |

## Workflow

### Step 1: Build Prompt

```bash
PROMPT="
## Role
You are a senior UX designer and creative expert specializing in user insights and emotional design.

## Task
Based on the research background, generate user-oriented ideas using ${METHOD} method.

## Topic
${TOPIC}

## Research Background
${RESEARCH_BRIEF_SUMMARY}

## Output Requirements
Generate 10+ ideas, each containing:
- id: Unique identifier (format: G-1, G-2, ...)
- title: Concise title
- description: 2-3 sentence description
- user_value: 1-5
- innovation_level: incremental/breakthrough
- emotional_appeal: practical/surprise/delight/resonance
- source: \"gemini\"

## Output Format
Output JSON array only:
[{...}, {...}]
"
```

### Step 2: Call Gemini

```bash
npx tsx scripts/brainstorm_gemini.ts \
  --role brainstorm \
  --prompt "$PROMPT" \
  --method "$METHOD"
```

### Step 3: Parse Output

Extract JSON idea list from Gemini response.

## SCAMPER Focus Points

- **S (Substitute)**: What user needs can be met in new ways?
- **C (Combine)**: Which experiences can merge to create surprises?
- **A (Adapt)**: What experiences from other industries can be borrowed?
- **M (Modify)**: How to enhance interaction/visual/emotion?
- **P (Put to other uses)**: What other scenarios can the product serve?
- **E (Eliminate)**: What pain points can be completely removed?
- **R (Reverse)**: Can traditional assumptions be broken?

## Output Format

```json
[
  {
    "id": "G-1",
    "title": "Emotional Feedback Design",
    "description": "Add micro-interaction animations and emotional copy to bring small surprises.",
    "user_value": 4,
    "innovation_level": "incremental",
    "emotional_appeal": "delight",
    "source": "gemini"
  }
]
```

## Constraints

| Required                     | Forbidden                   |
| ---------------------------- | --------------------------- |
| Output must be JSON          | Use output without review   |
| Include complete metadata    | Omit required fields        |
| Focus on user/UX perspective | Dive into technical details |
| Use Task tool for background | Terminate background tasks  |

## Collaboration

1. **exa** provides research background
2. **codex-cli** generates technical ideas
3. **gemini-cli** generates user ideas (current)
4. Merge and dedupe -> ideas-pool.md
