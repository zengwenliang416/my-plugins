---
name: plan
description: "OpenSpec Planning Workflow: OpenSpec selection → Context retrieval → Multi-model analysis → Ambiguity resolution → PBT properties → Plan integration → Validation"
---

# /plan - OpenSpec Planning Workflow Command

## Overview

The goal of the plan phase: Refine the OpenSpec proposal into a **zero-decision executable plan** and produce verifiable PBT properties. This phase must be combined with OpenSpec, and all key constraints must be explicitly recorded.

**Supports no-argument invocation**: When executing `/plan` directly, it automatically selects a proposal from `openspec view` to enter planning.

---

## Core Rules

- ✅ Must first `openspec view` and let user confirm `proposal_id`
- ✅ **Must check for thinking phase artifacts** and reuse `handoff.json`, `synthesis.md`, `clarifications.md` if available
- ✅ Must use both Codex and Gemini for multi-model analysis
- ✅ Must complete "ambiguity resolution audit", all decision points must be converted to explicit constraints
- ✅ **Must NOT re-ask questions already answered in thinking phase** (check `thinking-clarifications.md`)
- ✅ Must extract PBT properties (invariants + falsification strategies)
- ✅ Must execute `openspec validate <proposal_id> --strict`
- ✅ Only after explicit user approval can proceed to /dev
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
| **Ignore thinking phase artifacts**  | Check `${THINKING_DIR}/handoff.json` and reuse if exists       |
| **Re-ask clarified questions**       | Read `thinking-clarifications.md`, only ask NEW ambiguities    |
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
   - If project has not initialized OpenSpec → prompt to execute `/init` first
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
     PLAN_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/plan"
     THINKING_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/thinking"
     mkdir -p "${PLAN_DIR}"
     ```

   - **🔗 Thinking Phase Integration** - Check and load thinking artifacts:

     ```bash
     # Check if thinking phase was completed
     if [ -f "${THINKING_DIR}/handoff.json" ]; then
       echo "✅ Thinking phase detected - loading handoff artifacts"
       THINKING_COMPLETED=true
     else
       echo "⚠️ No thinking phase found - proceeding with full analysis"
       THINKING_COMPLETED=false
     fi
     ```

   - **If thinking phase exists**, copy and integrate:

     ```bash
     # Copy key artifacts for reference
     cp "${THINKING_DIR}/handoff.md" "${PLAN_DIR}/thinking-handoff.md" 2>/dev/null || true
     cp "${THINKING_DIR}/handoff.json" "${PLAN_DIR}/thinking-handoff.json" 2>/dev/null || true
     cp "${THINKING_DIR}/synthesis.md" "${PLAN_DIR}/thinking-synthesis.md" 2>/dev/null || true
     cp "${THINKING_DIR}/boundaries.json" "${PLAN_DIR}/thinking-boundaries.json" 2>/dev/null || true
     cp "${THINKING_DIR}/clarifications.md" "${PLAN_DIR}/thinking-clarifications.md" 2>/dev/null || true
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
     ```
     Update state.json: `artifacts.proposal=true`

2. **Step 2: Parallel Context & Requirements Retrieval (with Thinking Reuse)**
   - **🔗 If thinking phase exists** (`THINKING_COMPLETED=true`):
     - Read `thinking-handoff.json` to extract pre-analyzed context boundaries
     - Read `thinking-boundaries.json` to reuse boundary definitions
     - **Skip redundant boundary exploration** - focus on plan-specific details only

     ```bash
     # Reuse thinking boundaries if available
     if [ -f "${PLAN_DIR}/thinking-boundaries.json" ]; then
       echo "📥 Reusing boundaries from thinking phase"
       # Context retriever should reference thinking-boundaries.json
     fi
     ```

   - Launch concurrent retrieval agents with thinking context:
   - **Task for plan-context-retriever:** "Retrieve codebase context, referencing thinking-handoff.json if exists"
   - **Task for requirement-parser:** "Parse requirements, incorporating thinking-synthesis.md constraints"
   - **At most 2 agents in parallel!**
   - JUST RUN AND WAIT!

   ```
   调用 @context-analyzer，参数：description="Retrieve plan context" prompt="Execute context retrieval. run_dir=${PLAN_DIR} thinking_dir=${THINKING_DIR} reuse_thinking=${THINKING_COMPLETED}"

   调用 /requirement-parser，参数：run_dir=${PLAN_DIR} thinking_synthesis=${PLAN_DIR}/thinking-synthesis.md
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
   调用 @codex-architect，参数：description="Codex backend planning" prompt="Execute architecture planning. run_dir=${PLAN_DIR} focus=backend,api,data"

   调用 @gemini-architect，参数：description="Gemini frontend planning" prompt="Execute architecture planning. run_dir=${PLAN_DIR} focus=frontend,components,ux"
   ```

   - **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/codex-plan.md" || { echo "❌ Step 3 FAILED: codex-plan.md not found"; exit 1; }
     test -f "${PLAN_DIR}/gemini-plan.md" || { echo "❌ Step 3 FAILED: gemini-plan.md not found"; exit 1; }
     ```

     Update state.json: `current_step=3`, `artifacts.codex_plan=true`, `artifacts.gemini_plan=true`, `timestamps.step_3="${ISO_TIMESTAMP}"`

   - **⏸️ Hard Stop**: Display core differences and recommendations:

     Which architecture approach do you prefer?

     (a) Codex backend-focused approach
     (b) Gemini frontend-focused approach
     (c) Hybrid approach combining both

4. **Step 4: Ambiguity Resolution & PBT Extraction (with Thinking Reuse)**
   - **🔗 If thinking phase exists** (`THINKING_COMPLETED=true`):
     - Read `thinking-synthesis.md` for pre-resolved constraints
     - Read `thinking-clarifications.md` for user's previous answers
     - **Only ask about NEW ambiguities** not covered in thinking phase

     ```bash
     # Check for pre-resolved clarifications
     if [ -f "${PLAN_DIR}/thinking-clarifications.md" ]; then
       echo "📥 Loading ${CLARIFICATION_COUNT} pre-resolved clarifications from thinking phase"
       # Extract already-answered questions to avoid re-asking
     fi
     ```

   - Call MCP tools for **incremental** ambiguity audit (exclude thinking-resolved items):

     ```
     使用 Codex 分析："Review proposal ${PROPOSAL_ID} for unspecified decision points. Reference thinking-synthesis.md to skip already-resolved constraints. List only NEW: [AMBIGUITY] <description> → [REQUIRED CONSTRAINT] <what must be decided>."

     使用 Gemini 分析："Identify implicit assumptions in proposal ${PROPOSAL_ID}. Reference thinking-clarifications.md to skip already-answered questions. List only NEW: [ASSUMPTION] <description> → [EXPLICIT CONSTRAINT NEEDED] <concrete specification>."
     ```

   - Write output to `${PLAN_DIR}/ambiguities.md`
   - **⏸️ Conditional Hard Stop**:
     - If `THINKING_COMPLETED=true` AND no new ambiguities → **Skip user confirmation**
     - If new ambiguities exist → Present **only new items** for confirmation:

       Found the following new ambiguities requiring clarification:
       1. [Ambiguity description]
       2. [Ambiguity description]

       Please provide decisions for these items.

   - Merge thinking constraints + new constraints into `${PLAN_DIR}/constraints.md`
   - Extract PBT properties via MCP tools:

     ```
     使用 Codex 分析："Extract PBT properties. For each requirement: [INVARIANT] <property> → [FALSIFICATION STRATEGY] <counterexample generation>."

     使用 Gemini 分析："Define system properties: [PROPERTY] <name> | [DEFINITION] <formal description> | [BOUNDARY CONDITIONS] <edge cases>."
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
     调用 /architecture-analyzer，参数：run_dir=${PLAN_DIR} task_type=${TASK_TYPE}
     ```

     **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/architecture.md" || { echo "❌ Step 5a FAILED: architecture.md not found"; exit 1; }
     ```

     Update state.json: `artifacts.architecture=true`

     ```
     调用 /task-decomposer，参数：run_dir=${PLAN_DIR}
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
     调用 /risk-assessor，参数：run_dir=${PLAN_DIR}
     ```

     **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/risks.md" || { echo "❌ Step 5c FAILED: risks.md not found"; exit 1; }
     ```

     Update state.json: `artifacts.risks=true`

     ```
     调用 /plan-synthesizer，参数：run_dir=${PLAN_DIR}
     ```

     **🔒 Checkpoint**:

     ```bash
     test -f "${PLAN_DIR}/plan.md" || { echo "❌ Step 5d FAILED: plan.md not found"; exit 1; }
     ```

     Update state.json: `current_step=5`, `artifacts.plan=true`, `timestamps.step_5="${ISO_TIMESTAMP}"`

   - **⏸️ Hard Stop**: Get plan approval:

     The plan has been synthesized. Please review:
     - Architecture: ${PLAN_DIR}/architecture.md
     - Tasks: ${PLAN_DIR}/tasks.md
     - Risks: ${PLAN_DIR}/risks.md
     - Full Plan: ${PLAN_DIR}/plan.md

     Do you approve this plan to proceed to implementation?

     (a) Approve and proceed
     (b) Request revisions
     (c) Cancel

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

     🚀 Next Action: /dev --proposal-id=${PROPOSAL_ID}
     ```

   - **⏸️ Hard Stop**: Present plan summary and get user approval:

     Planning phase completed successfully.

     Next step: Execute implementation with /dev

     (a) Proceed to development phase
     (b) Review and revise plan
     (c) Exit and review later

   - **Loop Mode (--loop)**: After user approval, automatically chain to `/dev --proposal-id=${PROPOSAL_ID}`

---

## Thinking Phase Integration

When `/thinking` was executed before `/plan`, the following artifacts are reused:

| Thinking Artifact   | Plan Usage                         | Benefit                            |
| ------------------- | ---------------------------------- | ---------------------------------- |
| `handoff.json`      | Step 1: Load constraint summary    | Skip redundant analysis            |
| `boundaries.json`   | Step 2: Reuse context boundaries   | Faster context retrieval           |
| `synthesis.md`      | Step 4: Pre-resolved constraints   | Skip resolved ambiguities          |
| `clarifications.md` | Step 4: User's previous answers    | **Avoid re-asking same questions** |
| `explore-*.json`    | Step 2: Reference boundary details | Deeper context understanding       |

### Data Flow

```
THINKING_DIR/                          PLAN_DIR/
├── handoff.json      ────────────►   ├── thinking-handoff.json
├── handoff.md        ────────────►   ├── thinking-handoff.md
├── synthesis.md      ────────────►   ├── thinking-synthesis.md
├── boundaries.json   ────────────►   ├── thinking-boundaries.json
└── clarifications.md ────────────►   └── thinking-clarifications.md
```

### Conditional Logic

| Condition                  | Step 2 Behavior                         | Step 4 Behavior           |
| -------------------------- | --------------------------------------- | ------------------------- |
| `THINKING_COMPLETED=true`  | Reuse boundaries, incremental retrieval | Only ask NEW ambiguities  |
| `THINKING_COMPLETED=false` | Full context retrieval                  | Full ambiguity resolution |

---

## Parallel Constraints Summary

| Step   | Max Agents | Agent Types                              |
| ------ | ---------- | ---------------------------------------- |
| Step 2 | **2**      | `context-analyzer`, `requirement-parser` |
| Step 3 | **2**      | `codex-architect`, `gemini-architect`    |

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

This command ONLY uses the following agent types:

| Agent Type         | Usage                                  |
| ------------------ | -------------------------------------- |
| `context-analyzer` | Step 2: Codebase context retrieval     |
| `codex-architect`  | Step 3: Backend architecture planning  |
| `gemini-architect` | Step 3: Frontend architecture planning |

Any other agent types are **forbidden** in this command.
