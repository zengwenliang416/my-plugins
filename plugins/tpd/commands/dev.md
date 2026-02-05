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
- ✅ Only implement minimal verifiable phase in tasks.md (forbidden to complete all at once)
- ✅ External models only produce Unified Diff Patch, direct application forbidden
- ✅ Must do Side-effect Review before applying
- ✅ Update tasks.md checkbox status after completion
- ✅ Execute `/openspec:archive` after all tasks complete

**Forbidden Actions:**

- ❌ Starting implementation without confirming proposal_id
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

1. **Step 1: Initialization & Minimal Scope Selection**
   - Parse arguments:
     - TASK_TYPE: fullstack (default) | frontend | backend
     - FEATURE: Optional; if omitted, extract from plan/proposal
     - PROPOSAL_ID: Confirmed from Step 0
   - Generate run directory:
     ```bash
     DEV_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/dev"
     mkdir -p "${DEV_DIR}"
     ```
   - Locate and copy task file:
     ```bash
     TASKS_FILE="openspec/changes/${PROPOSAL_ID}/tasks.md"
     cp "${TASKS_FILE}" "${DEV_DIR}/tasks.md"
     ```
   - Select **minimal verifiable phase** (1~3 tasks, able to form closed-loop verification)
   - Write scope to `${DEV_DIR}/tasks-scope.md`
   - **⏸️ Hard Stop**: Use AskUserQuestion to display task scope, continue after confirmation

2. **Step 2: Parallel Context & Analysis**
   - Launch concurrent agents for context retrieval and analysis.
   - **Task for context-retriever:** "Retrieve implementation context for selected tasks"
   - **Task for codex-implementer (analyze mode):** "Analyze implementation approach"
   - **At most 2 agents in parallel!**
   - JUST RUN AND WAIT!

   ```
   Skill(skill="tpd:context-retriever", args="run_dir=${DEV_DIR}")

   Task(subagent_type="tpd:execution:codex-implementer", description="Codex analysis", prompt="Execute implementation analysis. run_dir=${DEV_DIR} mode=analyze")
   ```

   - **Verify**: `${DEV_DIR}/context.md` and `${DEV_DIR}/analysis-codex.md` exist
   - **⏸️ Hard Stop**: Display analysis summary, continue after confirming approach

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

4. **Step 4: Refactor & Side-effect Review**
   - Execute refactor implementation:
     ```
     Skill(skill="tpd:code-implementer", args="run_dir=${DEV_DIR}")
     ```
   - **Verify**: `${DEV_DIR}/changes.md` exists
   - **Mandatory Side-effect Review**: Check if all changes are strictly limited to `tasks-scope.md`:
     - Were unauthorized files added/modified?
     - Were unapproved dependencies introduced?
     - Were existing interface contracts broken?
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
