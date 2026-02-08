---
name: handoff-generator
description: |
  [Trigger] Thinking workflow Phase 6: Generate handoff summary and structured artifacts
  [Output] Outputs ${run_dir}/handoff.md and ${run_dir}/handoff.json
  [Skip] None
  [Ask First] No need to ask, automatically executes
  [🚨 Mandatory] Must read input.md/synthesis.md/conclusion.md/state.json
---

# Handoff Generator - Handoff Artifact Generation Atomic Skill

## MCP Tool Integration

| MCP Tool | Purpose | Trigger |
| -------- | ------- | ------- |

## Responsibility Boundary

Transform thinking conclusions and synthesis results into handoff-ready **constraint set + verifiable criteria** for subsequent plan phase.

- **Input**: `${run_dir}/input.md`, `${run_dir}/synthesis.md`, `${run_dir}/conclusion.md`, `${run_dir}/state.json`
- **Output**: `${run_dir}/handoff.md`, `${run_dir}/handoff.json`
- **Core Capability**: Constraint extraction, non-goal clarification, success criteria and acceptance criteria structuring
- **Write Scope**: Allowed to write to `openspec/` specification files; prohibited from modifying project code

---

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  🤝 Handoff Artifacts                                            │
│     ❌ Prohibited: Output conclusion without extracting         │
│        handoff elements                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Flow

```
  thought: "Planning handoff extraction strategy. Need: 1) Read input and conclusion 2) Extract constraints 3) Clarify non-goals 4) Generate success criteria 5) Define acceptance criteria 6) Generate English task name and proposal_id 7) Generate OpenSpec specification and write to openspec/ (don't modify business code)",
  thoughtNumber: 1,
  totalThoughts: 7,
  nextThoughtNeeded: true
})
```

### Step 1: Read Input and State

```
使用 Read 工具读取 ${run_dir}/state.json
使用 Read 工具读取 ${run_dir}/input.md
使用 Read 工具读取 ${run_dir}/synthesis.md
使用 Read 工具读取 ${run_dir}/conclusion.md
使用 Read 工具读取 ${run_dir}/boundaries.json
使用 Read 工具读取 ${run_dir}/explore-<boundary>.json
使用 Read 工具读取 ${run_dir}/clarifications.md
```

```
  thought: "Step 1: Extract [Constraints] and their sources (hard/soft) from explore-*.json and synthesis.",
  thoughtNumber: 2,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 2: Identify [Non-Goals] and explicit exclusions to prevent scope creep in subsequent phases.",
  thoughtNumber: 3,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 3: Form [Success Criteria] (observable outcomes), emphasize verifiability.",
  thoughtNumber: 4,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 4: Define [Acceptance Criteria] (executable checks), distinguish from success criteria.",
  thoughtNumber: 5,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 5: Add open questions and risks (if any), keep concise.",
  thoughtNumber: 6,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 6: Generate or reuse English task name and proposal_id (verb prefix, kebab-case). If state.json already has proposal_id, verify and reuse.",
  thoughtNumber: 7,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

  thought: "Step 7: Generate OpenSpec specification and write to openspec/changes (don't modify business code).",
  thoughtNumber: 7,
  totalThoughts: 7,
  nextThoughtNeeded: false
})
```

### Step 3: Generate or Reuse English Task Name and proposal_id (Rules)

**Rules**:

- Verb prefix selection (by semantics):
  - New/Add/Support → `add`
  - Update/Modify/Optimize → `update`
  - Delete/Remove → `remove`
  - Refactor/Organize → `refactor`
  - Migrate/Replace → `migrate`
  - Integrate/Connect → `integrate`
  - Fix/Correct → `fix`
- Generate English phrase (2-6 words), noun phrase as main
- Combine as `verb-noun-phrase`, all lowercase, kebab-case
- Allow using English keywords from conclusion summary
- Validate regex: `^[a-z][a-z0-9-]{2,50}$`
- If state.json already has `proposal_id`: must reuse and validate regex `^[a-z][a-z0-9-]{2,50}$`
- If missing and cannot generate: `add-{{short_id}}` (fallback only, short_id is 4-6 random alphanumeric chars)

**Output**:

- `proposal_title` (English title)
- `proposal_id` (kebab-case)

### Step 4: Generate OpenSpec Specification (Write to openspec/)

**Principle**: Thinking phase **directly writes to project `openspec/` directory**, does not modify business code.

**Pre-check**:

```
Terminal 命令检查 openspec 目录是否存在：
if [ ! -d "openspec" ]; then
  echo "OpenSpec not initialized. Please run /init first"
  exit 1
fi
```

**Target paths**:

- `openspec/project.md`
- `openspec/AGENTS.md`
- `openspec/changes/{{proposal_id}}/proposal.md`
- `openspec/changes/{{proposal_id}}/tasks.md`
- `openspec/changes/{{proposal_id}}/specs/{{capability_id}}/spec.md`

**capability_id default rule**:

- When not explicitly specified, `capability_id = proposal_id`

**Template**: Use `assets/openspec.*.template.md`

### Step 5: Generate handoff.md

**Output path**: `${run_dir}/handoff.md`

**Template**: Reference `assets/handoff.template.md`

### Step 6: Generate handoff.json

**Output path**: `${run_dir}/handoff.json`

**Also update state.json**: Write `proposal_id`

```bash
Terminal 命令更新 state.json：
tmp_file="${run_dir}/state.json.tmp"
jq --arg proposal_id "$proposal_id" '.proposal_id=$proposal_id' "${run_dir}/state.json" > "$tmp_file" && mv "$tmp_file" "${run_dir}/state.json"
```

**JSON structure**:

```json
{
  "source": "thinking",
  "proposal_id": "add-some-feature",
  "summary": "One sentence conclusion",
  "summary_en": "add some feature",
  "constraints": {
    "hard": ["..."],
    "soft": ["..."]
  },
  "non_goals": ["..."],
  "success_criteria": ["..."],
  "acceptance_criteria": ["..."],
  "open_questions": ["..."],
  "risks": ["..."],
  "paths": {
    "openspec_root": "openspec",
    "openspec_proposal": "openspec/changes/<proposal_id>/proposal.md",
    "openspec_tasks": "openspec/changes/<proposal_id>/tasks.md",
    "openspec_spec": "openspec/changes/<proposal_id>/specs/<capability_id>/spec.md"
  }
}
```

---

## Quality Gates

### Tool Usage Verification

- [ ] Read input/synthesis/conclusion/state four files
- [ ] Produced handoff.md and handoff.json
- [ ] index.json updated latest pointer
