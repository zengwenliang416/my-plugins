---
description: "OpenSpec Development Workflow: OpenSpec selection → Minimal phase → Prototype generation → Refactor implementation → Audit verification → Task archival"
argument-hint: "[feature-description] [--proposal-id=<proposal_id>] [--task-type=frontend|backend|fullstack]"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Write
  - Task
  - Bash
---

# /tpd:dev - OpenSpec Development Workflow Command

## Overview

The dev phase strictly aligns with OpenSpec Implementation: **only implement the "minimal verifiable phase" in tasks.md**, and enforce multi-model prototype → refactor → audit flow. External model output is for reference only, direct commit is forbidden.

**Supports no-argument invocation**: When executing `/tpd:dev` directly, it will automatically read OpenSpec Active Change and let user confirm the proposal.

---

## Core Rules

- ✅ Must first `openspec view` and confirm `proposal_id`
- ✅ Must first `/openspec:apply <proposal_id>`
- ✅ **Must load plan phase artifacts** (`architecture.md`, `constraints.md`, `pbt.md`, `risks.md`)
- ✅ **Must load thinking phase artifacts if exists** (`synthesis.md`, `clarifications.md`)
- ✅ Only implement minimal verifiable phase in tasks.md (forbidden to complete all at once)
- ✅ **Must verify implementation against `constraints.md`** before applying
- ✅ **Must reference `pbt.md` for test requirements** in each task
- ✅ External models only produce Unified Diff Patch, direct application forbidden
- ✅ Must do Side-effect Review before applying
- ✅ Update tasks.md checkbox status after completion
- ✅ Execute `/openspec:archive` after all tasks complete

**Forbidden Actions:**

- ❌ Starting implementation without confirming proposal_id
- ❌ **Implementing without reading `architecture.md` and `constraints.md`**
- ❌ **Ignoring `pbt.md` test requirements**
- ❌ Directly applying external model diff
- ❌ Skipping Side-effect Review
- ❌ Completing all tasks at once

---

## Actions

0. **Step 0: OpenSpec Status Check**
   - Execute OpenSpec Dashboard detection:
     ```bash
     openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
     ```
   - Parse `proposal_id` priority:
     1. `--proposal-id` argument
     2. If `openspec view` has only 1 Active Change → auto-select
     3. Otherwise user selects from `openspec view` output
   - If OpenSpec not initialized → prompt to execute `/tpd:init` first
   - Apply proposal:
     ```
     /openspec:apply ${PROPOSAL_ID}
     ```

1. **Step 1: Initialization & Previous Phase Integration**
   - Parse arguments:
     - TASK_TYPE: fullstack (default) | frontend | backend
     - FEATURE: Optional; if omitted, extract from plan/proposal
     - PROPOSAL_ID: Confirmed from Step 0
   - Generate run directory:

     ```bash
     DEV_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/dev"
     PLAN_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/plan"
     THINKING_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/thinking"
     mkdir -p "${DEV_DIR}"
     ```

   - **🔗 Plan Phase Integration** (MANDATORY):

     ```bash
     # Verify plan phase exists
     if [ ! -f "${PLAN_DIR}/plan.md" ]; then
       echo "❌ ERROR: Plan phase not found. Execute /tpd:plan first."
       exit 1
     fi

     # Copy key artifacts for reference
     cp "${PLAN_DIR}/architecture.md" "${DEV_DIR}/plan-architecture.md"
     cp "${PLAN_DIR}/constraints.md" "${DEV_DIR}/plan-constraints.md"
     cp "${PLAN_DIR}/pbt.md" "${DEV_DIR}/plan-pbt.md"
     cp "${PLAN_DIR}/risks.md" "${DEV_DIR}/plan-risks.md"
     cp "${PLAN_DIR}/context.md" "${DEV_DIR}/plan-context.md"
     echo "✅ Plan phase artifacts loaded"
     ```

   - **🔗 Thinking Phase Integration** (if exists):

     ```bash
     if [ -f "${THINKING_DIR}/handoff.json" ]; then
       cp "${THINKING_DIR}/synthesis.md" "${DEV_DIR}/thinking-synthesis.md" 2>/dev/null || true
       cp "${THINKING_DIR}/clarifications.md" "${DEV_DIR}/thinking-clarifications.md" 2>/dev/null || true
       THINKING_COMPLETED=true
       echo "✅ Thinking phase artifacts loaded"
     else
       THINKING_COMPLETED=false
     fi
     ```

   - Locate and copy task file:
     ```bash
     TASKS_FILE="openspec/changes/${PROPOSAL_ID}/tasks.md"
     cp "${TASKS_FILE}" "${DEV_DIR}/tasks.md"
     ```
   - Select **minimal verifiable phase** (1~3 tasks, able to form closed-loop verification)
   - **Reference `plan-pbt.md`** to extract test requirements for selected tasks
   - Write scope to `${DEV_DIR}/tasks-scope.md` including:
     - Selected tasks
     - Relevant constraints from `plan-constraints.md`
     - Test requirements from `plan-pbt.md`
     - Known risks from `plan-risks.md`
   - **⏸️ Hard Stop**: Use AskUserQuestion to display task scope with constraints and test requirements

2. **Step 2: Context Reuse & Implementation Analysis**
   - **🔗 Reuse plan context** instead of full retrieval:

     ```bash
     # plan-context.md already copied in Step 1
     # Only do incremental retrieval for task-specific details
     if [ -f "${DEV_DIR}/plan-context.md" ]; then
       echo "📥 Reusing context from plan phase"
       CONTEXT_MODE="incremental"
     else
       CONTEXT_MODE="full"
     fi
     ```

   - Launch concurrent agents for **incremental** context and analysis.
   - **Task for context-retriever:** "Retrieve ONLY task-specific context not in plan-context.md"
   - **Task for codex-implementer (analyze mode):** "Analyze implementation referencing plan-architecture.md and plan-constraints.md"
   - **At most 2 agents in parallel!**
   - JUST RUN AND WAIT!

   ```
   Skill(skill="tpd:context-retriever", args="run_dir=${DEV_DIR} mode=${CONTEXT_MODE} base_context=plan-context.md")

   Task(subagent_type="tpd:execution:codex-implementer", description="Codex analysis", prompt="Execute implementation analysis. run_dir=${DEV_DIR} mode=analyze architecture_ref=plan-architecture.md constraints_ref=plan-constraints.md")
   ```

   - **Verify**: `${DEV_DIR}/context.md` and `${DEV_DIR}/analysis-codex.md` exist
   - **⏸️ Hard Stop**: Display analysis summary with constraint compliance check

3. **Step 3: Parallel Prototype Generation**
   - Launch concurrent prototype generation agents.
   - **Task for codex-implementer (prototype mode):** "Generate backend prototype as unified diff"
   - **Task for gemini-implementer (prototype mode):** "Generate frontend prototype as unified diff"
   - **At most 2 prototype agents!**
   - JUST RUN AND WAIT!

   ```
   Task(subagent_type="tpd:execution:codex-implementer", description="Codex prototype", prompt="Execute prototype generation. run_dir=${DEV_DIR} mode=prototype")

   Task(subagent_type="tpd:execution:gemini-implementer", description="Gemini prototype", prompt="Execute prototype generation. run_dir=${DEV_DIR} mode=prototype")
   ```

   - **Verify**: `${DEV_DIR}/prototype-codex.diff` and/or `${DEV_DIR}/prototype-gemini.diff` exist

4. **Step 4: Refactor & Constraint-Aware Side-effect Review**
   - Execute refactor implementation with constraint awareness:
     ```
     Skill(skill="tpd:code-implementer", args="run_dir=${DEV_DIR} constraints_ref=plan-constraints.md pbt_ref=plan-pbt.md")
     ```
   - **Verify**: `${DEV_DIR}/changes.md` exists

   - **🔗 Constraint Compliance Check** (reference `plan-constraints.md`):
     - Does implementation violate any hard constraints?
     - Are soft constraints properly handled or documented as exceptions?
     - Are clarified decisions from `thinking-clarifications.md` respected?

   - **Mandatory Side-effect Review**: Check if all changes are strictly limited to `tasks-scope.md`:
     - Were unauthorized files added/modified?
     - Were unapproved dependencies introduced?
     - Were existing interface contracts broken?

   - **🔗 Test Requirement Check** (reference `plan-pbt.md`):
     - Are required tests included for this task?
     - Do tests cover the properties defined in PBT?

   - If issues found → return to Step 3 for correction

5. **Step 5: Parallel Multi-Model Audit**
   - Launch concurrent audit agents.
   - **Task for codex-auditor:** "Security and performance audit"
   - **Task for gemini-auditor:** "UX and accessibility audit"
   - **At most 2 audit agents!**
   - JUST RUN AND WAIT!

   ```
   Task(subagent_type="tpd:execution:codex-auditor", description="Codex audit", prompt="Execute code audit. run_dir=${DEV_DIR} focus=security,performance")

   Task(subagent_type="tpd:execution:gemini-auditor", description="Gemini audit", prompt="Execute code audit. run_dir=${DEV_DIR} focus=ux,accessibility")
   ```

   - **Verify**: `${DEV_DIR}/audit-codex.md` and `${DEV_DIR}/audit-gemini.md` exist
   - **⏸️ Hard Stop**: Must fix if Critical issues exist

6. **Step 6: Task Completion & Iteration**
   - Mark completed tasks in `openspec/changes/${PROPOSAL_ID}/tasks.md` as `- [x]`
   - Copy synced tasks.md back to `${DEV_DIR}/tasks.md`
   - **⏸️ Hard Stop**: Use AskUserQuestion to ask whether to proceed to next phase
   - If continuing → repeat Step 1~6 with next task scope

7. **Step 7: Finalization**
   - When all tasks in tasks.md are complete:
     ```
     /openspec:archive
     ```
   - Output completion summary:

     ```
     🎉 Development Complete!

     📋 Proposal: ${PROPOSAL_ID}
     🔀 Type: ${TASK_TYPE}

     📁 Artifacts:
       ${DEV_DIR}/
       ├── input.md
       ├── context.md
       ├── tasks.md
       ├── tasks-scope.md
       ├── analysis-codex.md
       ├── prototype-codex.diff
       ├── prototype-gemini.diff
       ├── changes.md
       ├── audit-codex.md
       └── audit-gemini.md

     ✅ All tasks completed and archived!
     ```

---

## Previous Phase Integration

Dev phase **MUST** load artifacts from plan phase (and thinking phase if exists):

### Plan Phase Artifacts (MANDATORY)

| Plan Artifact     | Dev Usage                                | Benefit                          |
| ----------------- | ---------------------------------------- | -------------------------------- |
| `architecture.md` | Step 2: Guide implementation approach    | Consistent architecture          |
| `constraints.md`  | Step 4: Verify constraint compliance     | **Prevent constraint violation** |
| `pbt.md`          | Step 1, 4: Test requirements per task    | **Ensure test coverage**         |
| `risks.md`        | Step 1: Highlight known risks            | Risk-aware implementation        |
| `context.md`      | Step 2: Base context (skip re-retrieval) | Faster context loading           |

### Thinking Phase Artifacts (Optional)

| Thinking Artifact   | Dev Usage                              | Benefit                       |
| ------------------- | -------------------------------------- | ----------------------------- |
| `synthesis.md`      | Step 4: Reference resolved constraints | Honor previous decisions      |
| `clarifications.md` | Step 4: User's explicit decisions      | **Avoid re-asking questions** |

### Data Flow

```
THINKING_DIR/                     PLAN_DIR/                        DEV_DIR/
├── synthesis.md      ──────►                          ──────►   ├── thinking-synthesis.md
├── clarifications.md ──────►                          ──────►   ├── thinking-clarifications.md
                                  ├── architecture.md  ──────►   ├── plan-architecture.md
                                  ├── constraints.md   ──────►   ├── plan-constraints.md
                                  ├── pbt.md           ──────►   ├── plan-pbt.md
                                  ├── risks.md         ──────►   ├── plan-risks.md
                                  ├── context.md       ──────►   ├── plan-context.md
                                  └── tasks.md         ──────►   └── tasks.md
```

---

## Parallel Constraints Summary

| Step   | Max Agents | Agent Types                                                           |
| ------ | ---------- | --------------------------------------------------------------------- |
| Step 2 | **2**      | `tpd:context-retriever`, `tpd:execution:codex-implementer`            |
| Step 3 | **2**      | `tpd:execution:codex-implementer`, `tpd:execution:gemini-implementer` |
| Step 5 | **2**      | `tpd:execution:codex-auditor`, `tpd:execution:gemini-auditor`         |

---

## Error Handling

### Audit Critical Issues

```
⚠️ Critical Issues Found

Issues:
${CRITICAL_ISSUES}

Actions Required:
1. Fix all critical issues before proceeding
2. Re-run audit after fixes
3. Cannot proceed to next phase until resolved
```

### Side-effect Violation

```
⚠️ Side-effect Review Failed

Violations:
- ${VIOLATION_1}
- ${VIOLATION_2}

Actions Required:
1. Revert unauthorized changes
2. Return to Step 3 for correction
3. Re-run side-effect review
```

### Model Call Failure

```
⚠️ ${MODEL} Implementation Failed

Error: ${ERROR_MESSAGE}

Handling:
- Continue with available model results
- Mark missing perspective in changes.md
```

---

## Agent Type Restrictions

This command ONLY uses the following agent types via the `Task` tool:

| Agent Type                         | Usage                                                      |
| ---------------------------------- | ---------------------------------------------------------- |
| `tpd:execution:codex-implementer`  | Step 2-3: Implementation analysis and prototype generation |
| `tpd:execution:gemini-implementer` | Step 3: Frontend prototype generation                      |
| `tpd:execution:codex-auditor`      | Step 5: Security and performance audit                     |
| `tpd:execution:gemini-auditor`     | Step 5: UX and accessibility audit                         |

Any other `subagent_type` values are **forbidden** in this command.

---

## Agent Teams Mode (Experimental)

When `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set, Steps 3 and 5 are replaced with an iterative team cycle managed by a 7-state state machine.

### Activation Check

```bash
if [ "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS}" = "1" ]; then
  TEAM_MODE=true
else
  TEAM_MODE=false
fi
```

### State Machine (7 States)

```
DETECT ──→ INIT_TEAM ──→ PROTOTYPE ──→ AUDIT ──→ COMPLETE
  │            │                         │
  │ (unset)    │ (init fail)             │ (fail, iter < 2)
  ▼            ▼                         ▼
FALLBACK   FALLBACK                   ITERATE ──→ PROTOTYPE
                                         │
                                         │ (iter >= 2)
                                         ▼
                                      FALLBACK
```

| State       | Description                                         | Next States                 |
| ----------- | --------------------------------------------------- | --------------------------- |
| `DETECT`    | Check `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` env    | INIT_TEAM, FALLBACK         |
| `INIT_TEAM` | Initialize team with 4 agents                       | PROTOTYPE, FALLBACK         |
| `PROTOTYPE` | codex-implementer + gemini-implementer (parallel)   | AUDIT                       |
| `AUDIT`     | codex-auditor + gemini-auditor (parallel)           | COMPLETE, ITERATE, FALLBACK |
| `ITERATE`   | Increment counter, feed audit findings to prototype | PROTOTYPE, FALLBACK         |
| `COMPLETE`  | All audits passed, proceed to Step 4 (refactor)     | _(terminal)_                |
| `FALLBACK`  | Revert to standard mode Steps 3+5                   | _(terminal)_                |

### team-state.json Schema

Stored at `${DEV_DIR}/team-state.json`, tracks team cycle progress:

```json
{
  "mode": "team",
  "state": "PROTOTYPE",
  "iteration": 1,
  "max_iterations": 2,
  "agents": [
    "codex-implementer",
    "gemini-implementer",
    "codex-auditor",
    "gemini-auditor"
  ],
  "history": [
    { "state": "DETECT", "timestamp": "...", "result": "activated" },
    { "state": "INIT_TEAM", "timestamp": "...", "result": "success" }
  ],
  "fallback_reason": null
}
```

### Fallback Triggers

The system falls back to standard mode (Steps 3+5) when any of these occur:

1. **Env var unset**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` not set or not `"1"`
2. **Iteration limit exceeded**: iteration count > 2 (HC-10: hardcoded at max_iterations=2)
3. **Agent init failure**: any agent in the team fails to initialize
4. **API error**: unrecoverable error during prototype or audit phase

### UX Messaging

```
🔄 [DETECT]    Agent Teams mode detected (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
🚀 [INIT_TEAM] Initializing team: codex-implementer, gemini-implementer, codex-auditor, gemini-auditor
🔨 [PROTOTYPE] Iteration 1/2: generating prototypes...
🔍 [AUDIT]     Iteration 1/2: running audits...
✅ [COMPLETE]   All audits passed, proceeding to refactor (Step 4)
⚠️ [ITERATE]   Audit issues found, re-prototyping (iteration 2/2)...
🔙 [FALLBACK]  Reverting to standard mode: ${FALLBACK_REASON}
```

### Constraints

- Codex and Gemini operate on independent tracks — cross-model mailbox is **forbidden** (HC-6)
- Maximum 2 iterations before falling back to manual review (HC-10)
- Each model's output is isolated; synthesis happens only in the refactor step (Step 4)
- Agent Teams API syntax is TBD pending official documentation (SC-8)
- TeammateIdle and TaskCompleted hooks fire during team mode for orchestration awareness

### Default Mode (no env var)

When `TEAM_MODE=false` (default): Steps 3 and 5 execute as documented above with standard `Task()` subagent calls. **Zero behavior change** from baseline.
