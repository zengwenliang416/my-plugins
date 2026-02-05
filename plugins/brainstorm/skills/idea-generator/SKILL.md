---
name: idea-generator
description: |
  [Trigger] Brainstorm Phase 2: Multi-model parallel idea generation
  [Output] ${run_dir}/ideas-pool.md (minimum 20 ideas)
  [Skip] research-brief.md does not exist
  [Ask] When method param missing, ask preferred divergence method (scamper/hats/auto)
  [Required] Must call codex-cli and gemini-cli in parallel
allowed-tools:
  - Read
  - Write
  - Skill
  - Bash
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

# Idea Generator

Generate ideas using multi-model parallel execution (Codex + Gemini) based on divergence frameworks.

## MCP Tool Integration

| Tool                  | Purpose                                             | Required |
| --------------------- | --------------------------------------------------- | -------- |
| `auggie-mcp`          | Retrieve code structure for technical context       | Yes      |
| `context7`            | Query technical docs for implementation inspiration | Yes      |

## Parameters

| Param   | Type   | Required | Description                                         |
| ------- | ------ | -------- | --------------------------------------------------- |
| run_dir | string | Yes      | Run directory path                                  |
| method  | string | No       | Divergence method (scamper/hats/auto), default auto |

## Prerequisites

1. Verify `${run_dir}/research-brief.md` exists
2. If not, prompt user to run topic-researcher first

## Workflow

### Step 1: Read Research Brief

```bash
research_brief=$(cat "${run_dir}/research-brief.md")
```

Extract: topic, core problem, divergence directions, key trends/cases.


**Required MCP call:**

```
  thought: "Plan idea divergence strategy. Topic: {topic}. Determine method, angle coverage, idea count target.",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Focus areas:** Method selection -> Multi-angle coverage (tech/user/business) -> Idea targets -> Blind spot check -> Quality criteria

### Step 2.1: Code Context Enhancement (auggie-mcp)

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Analyze project architecture for {topic}: existing modules, technical constraints, extensible interfaces"
})
```

### Step 2.2: Technical Inspiration (context7)

```
mcp__context7__resolve-library-id({
  libraryName: "{technology_name}",
  query: "{topic} innovative implementations and new features"
})

mcp__context7__query-docs({
  libraryId: "{resolved_library_id}",
  query: "{topic} advanced usage, new features, innovation patterns"
})
```

### Step 2.3: Determine Divergence Method

**If method = auto:**

- Product/feature innovation -> SCAMPER
- Strategy/decision problems -> Six Thinking Hats
- Mixed problems -> Half from each method

**If method = scamper:** Use SCAMPER (see references/scamper.md)
**If method = hats:** Use Six Thinking Hats (see references/six-hats.md)

If method param missing, use AskUserQuestion to ask preference.

### Step 3: Build Prompts

**CODEX_PROMPT (Technical perspective):**

```
Role: Senior technical architect
Task: Generate 10+ tech-oriented ideas using ${METHOD}
Topic: ${TOPIC}
Background: ${RESEARCH_BRIEF_SUMMARY}

Output per idea:
- id: C-1, C-2, ...
- title, description (2-3 sentences)
- technical_complexity: 1-5
- timeline: short/medium/long term
- dependencies: list
- source: "codex"

Format: JSON array only
```

**GEMINI_PROMPT (User perspective):**

```
Role: Senior UX designer and creative expert
Task: Generate 10+ user-oriented ideas using ${METHOD}
Topic: ${TOPIC}
Background: ${RESEARCH_BRIEF_SUMMARY}

Output per idea:
- id: G-1, G-2, ...
- title, description (2-3 sentences)
- user_value: 1-5
- innovation_level: incremental/breakthrough
- emotional_appeal: practical/surprise/delight/resonance
- source: "gemini"

Format: JSON array only
```

### Step 4: Parallel Multi-Model Execution

**Required: Use Bash background parallel execution**

```bash
CODEX_OUTPUT="${run_dir}/codex-ideas.json"
GEMINI_OUTPUT="${run_dir}/gemini-ideas.json"

~/.claude/bin/codeagent-wrapper codex \
  --role brainstorm \
  --prompt "$CODEX_PROMPT" \
  --sandbox read-only > "$CODEX_OUTPUT" 2>&1 &
CODEX_PID=$!

~/.claude/bin/codeagent-wrapper gemini \
  --role brainstorm \
  --prompt "$GEMINI_PROMPT" > "$GEMINI_OUTPUT" 2>&1 &
GEMINI_PID=$!

wait $CODEX_PID $GEMINI_PID
```

### Step 5: Collect and Validate Results

```bash
CODEX_IDEAS=$(cat "${run_dir}/codex-ideas.json")
GEMINI_IDEAS=$(cat "${run_dir}/gemini-ideas.json")

echo "$CODEX_IDEAS" | jq . > /dev/null || echo "Codex output format error"
echo "$GEMINI_IDEAS" | jq . > /dev/null || echo "Gemini output format error"
```

### Step 6: Merge and Deduplicate

1. Parse JSON outputs from both models
2. Add source labels: `[codex]` or `[gemini]`
3. Deduplicate using semantic similarity (>80% merge)
4. Renumber: C-1, C-2, ... (Codex), G-1, G-2, ... (Gemini)

### Step 7: Generate ideas-pool.md

```markdown
---
generated_at: { timestamp }
topic: "{topic}"
method: "{method}"
total_ideas: { N }
sources:
  codex: { N1 }
  gemini: { N2 }
---

# Ideas Pool

## Statistics

| Source | Count | Ratio |
| ------ | ----- | ----- |
| Codex  | {N1}  | {%}   |
| Gemini | {N2}  | {%}   |

## Ideas from Codex (Technical/Feasibility)

#### C-1: {title}

**Description**: {desc}
**Technical Complexity**: {1-5}
**Timeline**: {short/medium/long}
**Dependencies**: {list}

## Ideas from Gemini (Creative/User)

#### G-1: {title}

**Description**: {desc}
**User Value**: {1-5}
**Innovation Level**: {incremental/breakthrough}
**Emotional Appeal**: {desc}

## Category View

- **Feature Innovation**: C-1, G-3, ...
- **UX Optimization**: G-1, G-2, ...
- **Technical Breakthrough**: C-2, C-3, ...
```

## Output Validation

Confirm:

- `${run_dir}/ideas-pool.md` exists
- Total ideas >= 20
- Both models contributed
- Each idea has complete metadata
