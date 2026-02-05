---
description: "OpenSpec Planning Workflow: OpenSpec selection → Context retrieval → Multi-model analysis → Ambiguity resolution → PBT properties → Plan integration → Validation"
argument-hint: "[proposal_id] [--task-type=frontend|backend|fullstack] [--loop]"
allowed-tools:
  - EnterPlanMode
  - ExitPlanMode
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

## ⚠️ MANDATORY: Enter Plan Mode First

**CRITICAL INSTRUCTION**: Upon invoking this command, you MUST immediately call `EnterPlanMode` to enter Claude Code's native plan mode. This is non-negotiable.

```
EnterPlanMode()
```

After entering plan mode, proceed with the workflow below. All exploration and planning happens IN plan mode. Only call `ExitPlanMode` when the final plan is ready for user approval.

---

## Overview

The goal of the plan phase: Refine the OpenSpec proposal into a **zero-decision executable plan** and produce verifiable PBT properties. This phase must be combined with OpenSpec, and all key constraints must be explicitly recorded.

**Supports no-argument invocation**: When executing `/tpd:plan` directly, it automatically selects a proposal from `openspec view` to enter planning.

---

## Core Rules

- ✅ Must first `openspec view` and let user confirm `proposal_id`
- ✅ Must use both Codex and Gemini for multi-model analysis
- ✅ Must complete "ambiguity resolution audit", all decision points must be converted to explicit constraints
- ✅ Must extract PBT properties (invariants + falsification strategies)
- ✅ Must execute `openspec validate <proposal_id> --strict`
- ✅ Only after explicit user approval can proceed to /tpd:dev

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

| ❌ Forbidden Behavior                    | ✅ Correct Approach                                 |
| ---------------------------------------- | --------------------------------------------------- |
| Skip context retrieval                   | Always call context-analyzer AND requirement-parser |
| Only do single-model architecture        | Must run both codex-architect AND gemini-architect  |
| Skip ambiguity resolution                | Must complete ambiguity audit and get confirmations |
| Proceed without verifying artifacts      | Check file exists at EVERY checkpoint               |
| Exit plan mode before final verification | Verify ALL 12 artifacts before ExitPlanMode         |
| Skip validation                          | Always run `openspec validate --strict`             |

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

1. **Step 1: Initialization**
   - Parse arguments:
     - TASK_TYPE: fullstack (default) | frontend | backend
     - LOOP_MODE: Whether to auto-chain to dev (--loop argument)
     - PROPOSAL_ID: Confirmed from Step 0
   - Generate run directory:
     ```bash
     PLAN_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/plan"
     mkdir -p "${PLAN_DIR}"
     ```
   - **Initialize State Machine** - Write `${PLAN_DIR}/state.json`:
     ```json
     {
       "proposal_id": "${PROPOSAL_ID}",
       "current_step": 1,
       "status": "initialized",
       "task_type": "${TASK_TYPE}",
       "artifacts": {
         "proposal": false,
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

2. **Step 2: Parallel Context & Requirements Retrieval**
   - Launch concurrent retrieval agents.
   - **Task for plan-context-retriever:** "Retrieve codebase context relevant to proposal"
   - **Task for requirement-parser:** "Parse and structure requirements from proposal"
   - **At most 2 agents in parallel!**
   - JUST RUN AND WAIT!

   ```
   Task(subagent_type="tpd:investigation:context-analyzer", description="Retrieve plan context", prompt="Execute context retrieval. run_dir=${PLAN_DIR}")

   Skill(skill="tpd:requirement-parser", args="run_dir=${PLAN_DIR}")
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

4. **Step 4: Ambiguity Resolution & PBT Extraction**
   - Call MCP tools directly for ambiguity audit:

     ```
     mcp__codex__codex: "Review proposal ${PROPOSAL_ID} for unspecified decision points. List: [AMBIGUITY] <description> → [REQUIRED CONSTRAINT] <what must be decided>."

     mcp__gemini__gemini: "Identify implicit assumptions in proposal ${PROPOSAL_ID}. List: [ASSUMPTION] <description> → [EXPLICIT CONSTRAINT NEEDED] <concrete specification>."
     ```

   - Write output to `${PLAN_DIR}/ambiguities.md`
   - **⏸️ Hard Stop**: Use AskUserQuestion to confirm each ambiguity item
   - Write conclusions to `${PLAN_DIR}/constraints.md`
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

   - **Exit Plan Mode** (ONLY after all artifacts verified):

     ```
     ExitPlanMode()
     ```

     This triggers Claude Code's native plan approval flow. The user can review the plan in `${PLAN_DIR}/plan.md` and approve or request changes.

   - **Loop Mode (--loop)**: After user approval, automatically chain to `/tpd:dev --proposal-id=${PROPOSAL_ID}`

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
