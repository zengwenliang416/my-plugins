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
  - Glob
  - Grep
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__codex__codex
  - mcp__gemini__gemini
---

# /tpd:plan - OpenSpec Planning Workflow Command

## Overview

The goal of the plan phase: Refine the OpenSpec proposal into a **zero-decision executable plan** and produce verifiable PBT properties. This phase must be combined with OpenSpec, and all key constraints must be explicitly recorded.

**Supports no-argument invocation**: When executing `/tpd:plan` directly, it automatically selects a proposal from `openspec view` to enter planning.

---

## Core Rules

- ✅ Must first `openspec view` and let user confirm `proposal_id`
- ✅ **Must check for thinking phase manifest** and reuse thinking artifacts via `meta/artifact-manifest.json` if available
- ✅ Must use both Codex and Gemini for multi-model analysis
- ✅ Must complete "ambiguity resolution audit", all decision points must be converted to explicit constraints
- ✅ **Must NOT re-ask questions already answered in thinking phase** (resolve `clarifications.md` via thinking manifest)
- ✅ Must extract PBT properties (invariants + falsification strategies)
- ✅ Must execute `openspec validate <proposal_id> --strict`
- ✅ Only after explicit user approval can proceed to /tpd:dev
- ✅ **Task Splitting Rule**: When a task involves modifying or generating **more than 3 files**, it MUST be split into sub-tasks, and each sub-task MUST include test requirements

**Forbidden Actions:**

- ❌ Providing solutions when requirements are unclear
- ❌ Only doing single-model analysis
- ❌ Entering dev without validation
- ❌ Writing to OpenSpec without confirmation

---

## 🚨 Mandatory Execution Rules

### Step Execution Policy

```
┌─────────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL: You MUST NOT skip any step!                       │
│                                                                 │
│  Before proceeding to next step, you MUST:                      │
│  1. Execute the required Skill/Task call                        │
│  2. Verify output file exists (🔒 Checkpoint)                   │
│  3. Update state.json with current step                         │
│                                                                 │
│  If verification fails → STOP and report error                  │
│  DO NOT proceed with "shortcut" or "direct execution"           │
└─────────────────────────────────────────────────────────────────┘
```

### Anti-Patterns (FORBIDDEN)

| ❌ Forbidden Behavior                | ✅ Correct Approach                                            |
| ------------------------------------ | -------------------------------------------------------------- |
| **Ignore thinking phase artifacts**  | Resolve artifacts via `${THINKING_DIR}/meta/artifact-manifest.json` |
| **Re-ask clarified questions**       | Read `${THINKING_CLARIFICATIONS_MD}`, only ask NEW ambiguities |
| Skip context retrieval               | Always call context-analyzer AND requirement-parser            |
| Only do single-model architecture    | Must run both codex-architect AND gemini-architect             |
| Skip ambiguity resolution            | Must complete ambiguity audit and get confirmations            |
| Proceed without verifying artifacts  | Check file exists at EVERY checkpoint                          |
| Skip validation                      | Always run `openspec validate --strict`                        |
| Task with >3 files without splitting | Split into sub-tasks, each with test requirements and ≤3 files |

---

## Actions

0. **Step 0: OpenSpec Status Check**
   - Execute OpenSpec Dashboard detection:
     ```bash
     openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
     ```
   - If project has not initialized OpenSpec → prompt to execute `/tpd:init` first
   - Parse `proposal_id` priority:
     1. Explicitly passed as argument
     2. If `openspec view` has only 1 Active Change → auto-select
     3. Otherwise let user select from `openspec view` output
   - **When invoked without arguments**: Do not error, enter auto-selection flow

1. **Step 1: Initialization & Thinking Phase Integration**
   - Parse arguments:
     - TASK_TYPE: fullstack (default) | frontend | backend
     - LOOP_MODE: Whether to auto-chain to dev (--loop argument)
     - PROPOSAL_ID: Confirmed from Step 0
	   - Generate run directory:

	     ```bash
	     PLAN_DIR="openspec/changes/${PROPOSAL_ID}/plan"
	     THINKING_DIR="openspec/changes/${PROPOSAL_ID}/thinking"
	     THINKING_META_DIR="${THINKING_DIR}/meta"
	     THINKING_MANIFEST="${THINKING_META_DIR}/artifact-manifest.json"
	     mkdir -p "${PLAN_DIR}"
	     ```

	   - **🔗 Thinking Phase Integration** - Check and resolve thinking artifacts via manifest:

	     ```bash
	     # Initialize resolved thinking artifact paths
	     THINKING_HANDOFF_MD=""
	     THINKING_HANDOFF_JSON=""
	     THINKING_SYNTHESIS_MD=""
	     THINKING_BOUNDARIES_JSON=""
	     THINKING_CLARIFICATIONS_MD=""

	     # Check if thinking phase manifest exists
	     if [ -f "${THINKING_MANIFEST}" ]; then
	       echo "✅ Thinking phase manifest detected - resolving artifact references"
	       THINKING_COMPLETED=true

	       THINKING_HANDOFF_MD=$(jq -r '.artifacts[]? | select(.name=="handoff.md") | .path' "${THINKING_MANIFEST}" | head -n1)
	       THINKING_HANDOFF_JSON=$(jq -r '.artifacts[]? | select(.name=="handoff.json") | .path' "${THINKING_MANIFEST}" | head -n1)
	       THINKING_SYNTHESIS_MD=$(jq -r '.artifacts[]? | select(.name=="synthesis.md") | .path' "${THINKING_MANIFEST}" | head -n1)
	       THINKING_BOUNDARIES_JSON=$(jq -r '.artifacts[]? | select(.name=="boundaries.json") | .path' "${THINKING_MANIFEST}" | head -n1)
	       THINKING_CLARIFICATIONS_MD=$(jq -r '.artifacts[]? | select(.name=="clarifications.md") | .path' "${THINKING_MANIFEST}" | head -n1)

	       # Optional artifacts may be empty; handoff.json is required to treat thinking as completed
	       if [ -z "${THINKING_HANDOFF_JSON}" ] || [ "${THINKING_HANDOFF_JSON}" = "null" ]; then
	         echo "⚠️ Thinking manifest exists but handoff.json entry missing - fallback to full analysis"
	         THINKING_COMPLETED=false
	       fi
	     else
	       echo "⚠️ No thinking phase manifest found - proceeding with full analysis"
	       THINKING_COMPLETED=false
	     fi
	     ```

	   - **If thinking phase exists**, consume by reference (no file copy):

	     ```bash
	     if [ "${THINKING_COMPLETED}" = true ]; then
	       echo "📥 Thinking artifacts resolved from manifest:"
	       echo "  - handoff: ${THINKING_HANDOFF_JSON}"
	       echo "  - synthesis: ${THINKING_SYNTHESIS_MD}"
	       echo "  - boundaries: ${THINKING_BOUNDARIES_JSON}"
	       echo "  - clarifications: ${THINKING_CLARIFICATIONS_MD}"
	     fi
	     ```

   - **Initialize State Machine** - Write `${PLAN_DIR}/state.json`:
     ```json
     {
       "proposal_id": "${PROPOSAL_ID}",
       "current_step": 1,
       "status": "initialized",
       "task_type": "${TASK_TYPE}",
       "thinking_integrated": "${THINKING_COMPLETED}",
       "artifacts": {
         "proposal": false,
         "thinking_handoff": "${THINKING_COMPLETED}",
         "context": false,
         "requirements": false,
         "codex_plan": false,
         "gemini_plan": false,
         "ambiguities": false,
         "constraints": false,
         "pbt": false,
         "architecture": false,
         "tasks": false,
         "risks": false,
         "plan": false
       },
       "timestamps": {
         "started": "${ISO_TIMESTAMP}",
         "step_1": "${ISO_TIMESTAMP}"
       }
     }
	     ```
	   - Write `${PLAN_DIR}/input.md`
	   - Load proposal content via `/openspec:proposal ${PROPOSAL_ID}`
	   - Write proposal content to `${PLAN_DIR}/proposal.md`
   - **🔒 Checkpoint**:
	     ```bash
	     test -f "${PLAN_DIR}/state.json" || { echo "❌ Step 1 FAILED: state.json not created"; exit 1; }
	     test -f "${PLAN_DIR}/proposal.md" || { echo "❌ Step 1 FAILED: proposal.md not found"; exit 1; }
	     if [ "${THINKING_COMPLETED}" = true ]; then
	       test -n "${THINKING_HANDOFF_JSON}" || { echo "❌ Step 1 FAILED: THINKING_HANDOFF_JSON unresolved"; exit 1; }
	       test -f "${THINKING_HANDOFF_JSON}" || { echo "❌ Step 1 FAILED: handoff.json not found at resolved path"; exit 1; }
	     fi
	     ```
	     Update state.json: `artifacts.proposal=true`

	2. **Step 2: Parallel Context & Requirements Retrieval (with Thinking Reuse)**
	   - **🔗 If thinking phase exists** (`THINKING_COMPLETED=true`):
	     - Read `${THINKING_HANDOFF_JSON}` to extract pre-analyzed context boundaries
	     - Read `${THINKING_BOUNDARIES_JSON}` to reuse boundary definitions
	     - **Skip redundant boundary exploration** - focus on plan-specific details only

	     ```bash
	     # Reuse thinking boundaries if available
	     if [ -n "${THINKING_BOUNDARIES_JSON}" ] && [ -f "${THINKING_BOUNDARIES_JSON}" ]; then
	       echo "📥 Reusing boundaries from thinking phase"
	       # Context retriever should reference ${THINKING_BOUNDARIES_JSON}
	     fi
	     ```

	   - Launch concurrent retrieval agents with thinking context:
	   - **Task for plan-context-retriever:** "Retrieve codebase context, referencing resolved thinking handoff if exists"
	   - **Task for requirement-parser:** "Parse requirements, incorporating resolved synthesis constraints"
	   - **At most 2 agents in parallel!**
	   - JUST RUN AND WAIT!

   ```
	   Task(subagent_type="tpd:investigation:context-analyzer", description="Retrieve plan context", prompt="Execute context retrieval. run_dir=${PLAN_DIR} thinking_dir=${THINKING_DIR} reuse_thinking=${THINKING_COMPLETED}")

	   Skill(skill="tpd:requirement-parser", args="run_dir=${PLAN_DIR} thinking_synthesis=${THINKING_SYNTHESIS_MD}")
	   ```

   - **🔒 Checkpoint**:
     ```bash
     test -f "${PLAN_DIR}/context.md" || { echo "❌ Step 2 FAILED: context.md not found"; exit 1; }
     test -f "${PLAN_DIR}/requirements.md" || { echo "❌ Step 2 FAILED: requirements.md not found"; exit 1; }
     ```
     Update state.json: `current_step=2`, `artifacts.context=true`, `artifacts.requirements=true`, `timestamps.step_2="${ISO_TIMESTAMP}"`

3. **Step 3: Parallel Multi-Model Architecture Planning**
   - In parallel, launch dedicated architect agents to create architecture plans.
   - **Task for codex-architect:** "Create backend architecture plan. Analyze codebase patterns, design API contracts, define data models."
   - **Task for gemini-architect:** "Create frontend architecture plan. Analyze component structure, design state management, plan responsive layout."
   - **At most 2 architect agents!**
   - JUST RUN AND WAIT!

   ```
   Task(subagent_type="tpd:planning:codex-architect", description="Codex backend planning", prompt="Execute architecture planning. run_dir=${PLAN_DIR} focus=backend,api,data")

   Task(subagent_type="tpd:planning:gemini-architect", description="Gemini frontend planning", prompt="Execute architecture planning. run_dir=${PLAN_DIR} focus=frontend,components,ux")
   ```

   - **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/codex-plan.md" || { echo "❌ Step 3 FAILED: codex-plan.md not found"; exit 1; }
     test -f "${PLAN_DIR}/gemini-plan.md" || { echo "❌ Step 3 FAILED: gemini-plan.md not found"; exit 1; }
     ```

     Update state.json: `current_step=3`, `artifacts.codex_plan=true`, `artifacts.gemini_plan=true`, `timestamps.step_3="${ISO_TIMESTAMP}"`

   - **⏸️ Hard Stop**: Use AskUserQuestion to display core differences and recommendations

	4. **Step 4: Ambiguity Resolution & PBT Extraction (with Thinking Reuse)**
	   - **🔗 If thinking phase exists** (`THINKING_COMPLETED=true`):
	     - Read `${THINKING_SYNTHESIS_MD}` for pre-resolved constraints
	     - Read `${THINKING_CLARIFICATIONS_MD}` for user's previous answers
	     - **Only ask about NEW ambiguities** not covered in thinking phase

	     ```bash
	     # Check for pre-resolved clarifications
	     if [ -n "${THINKING_CLARIFICATIONS_MD}" ] && [ -f "${THINKING_CLARIFICATIONS_MD}" ]; then
	       echo "📥 Loading ${CLARIFICATION_COUNT} pre-resolved clarifications from thinking phase"
	       # Extract already-answered questions to avoid re-asking
	     fi
	     ```

	   - Call MCP tools for **incremental** ambiguity audit (exclude manifest-resolved thinking items):

	     ```
	     mcp__codex__codex: "Review proposal ${PROPOSAL_ID} for unspecified decision points. Reference ${THINKING_SYNTHESIS_MD} to skip already-resolved constraints. List only NEW: [AMBIGUITY] <description> → [REQUIRED CONSTRAINT] <what must be decided>."

	     mcp__gemini__gemini: "Identify implicit assumptions in proposal ${PROPOSAL_ID}. Reference ${THINKING_CLARIFICATIONS_MD} to skip already-answered questions. List only NEW: [ASSUMPTION] <description> → [EXPLICIT CONSTRAINT NEEDED] <concrete specification>."
	     ```

   - Write output to `${PLAN_DIR}/ambiguities.md`
   - **⏸️ Conditional Hard Stop**:
     - If `THINKING_COMPLETED=true` AND no new ambiguities → **Skip user confirmation**
     - If new ambiguities exist → Use AskUserQuestion to confirm **only new items**
   - Merge thinking constraints + new constraints into `${PLAN_DIR}/constraints.md`
   - Extract PBT properties via MCP tools:

     ```
     mcp__codex__codex: "Extract PBT properties. For each requirement: [INVARIANT] <property> → [FALSIFICATION STRATEGY] <counterexample generation>."

     mcp__gemini__gemini: "Define system properties: [PROPERTY] <name> | [DEFINITION] <formal description> | [BOUNDARY CONDITIONS] <edge cases>."
     ```

   - Write output to `${PLAN_DIR}/pbt.md`
   - **🔒 Checkpoint**:
     ```bash
     test -f "${PLAN_DIR}/ambiguities.md" || { echo "❌ Step 4 FAILED: ambiguities.md not found"; exit 1; }
     test -f "${PLAN_DIR}/constraints.md" || { echo "❌ Step 4 FAILED: constraints.md not found"; exit 1; }
     test -f "${PLAN_DIR}/pbt.md" || { echo "❌ Step 4 FAILED: pbt.md not found"; exit 1; }
     ```
     Update state.json: `current_step=4`, `artifacts.ambiguities=true`, `artifacts.constraints=true`, `artifacts.pbt=true`, `timestamps.step_4="${ISO_TIMESTAMP}"`

5. **Step 5: Sequential Integration**
   - Execute in sequence:

     ```
     Skill(skill="tpd:architecture-analyzer", args="run_dir=${PLAN_DIR} task_type=${TASK_TYPE}")
     ```

     **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/architecture.md" || { echo "❌ Step 5a FAILED: architecture.md not found"; exit 1; }
     ```

     Update state.json: `artifacts.architecture=true`

     ```
     Skill(skill="tpd:task-decomposer", args="run_dir=${PLAN_DIR}")
     ```

     **🔒 Task Splitting Validation**:

     After task decomposition, verify the "3-file rule":
     - For each task in `tasks.md`, count the files to be modified/generated
     - If any task involves **> 3 files**, it MUST be split into sub-tasks
     - Each sub-task MUST explicitly include:
       - `[TEST]` section with test requirements
       - Maximum 3 files scope
       - Clear success criteria

     ```bash
     # Validate task splitting rule
     if grep -E "Files:\s*[4-9]|Files:\s*[1-9][0-9]" "${PLAN_DIR}/tasks.md" >/dev/null 2>&1; then
       echo "❌ Step 5b FAILED: Task exceeds 3-file limit. Must split into sub-tasks with test requirements."
       exit 1
     fi
     ```

     **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/tasks.md" || { echo "❌ Step 5b FAILED: tasks.md not found"; exit 1; }
     ```

     Update state.json: `artifacts.tasks=true`

     ```
     Skill(skill="tpd:risk-assessor", args="run_dir=${PLAN_DIR}")
     ```

     **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/risks.md" || { echo "❌ Step 5c FAILED: risks.md not found"; exit 1; }
     ```

     Update state.json: `artifacts.risks=true`

     ```
     Skill(skill="tpd:plan-synthesizer", args="run_dir=${PLAN_DIR}")
     ```

     **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/plan.md" || { echo "❌ Step 5d FAILED: plan.md not found"; exit 1; }
     ```

     Update state.json: `current_step=5`, `artifacts.plan=true`, `timestamps.step_5="${ISO_TIMESTAMP}"`

   - **⏸️ Hard Stop**: Use AskUserQuestion to get plan approval

6. **Step 6: Validation & Delivery**
   - **🔒 Final Checkpoint - Verify ALL Artifacts**:

     ```bash
     MISSING=""
     test -f "${PLAN_DIR}/proposal.md" || MISSING="${MISSING} proposal.md"
     test -f "${PLAN_DIR}/context.md" || MISSING="${MISSING} context.md"
     test -f "${PLAN_DIR}/requirements.md" || MISSING="${MISSING} requirements.md"
     test -f "${PLAN_DIR}/codex-plan.md" || MISSING="${MISSING} codex-plan.md"
     test -f "${PLAN_DIR}/gemini-plan.md" || MISSING="${MISSING} gemini-plan.md"
     test -f "${PLAN_DIR}/ambiguities.md" || MISSING="${MISSING} ambiguities.md"
     test -f "${PLAN_DIR}/constraints.md" || MISSING="${MISSING} constraints.md"
     test -f "${PLAN_DIR}/pbt.md" || MISSING="${MISSING} pbt.md"
     test -f "${PLAN_DIR}/architecture.md" || MISSING="${MISSING} architecture.md"
     test -f "${PLAN_DIR}/tasks.md" || MISSING="${MISSING} tasks.md"
     test -f "${PLAN_DIR}/risks.md" || MISSING="${MISSING} risks.md"
     test -f "${PLAN_DIR}/plan.md" || MISSING="${MISSING} plan.md"

     if [ -n "$MISSING" ]; then
       echo "❌ CRITICAL: Missing artifacts before ExitPlanMode:${MISSING}"
       echo "Cannot proceed. Workflow incomplete."
       exit 1
     fi
     echo "✅ All 12 artifacts verified"
     ```

   - Execute OpenSpec validation:
     ```bash
     openspec validate ${PROPOSAL_ID} --strict
     ```
   - If failed, show details:

     ```bash
     openspec show ${PROPOSAL_ID} --json --deltas-only
     ```

   - Update state.json: `status="completed"`, `timestamps.completed="${ISO_TIMESTAMP}"`

   - Output completion summary:

     ```
     🎉 Planning Complete!

     📋 Proposal: ${PROPOSAL_ID}
     🔀 Type: ${TASK_TYPE}

     📁 Artifacts:
       ${PLAN_DIR}/
       ├── input.md
       ├── proposal.md
       ├── requirements.md
       ├── context.md
       ├── codex-plan.md
       ├── gemini-plan.md
       ├── ambiguities.md
       ├── constraints.md
       ├── pbt.md
       ├── architecture.md
       ├── tasks.md
       ├── risks.md
       └── plan.md

     🚀 Next Action: /tpd:dev --proposal-id=${PROPOSAL_ID}
     ```

   - **⏸️ Hard Stop**: Use AskUserQuestion to present plan summary and get user approval before proceeding

   - **Loop Mode (--loop)**: After user approval, automatically chain to `/tpd:dev --proposal-id=${PROPOSAL_ID}`

---

## Thinking Phase Integration

When `/tpd:thinking` was executed before `/tpd:plan`, artifacts are resolved via `meta/artifact-manifest.json` and reused by reference:

| Thinking Artifact   | Resolved Path Variable       | Plan Usage                         | Benefit                            |
| ------------------- | ---------------------------- | ---------------------------------- | ---------------------------------- |
| `handoff.json`      | `THINKING_HANDOFF_JSON`      | Step 1: Load constraint summary    | Skip redundant analysis            |
| `boundaries.json`   | `THINKING_BOUNDARIES_JSON`   | Step 2: Reuse context boundaries   | Faster context retrieval           |
| `synthesis.md`      | `THINKING_SYNTHESIS_MD`      | Step 4: Pre-resolved constraints   | Skip resolved ambiguities          |
| `clarifications.md` | `THINKING_CLARIFICATIONS_MD` | Step 4: User's previous answers    | **Avoid re-asking same questions** |
| `explore-*.json`    | (via manifest entries)       | Step 2: Reference boundary details | Deeper context understanding       |

### Data Flow

```
THINKING_DIR/meta/artifact-manifest.json
├── handoff.json      ────────────►   THINKING_HANDOFF_JSON
├── handoff.md        ────────────►   THINKING_HANDOFF_MD
├── synthesis.md      ────────────►   THINKING_SYNTHESIS_MD
├── boundaries.json   ────────────►   THINKING_BOUNDARIES_JSON
└── clarifications.md ────────────►   THINKING_CLARIFICATIONS_MD

PLAN phase consumes resolved paths directly (NO copy to PLAN_DIR).
```

### Conditional Logic

| Condition                  | Step 2 Behavior                         | Step 4 Behavior           |
| -------------------------- | --------------------------------------- | ------------------------- |
| `THINKING_COMPLETED=true`  | Reuse boundaries, incremental retrieval | Only ask NEW ambiguities  |
| `THINKING_COMPLETED=false` | Full context retrieval                  | Full ambiguity resolution |

---

## Parallel Constraints Summary

| Step   | Max Agents | Agent Types                                                     |
| ------ | ---------- | --------------------------------------------------------------- |
| Step 2 | **2**      | `tpd:investigation:context-analyzer`, `tpd:requirement-parser`  |
| Step 3 | **2**      | `tpd:planning:codex-architect`, `tpd:planning:gemini-architect` |

---

## Checkpoint Summary

| Step | Checkpoint | Artifacts Verified                     | State Update                                               |
| ---- | ---------- | -------------------------------------- | ---------------------------------------------------------- |
| 1    | 🔒         | state.json, proposal.md                | artifacts.proposal=true                                    |
| 2    | 🔒         | context.md, requirements.md            | current_step=2, artifacts.context/requirements=true        |
| 3    | 🔒         | codex-plan.md, gemini-plan.md          | current_step=3, artifacts.codex_plan/gemini_plan=true      |
| 4    | 🔒         | ambiguities.md, constraints.md, pbt.md | current_step=4, artifacts.ambiguities/constraints/pbt=true |
| 5a   | 🔒         | architecture.md                        | artifacts.architecture=true                                |
| 5b   | 🔒         | tasks.md                               | artifacts.tasks=true                                       |
| 5c   | 🔒         | risks.md                               | artifacts.risks=true                                       |
| 5d   | 🔒         | plan.md                                | current_step=5, artifacts.plan=true                        |
| 6    | 🔒         | ALL 12 artifacts                       | status="completed"                                         |

---

## Error Handling

### Validation Failure

```
⚠️ OpenSpec Validation Failed

Details: ${VALIDATION_ERRORS}

Suggestions:
1. Review constraints.md for missing decisions
2. Check pbt.md for incomplete properties
3. Return to Step 4 for ambiguity resolution
```

### Model Call Failure

```
⚠️ ${MODEL} Planning Failed

Error: ${ERROR_MESSAGE}

Handling:
- Continue with available model results
- Mark missing perspective in plan.md
```

### Checkpoint Failure

```
❌ Checkpoint Failed at Step ${STEP}

Missing: ${ARTIFACT_NAME}

Recovery:
1. Check if the previous Skill/Task completed successfully
2. Re-run the failed step
3. If issue persists, check state.json for last successful step
```

---

## Agent Type Restrictions

This command ONLY uses the following agent types via the `Task` tool:

| Agent Type                           | Usage                                  |
| ------------------------------------ | -------------------------------------- |
| `tpd:investigation:context-analyzer` | Step 2: Codebase context retrieval     |
| `tpd:planning:codex-architect`       | Step 3: Backend architecture planning  |
| `tpd:planning:gemini-architect`      | Step 3: Frontend architecture planning |

Any other `subagent_type` values are **forbidden** in this command.
