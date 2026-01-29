---
name: complexity-analyzer
description: |
  [Trigger] Thinking workflow Phase 2: Evaluate problem complexity to determine thinking depth
  [Output] Outputs ${run_dir}/complexity-analysis.md containing complexity score and recommended depth
  [Skip] When user has explicitly specified --depth parameter
  [Ask First] No need to ask, automatically analyzes
  [🚨 Mandatory] Must use sequential-thinking MCP for structured analysis
allowed-tools:
  - Read
  - Write
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path (passed by command)
---

# Complexity Analyzer - Complexity Evaluation Atomic Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                     | Trigger     |
| --------------------- | ------------------------------------------- | ----------- |
| `sequential-thinking` | Structured complexity evaluation, multi-dim | 🚨 Required |

## Responsibility Boundary

- **Input**: User question (read from `${run_dir}/input.md`)
- **Output**: `${run_dir}/complexity-analysis.md`
- **Core Capability**: Multi-dimensional complexity evaluation, depth routing

---

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Complexity Analysis                                          │
│     ✅ Required: mcp__sequential-thinking__sequentialthinking   │
│     ❌ Prohibited: Giving scores directly, skipping structured  │
│        analysis                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Flow

### Step 0: Structured Evaluation Planning (sequential-thinking)

🚨 **Must first use sequential-thinking to plan evaluation strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning complexity evaluation strategy. Need: 1) Read question 2) Analyze structural complexity 3) Evaluate domain depth 4) Estimate reasoning steps 5) Detect ambiguity level 6) Synthesize score",
  thoughtNumber: 1,
  totalThoughts: 6,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Question Reading**: Get original question content
2. **Structure Analysis**: Question length, nested sub-questions, sentence complexity
3. **Domain Identification**: Question type, domains involved, knowledge depth
4. **Reasoning Evaluation**: Required reasoning steps, need for hypothesis verification
5. **Ambiguity Detection**: Multiple interpretations, implicit assumptions, clarification needs
6. **Score Synthesis**: Weighted calculation, depth recommendation

### Step 1: Read Question

```
Read("${run_dir}/input.md")
```

### Step 2: Structured Complexity Analysis

**Use sequential-thinking for 5-step analysis**:

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Step 1: Analyze question length and structure. Question content: '${QUESTION}'. Evaluate: question length (word count), nested sub-questions, sentence complexity.",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "Step 2: Identify question type and domain depth. Determine: factual query, reasoning analysis, design decision, or composite problem? What domains are involved?",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "Step 3: Evaluate reasoning step count. How many steps needed for complete answer? Intermediate reasoning required? Hypothesis verification needed?",
  thoughtNumber: 3,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "Step 4: Detect ambiguity level. Multiple interpretations possible? Need to clarify premises? Implicit assumptions exist?",
  thoughtNumber: 4,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "Step 5: Synthesize score and recommendation. Based on above analysis, give 1-10 complexity score and recommend thinking depth (light/deep/ultra).",
  thoughtNumber: 5,
  totalThoughts: 5,
  nextThoughtNeeded: false
})
```

### Step 3: Generate Evaluation Report

**Output path**: `${run_dir}/complexity-analysis.md`

**Document template**:

```markdown
---
generated_at: { ISO 8601 timestamp }
analyzer_version: "1.0"
---

# Complexity Evaluation Report

## Original Question

{Question content}

## Evaluation Dimensions

### 1. Structural Complexity

- **Question length**: {word count} words
- **Sub-question count**: {count}
- **Structure score**: {1-10}

### 2. Domain Depth

- **Question type**: {Factual query / Reasoning analysis / Design decision / Composite}
- **Domains involved**: {Domain list}
- **Domain score**: {1-10}

### 3. Reasoning Complexity

- **Estimated steps**: {step count}
- **Requires hypothesis verification**: {Yes/No}
- **Reasoning score**: {1-10}

### 4. Ambiguity Level

- **Interpretations**: {Single / Multiple}
- **Implicit assumptions**: {List}
- **Ambiguity score**: {1-10}

## Overall Evaluation

| Dimension | Score | Weight | Weighted Score |
| --------- | ----- | ------ | -------------- |
| Structure | {n}   | 0.2    | {weighted}     |
| Domain    | {n}   | 0.3    | {weighted}     |
| Reasoning | {n}   | 0.3    | {weighted}     |
| Ambiguity | {n}   | 0.2    | {weighted}     |
| **Total** |       |        | **{total}**    |

## Recommendations

- **Complexity level**: {Low / Medium / High}
- **Recommended depth**: {light / deep / ultra}
- **Rationale**: {Brief explanation}

## Keyword Detection

| Detection Item  | Result   | Triggers Depth |
| --------------- | -------- | -------------- |
| "ultrathink"    | {Yes/No} | ultra          |
| "deep analysis" | {Yes/No} | ultra          |
| "think hard"    | {Yes/No} | deep           |
| "think deeply"  | {Yes/No} | deep           |
| "simple"        | {Yes/No} | light          |
```

---

## Scoring Rules

### Complexity Score Standards

| Score Range | Level  | Recommended Depth | Typical Scenarios                     |
| ----------- | ------ | ----------------- | ------------------------------------- |
| 1-3         | Low    | light             | Simple Q&A, fact queries, definitions |
| 4-6         | Medium | deep              | Comparisons, option selection, design |
| 7-10        | High   | ultra             | Architecture, multi-step, complex dec |

### Keyword Priority

Keyword detection > Complexity score > Default recommendation

```
if contains "ultrathink" or "deep analysis":
    return "ultra"
elif contains "think hard" or "think deeply":
    return "deep"
elif contains "simple" or "quick":
    return "light"
else:
    return based on complexity score
```

---

## Quality Gates

### Tool Usage Verification

- [ ] Called `mcp__sequential-thinking__sequentialthinking` at least 5 times
- [ ] Each evaluation dimension has explicit score
- [ ] Produced complexity-analysis.md file

### Output Quality Verification

- [ ] All four dimension scores complete
- [ ] Overall score calculated correctly
- [ ] Depth recommendation matches score
- [ ] Keyword detection results recorded

---

## Return Value

On success, return:

```json
{
  "status": "success",
  "output_file": "${run_dir}/complexity-analysis.md",
  "complexity_score": 6.5,
  "recommended_depth": "deep",
  "keyword_override": null,
  "dimensions": {
    "structure": 5,
    "domain": 7,
    "reasoning": 8,
    "ambiguity": 6
  },
  "next_phase": {
    "phase": 3,
    "name": "multi-model-thinking",
    "depth": "deep"
  }
}
```

---

## Constraints

- Must use sequential-thinking for structured analysis
- Must output complete complexity-analysis.md
- Keyword detection takes priority over scoring
- Score must be integer or one decimal between 1-10
