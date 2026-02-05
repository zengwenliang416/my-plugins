---
name: thought-synthesizer
description: |
  [Trigger] Thinking workflow Phase 4: Synthesize context exploration and constraint set
  [Output] Outputs ${run_dir}/synthesis.md containing constraints/risks/dependencies/success criteria and open questions
  [Skip] When no exploration artifacts (can downgrade to light summary)
  [Ask First] No need to ask, automatically executes
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path
  - name: depth
    type: string
    required: true
    description: Thinking depth (light/deep/ultra)
---

# Thought Synthesizer - Thought Synthesis Atomic Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                       | Trigger     |
| --------------------- | --------------------------------------------- | ----------- |

## Responsibility Boundary

Synthesize exploration results from multiple context boundaries to form unified constraint set.

- **Input**: `${run_dir}/explore-*.json` (core) and optional \*-thought.md
- **Output**: `${run_dir}/synthesis.md`
- **Core Capability**: Constraint synthesis, risk/dependency aggregation, success criteria extraction

---

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  🔄 Thought Synthesis                                            │
│     ❌ Prohibited: Simple concatenation of boundary outputs,    │
│        skip structured synthesis                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Flow



```
  thought: "Planning constraint synthesis strategy. Need: 1) Read explore JSONs 2) Aggregate hard/soft constraints 3) Extract multi-model supplemental constraints 4) Merge dependencies and risks 5) Aggregate success criteria hints 6) Identify open questions 7) Generate structured synthesis.md",
  thoughtNumber: 1,
  totalThoughts: 7,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Read Exploration**: Read boundaries.json and each explore-\*.json
2. **Hard/Soft Constraints**: Distinguish mandatory vs preference constraints
3. **Dependencies/Risks**: Merge and deduplicate
4. **Success Criteria**: Aggregate verifiable behavior hints
5. **Open Questions**: Collect questions needing user clarification
6. **Synthesis Output**: Generate structured synthesis.md

### Step 1: Read All Thought Outputs

```
# Read boundary list (if exists)
Read("${run_dir}/boundaries.json")

# Read each boundary exploration result
Read("${run_dir}/explore-<boundary>.json")

# Optionally read supplemental thought outputs (if exist)
Read("${run_dir}/claude-thought.md")
Read("${run_dir}/codex-thought.md")
Read("${run_dir}/gemini-thought.md")
```

### Step 2: Structured Synthesis Analysis


```
  thought: "Step 1: Merge all constraints_discovered from explore-*.json, distinguish hard/soft constraints.",
  thoughtNumber: 2,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 2: Extract supplemental constraints and risks from codex-thought.md / gemini-thought.md (if exist), annotate source.",
  thoughtNumber: 3,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 3: Merge dependencies and risks, deduplicate and annotate source.",
  thoughtNumber: 4,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 4: Aggregate success_criteria_hints, organize into verifiable criteria.",
  thoughtNumber: 5,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 5: Aggregate open_questions, sort by priority.",
  thoughtNumber: 6,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 6: Generate comprehensive synthesis output, form handoff-ready constraint set summary.",
  thoughtNumber: 7,
  totalThoughts: 7,
  nextThoughtNeeded: false
})
```

### Step 3: Generate Synthesis Report

**Output path**: `${run_dir}/synthesis.md`

**Document template**:

```markdown
---
generated_at: { ISO 8601 timestamp }
synthesizer_version: "1.0"
boundaries_integrated: ["user-domain", "auth-session"]
models_used: ["codex", "gemini"]
depth: { light / deep / ultra }
---

# Constraint Synthesis Report

## Synthesis Overview

- **Participating Boundaries**: { boundary list }
- **Thinking Depth**: { depth }
- **Synthesis Method**: Structured constraint synthesis

## Constraint Set

### Hard Constraints

- {Hard constraint 1}
- {Hard constraint 2}

### Soft Constraints

- {Soft constraint 1}
- {Soft constraint 2}

## Dependencies & Risks

### Dependencies

- {Dependency 1}
- {Dependency 2}

### Risks

- {Risk 1}
- {Risk 2}

## Success Criteria (Hints)

- {Observable success hint 1}
- {Observable success hint 2}

## Open Questions

- {Question 1}
- {Question 2}

## Multi-Model Supplements (Optional)

- **Codex Supplement**: {constraints/risks/criteria from codex-thought.md}
- **Gemini Supplement**: {constraints/risks/criteria from gemini-thought.md}

## Boundary Contributions

| Boundary     | Key Findings | Key Constraints |
| ------------ | ------------ | --------------- |
| {boundary-1} | {findings}   | {constraints}   |
| {boundary-2} | {findings}   | {constraints}   |
```

---

## Light Mode Handling

When only single boundary output exists:

```markdown
---
generated_at: { ISO 8601 timestamp }
synthesizer_version: "1.0"
boundaries_integrated: ["core"]
models_used: []
depth: light
---

# Constraint Synthesis Report (Light Mode)

## Synthesis Overview

- **Participating Boundaries**: core
- **Thinking Depth**: light
- **Note**: Single boundary mode

## Boundary Exploration Results

{Direct reference to core content from explore-core.json}

## Conclusion

{Core constraints and success criteria summary}

## Confidence

- **Overall Confidence**: { High / Medium / Low }
- **Note**: Single boundary analysis, complex problems recommend splitting into more context boundaries
```

---

## Quality Gates

### Tool Usage Verification

- [ ] Read all available explore-\*.json files
- [ ] If codex/gemini thought files exist, extracted supplemental constraints
- [ ] Produced synthesis.md file

### Output Quality Verification

- [ ] Constraints and risks from each boundary extracted completely
- [ ] Constraints categorized into hard/soft
- [ ] Dependencies and risks deduplicated
- [ ] Success criteria hints are verifiable
- [ ] Open questions sorted

---

## Return Value

On success, return:

```json
{
  "status": "success",
  "output_file": "${run_dir}/synthesis.md",
  "boundaries_integrated": ["user-domain", "auth-session"],
  "constraints_count": 12,
  "open_questions_count": 3,
  "overall_confidence": "medium",
  "key_synthesis": "Constraint set summary",
  "next_phase": {
    "phase": 5,
    "name": "conclusion-generator"
  }
}
```

---

## Constraints

- No simple concatenation, must truly analyze and synthesize
- Clearly annotate hard/soft constraints and open questions
- Dependencies and risks need deduplication with source annotation
- Preserve uncertainty, don't force unification
