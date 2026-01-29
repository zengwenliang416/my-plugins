---
name: context-explorer
description: |
  [Trigger] Thinking workflow Phase 3: Explore codebase by context boundary
  [Output] Outputs ${run_dir}/explore-<boundary>.json
  [🚨 Mandatory Tool 🚨] Must use auggie-mcp for semantic retrieval
  [Skip] When only subjective analysis is required
  [Ask First] No need to ask, automatically executes
allowed-tools:
  - Read
  - Write
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path
  - name: boundary
    type: string
    required: true
    description: Context boundary name (kebab-case)
  - name: scope
    type: string
    required: false
    description: Boundary scope description (optional)
---

# Context Explorer - Context Boundary Exploration Atomic Skill

## Responsibility Boundary

Complete codebase exploration within specified context boundary, output structured constraint set, no solution design or code modification.

- **Input**: `${run_dir}/input.md` + `boundary` + `scope (optional)`
- **Output**: `${run_dir}/explore-${boundary}.json`
- **Core Capability**: Semantic retrieval, constraint extraction, risk and dependency identification
- **Write Scope**: Only allowed to write to `${run_dir}` (in OpenSpec artifacts directory), prohibited from modifying project business code and other OpenSpec specifications

---

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Context Exploration                                          │
│     ✅ Required: mcp__auggie-mcp__codebase-retrieval             │
│     ✅ Required: mcp__sequential-thinking__sequentialthinking    │
│     ❌ Prohibited: Output based on intuition only, skip         │
│        semantic retrieval                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output Template (Strictly Follow)

```json
{
  "module_name": "<boundary>",
  "existing_structures": ["..."],
  "existing_conventions": ["..."],
  "constraints_discovered": ["..."],
  "open_questions": ["..."],
  "dependencies": ["..."],
  "risks": ["..."],
  "success_criteria_hints": ["..."]
}
```

---

## Execution Flow

### Step 0: Structured Retrieval Planning (sequential-thinking)

🚨 **Must first use sequential-thinking to plan retrieval strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning context exploration strategy. Need: 1) Read requirements 2) Clarify boundary scope 3) Design retrieval queries 4) Extract constraints and risks 5) Form structured JSON output",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: Read Input

```
Read("${run_dir}/input.md")
```

### Step 2: Semantic Retrieval (Must use auggie-mcp)

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Retrieve relevant code and structures within boundary <boundary>. Please return: key modules/files, existing patterns, constraints, dependencies, risks, potential success criteria hints."
})
```

> If scope is provided, reflect it in the retrieval query.

### Step 3: Extract Constraints and Risks (sequential-thinking)

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Based on retrieval results, organize existing_structures / existing_conventions / constraints_discovered / dependencies / risks / open_questions / success_criteria_hints.",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 4: Output JSON

**Output path**: `${run_dir}/explore-${boundary}.json`

```
Write("${run_dir}/explore-${boundary}.json", <JSON>)
```

---

## Quality Gates

- [ ] Called `mcp__auggie-mcp__codebase-retrieval`
- [ ] Output JSON strictly follows template
- [ ] Did not modify any project code
