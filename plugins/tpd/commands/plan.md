---
description: "OpenSpec Planning Workflow: OpenSpec selection → Context retrieval → Multi-model analysis → Ambiguity resolution → PBT properties → Plan integration → Validation"
argument-hint: "[proposal_id] [--task-type=frontend|backend|fullstack] [--loop]"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Write
  - Task
  - Bash
  - mcp__codex__codex
  - mcp__gemini__gemini
---

# /tpd:plan - OpenSpec Planning Workflow Command

## Overview

The goal of the plan phase: Refine the OpenSpec proposal into a **zero-decision executable plan** and produce verifiable PBT properties. This phase must be combined with OpenSpec, and all key constraints must be explicitly recorded.

**Supports no-argument invocation**: When executing `/tpd:plan` directly, it automatically selects a proposal from `openspec view` to enter planning (consistent with gudaspec behavior).

---

## 🚨🚨🚨 Mandatory Execution Rules 🚨🚨🚨

**Hard requirements aligned with GudaSpec Plan:**

- ✅ Must first `openspec view` and let user confirm `proposal_id`
- ✅ Must use both `mcp__codex__codex` and `mcp__gemini__gemini` for multi-model analysis
- ✅ Must complete "ambiguity resolution audit", all decision points must be converted to explicit constraints
- ✅ Must extract PBT properties (invariants + falsification strategies)
- ✅ Must execute `openspec validate <proposal_id> --strict`
- ✅ Only after explicit user approval can proceed to /tpd:dev

**Forbidden Actions:**

- ❌ Providing solutions when requirements are unclear
- ❌ Only doing single-model analysis
- ❌ Entering dev without validation
- ❌ Writing to OpenSpec without confirmation

**OpenSpec Rules:**

- thinking phase has already written directly to `openspec/`, plan phase no longer imports drafts
- Any phase must reference `openspec/AGENTS.md` (if missing, first run `openspec update`)

---

## Phase 0: OpenSpec Status Check (Supports Auto-Chaining)

1. Execute (OpenSpec Dashboard detection consistent with official workflow):

```bash
openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
```

2. If project has not initialized OpenSpec:
   - Immediately prompt to execute `/tpd:init`
   - Continue this phase after completion

3. proposal_id parsing priority:
   - proposal_id explicitly passed as argument
   - If `openspec view` has only 1 Active Change → auto-select
   - Otherwise let user select from `openspec view` output

4. **When invoked without arguments**: Do not error, directly enter the auto-selection flow above.

---

## Phase 1: Initialization

1. Parse arguments:
   - TASK_TYPE: fullstack (default) | frontend | backend
   - LOOP_MODE: Whether to auto-chain to dev (--loop argument)
   - PROPOSAL_ID: Confirmed proposal_id (from Phase 0)

2. Generate run directory path (fixed path, under OpenSpec):
   - PLAN_DIR: `openspec/changes/${PROPOSAL_ID}/artifacts/plan`

```bash
mkdir -p "${PLAN_DIR}"
```

3. Write `${PLAN_DIR}/state.json` and `${PLAN_DIR}/input.md`
   - If no explicit feature description: extract summary from proposal.md to write to input.md
   - Write proposal_id for /tpd:dev auto-chaining

---

## Phase 2: Load OpenSpec Proposal

1. thinking phase has already written directly to openspec/; plan phase only executes based on OpenSpec official content.

2. Read proposal:

```
/openspec:proposal ${PROPOSAL_ID}
```

3. Write proposal content to `${PLAN_DIR}/proposal.md` (for subsequent aggregation)

---

## Phase 3: Requirement Parsing (Optional but Recommended)

**Call Skill tool immediately:**

```
Skill(skill="tpd:requirement-parser", args="run_dir=${PLAN_DIR}")
```

**Verify**: Confirm `${PLAN_DIR}/requirements.md` is generated

---

## Phase 4: Context Retrieval

**Call Skill tool immediately:**

```
Skill(skill="tpd:plan-context-retriever", args="run_dir=${PLAN_DIR}")
```

**Verify**: Confirm `${PLAN_DIR}/context.md` is generated

---

## Phase 5: Multi-Model Implementation Analysis (Required)

**Call MCP in parallel:**

```
mcp__codex__codex: "Analyze proposal ${PROPOSAL_ID}: Provide implementation approach, identify technical risks, and suggest alternative architectures. Focus on edge cases and failure modes."

mcp__gemini__gemini: "Analyze proposal ${PROPOSAL_ID}: Evaluate from maintainability, scalability, and integration perspectives. Highlight potential conflicts with existing systems."
```

**Output**:

- `${PLAN_DIR}/analysis-codex.md`
- `${PLAN_DIR}/analysis-gemini.md`

**⏸️ Hard Stop**: AskUserQuestion to display core differences and recommendations, continue after confirmation

---

## Phase 6: Multi-Model Ambiguity Resolution Audit (Required)

**Call MCP in parallel:**

```
mcp__codex__codex: "Review proposal ${PROPOSAL_ID} for decision points that remain unspecified. List each as: [AMBIGUITY] <description> → [REQUIRED CONSTRAINT] <what must be decided>."

mcp__gemini__gemini: "Identify implicit assumptions in proposal ${PROPOSAL_ID}. For each assumption, specify: [ASSUMPTION] <description> → [EXPLICIT CONSTRAINT NEEDED] <concrete specification>."
```

**Output**: `${PLAN_DIR}/ambiguities.md`

**⏸️ Hard Stop**: Must use AskUserQuestion to confirm each item, write conclusions to `${PLAN_DIR}/constraints.md`

**If ambiguity cannot be resolved**: Return to /tpd:thinking or terminate

---

## Phase 7: Multi-Model PBT Property Extraction (Required)

**Call MCP in parallel:**

```
mcp__codex__codex: "Extract Property-Based Testing properties from proposal ${PROPOSAL_ID}. For each requirement, identify: [INVARIANT] <property> → [FALSIFICATION STRATEGY] <how to generate counterexamples>."

mcp__gemini__gemini: "Analyze proposal ${PROPOSAL_ID} for system properties. Define: [PROPERTY] <name> | [DEFINITION] <formal description> | [BOUNDARY CONDITIONS] <edge cases> | [COUNTEREXAMPLE GENERATION] <approach>."
```

**Output**: `${PLAN_DIR}/pbt.md`

---

## Phase 8: Multi-Model Planning Refinement (Can Parallel)

Call based on task_type:

```
Skill(skill="tpd:codex-planner", args="run_dir=${PLAN_DIR}")
Skill(skill="tpd:gemini-planner", args="run_dir=${PLAN_DIR}")
```

**Verify**: `codex-plan.md` / `gemini-plan.md`

---

## Phase 9: Architecture Integration

```
Skill(skill="tpd:architecture-analyzer", args="run_dir=${PLAN_DIR} task_type=${TASK_TYPE}")
```

**Verify**: `architecture.md`

---

## Phase 10: Task Decomposition

```
Skill(skill="tpd:task-decomposer", args="run_dir=${PLAN_DIR}")
```

**Verify**: `tasks.md`

---

## Phase 11: Risk Assessment

```
Skill(skill="tpd:risk-assessor", args="run_dir=${PLAN_DIR}")
```

**Verify**: `risks.md`

---

## Phase 12: Plan Integration

```
Skill(skill="tpd:plan-synthesizer", args="run_dir=${PLAN_DIR}")
```

**Verify**: `plan.md`

**⏸️ Hard Stop**: AskUserQuestion to get plan approval

---

## Phase 13: OpenSpec Validation

```bash
openspec validate ${PROPOSAL_ID} --strict
```

If failed:

```bash
openspec show ${PROPOSAL_ID} --json --deltas-only
```

---

## Phase 14: Delivery / Chaining

Output completion summary:

```
🎉 Planning Task Complete!

📋 Proposal: ${PROPOSAL_ID}
🔀 Type: ${TASK_TYPE}
📁 Artifacts:
  ${PLAN_DIR}/
  ├── input.md
  ├── proposal.md
  ├── requirements.md
  ├── context.md
  ├── analysis-codex.md
  ├── analysis-gemini.md
  ├── ambiguities.md
  ├── constraints.md
  ├── pbt.md
  ├── codex-plan.md
  ├── gemini-plan.md
  ├── architecture.md
  ├── tasks.md
  ├── risks.md
  └── plan.md

🚀 Next Actions:
/tpd:dev --proposal-id=${PROPOSAL_ID}
```

### Loop Mode (--loop)

After user approval **automatically chain** to /tpd:dev:

```
/tpd:dev --proposal-id=${PROPOSAL_ID}
```
