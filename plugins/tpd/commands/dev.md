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

## 🚨🚨🚨 Mandatory Execution Rules 🚨🚨🚨

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

## Phase 0: OpenSpec Status Check

1. Execute (OpenSpec Dashboard detection consistent with official workflow):

```bash
openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
```

2. proposal_id parsing priority:
   - `--proposal-id` argument
   - If `openspec view` has only 1 Active Change → auto-select
   - Otherwise user selects from `openspec view` output

3. Not initialized OpenSpec → prompt to execute `/tpd:init` before continuing

---

## Phase 1: Initialization

1. Parse arguments:
   - TASK_TYPE: fullstack (default) | frontend | backend
   - FEATURE: Optional; if omitted, extract from plan/proposal
   - PROPOSAL_ID: Must be confirmed (--proposal-id or select from OpenSpec Active Change)

2. Generate run directory path (fixed path, under OpenSpec):
   - DEV_DIR: `openspec/changes/${PROPOSAL_ID}/artifacts/dev`

```bash
mkdir -p "${DEV_DIR}"
```

3. If FEATURE not provided: generate input summary from proposal.md / tasks.md

---

## Phase 2: Apply OpenSpec

Execute:

```
/openspec:apply ${PROPOSAL_ID}
```

And locate task file:

```
TASKS_FILE="openspec/changes/${PROPOSAL_ID}/tasks.md"
```

Copy tasks.md to `${DEV_DIR}/tasks.md` as this phase's work list (**source file remains in openspec/**).

---

## Phase 3: Minimal Verifiable Phase Selection (Required)

1. Read `${DEV_DIR}/tasks.md`
2. Select **minimal verifiable phase** (1~3 tasks, able to form closed-loop verification)
3. Write to `${DEV_DIR}/tasks-scope.md`

**⏸️ Hard Stop**: AskUserQuestion to display this task scope, continue after confirmation

---

## Phase 4: Context Retrieval

**If current run directory already provides context.md, can skip; otherwise must execute:**

```
Skill(skill="tpd:context-retriever", args="run_dir=${DEV_DIR}")
```

**Verify**: Confirm `${DEV_DIR}/context.md` is generated

---

## Phase 5: Task Analysis (Multi-Model Parallel)

Call in parallel based on task_type:

```
Skill(skill="tpd:multi-model-analyzer", args="run_dir=${DEV_DIR} model=codex")
Skill(skill="tpd:multi-model-analyzer", args="run_dir=${DEV_DIR} model=gemini")
```

**Verify**: `analysis-codex.md` / `analysis-gemini.md`

**⏸️ Hard Stop**: Display analysis summary, continue after confirming approach

---

## Phase 6: Prototype Generation (Multi-Model Parallel)

```
Skill(skill="tpd:prototype-generator", args="run_dir=${DEV_DIR} model=codex focus=backend,api,logic")
Skill(skill="tpd:prototype-generator", args="run_dir=${DEV_DIR} model=gemini focus=frontend,ui,styles")
```

**Verify**: `prototype-codex.diff` / `prototype-gemini.diff`

---

## Phase 7: Refactor Implementation (Multi-Model Parallel)

```
Skill(skill="tpd:code-implementer", args="run_dir=${DEV_DIR} model=codex focus=backend,api,logic")
Skill(skill="tpd:code-implementer", args="run_dir=${DEV_DIR} model=gemini focus=frontend,ui,styles")
```

**Verify**: `changes-codex.md` / `changes-gemini.md` / `changes.md`

---

## Phase 8: Side-effect Review (Required)

Check if all changes are strictly limited to `tasks-scope.md`, forbidden to affect unrelated modules:

- Were unauthorized files added/modified?
- Were unapproved dependencies introduced?
- Were existing interface contracts broken?

If issues found, must return to Phase 7 for correction.

---

## Phase 9: Multi-Model Audit Verification

```
Skill(skill="tpd:audit-reviewer", args="run_dir=${DEV_DIR} model=codex focus=security,performance")
Skill(skill="tpd:audit-reviewer", args="run_dir=${DEV_DIR} model=gemini focus=ux,accessibility")
```

**Verify**: `audit-codex.md` / `audit-gemini.md`

**⏸️ Hard Stop**: Must fix if Critical issues exist

---

## Phase 10: Task Checkbox and Phase Wrap-up

1. Mark completed tasks in `openspec/changes/${PROPOSAL_ID}/tasks.md` as `- [x]`
2. Copy synced tasks.md back to `${DEV_DIR}/tasks.md`

**⏸️ Hard Stop**: Ask whether to proceed to next phase (if continuing, repeat Phase 3~10)

---

## Phase 11: OpenSpec Archive

When all tasks in tasks.md are complete:

```
/openspec:archive
```

---

## Phase 12: Delivery

```
🎉 Development Phase Complete!

📋 Proposal: ${PROPOSAL_ID}
🔀 Type: ${TASK_TYPE}
📁 Artifacts:
  ${DEV_DIR}/
  ├── input.md
  ├── context.md
  ├── tasks.md
  ├── tasks-scope.md
  ├── analysis-codex.md
  ├── analysis-gemini.md
  ├── prototype-codex.diff
  ├── prototype-gemini.diff
  ├── changes-codex.md
  ├── changes-gemini.md
  ├── changes.md
  ├── audit-codex.md
  └── audit-gemini.md
```
