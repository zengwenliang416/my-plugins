---
description: "Initialize llmdoc using Agent Team orchestration (scout + recorder)"
argument-hint: ""
allowed-tools:
  - Task
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskOutput
  - TaskList
  - TaskGet
  - SendMessage
  - AskUserQuestion
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
---

# /init-doc

Initialize `llmdoc/` for a new project with a documentation-first workflow.

## Agent Type Restrictions

You MUST ONLY invoke these agent types in this command.

| Agent Name | subagent_type    | Purpose                         |
| ---------- | ---------------- | ------------------------------- |
| scout      | docflow:scout    | Investigate codebase and report |
| recorder   | docflow:recorder | Generate and index llmdoc docs  |

## Team Communication Protocol

All collaboration MUST use structured `SendMessage` payloads.

1. `SCOUT_REPORT_READY` (scout -> lead)
   ```json
   {
     "type": "SCOUT_REPORT_READY",
     "scope": "auth|api|data|infra",
     "report_path": "llmdoc/agent/scout-xxx.md",
     "candidate_concepts": ["Authentication", "Authorization"],
     "risks": ["missing test docs"]
   }
   ```
2. `SCOUT_CROSSCHECK_REQUEST` (lead -> scout)
   - Ask one scout to review another scout's report for conflicts or missing evidence.
3. `SCOUT_CROSSCHECK_RESULT` (scout -> lead)
   ```json
   {
     "type": "SCOUT_CROSSCHECK_RESULT",
     "scope": "auth",
     "review_target": "api",
     "status": "confirm|challenge",
     "notes": ["missing middleware mapping"]
   }
   ```
4. `DOC_PLAN_READY` (lead -> recorder)
   - Shared concept scope, naming constraints, and anti-duplication rules.
5. `DOC_DRAFT_READY` (recorder -> lead)
   ```json
   {
     "type": "DOC_DRAFT_READY",
     "mode": "content-only|full",
     "files": ["llmdoc/overview/project-overview.md"],
     "open_questions": []
   }
   ```
6. `DOC_CONFLICT_RESOLVE` / `DOC_CONFLICT_FIXED`
   - Used when two recorder outputs overlap or conflict.

## Actions

0. **Step 0: Baseline scan**
   - Read project structure and key files (`README`, `package.json`, `go.mod`, `pyproject.toml`, etc.).
   - Exclude dependency/build folders (`node_modules`, `venv`, `target`, `build`).

1. **Step 1: Create Agent Team**
   - Create one team for this run:
     ```
     TeamCreate("docflow-init-team")
     ```

2. **Step 2: Global investigation (parallel scout)**
   - Split project investigation into up to 4 scopes.
   - Launch one `TaskCreate` per scope using `subagent_type: "docflow:scout"`.
   - Require each scout to send `SCOUT_REPORT_READY` to the lead when report is written.
   - `scout` must run in foreground mode (no background polling).
   - Wait for all scout tasks:
     ```
     TaskOutput(task_id, block=true)  # no timeout
     ```

3. **Step 3: Scout cross-check round (agent communication)**
   - Pair scouts for peer review using `SCOUT_CROSSCHECK_REQUEST`.
   - Each scout reads one peer report and sends `SCOUT_CROSSCHECK_RESULT`.
   - Resolve conflicts before concept selection.

4. **Step 4: Candidate concept selection**
   - Read all scout reports.
   - Read all scout cross-check results.
   - Synthesize candidate core concepts (for example: Authentication, Billing, API Gateway).
   - Use `AskUserQuestion` to let user choose which concepts to document first.

5. **Step 5: Foundational docs (parallel recorder)**
   - Send one shared `DOC_PLAN_READY` message to all recorder tasks first.
   - Create 3 recorder tasks via `TaskCreate` using `subagent_type: "docflow:recorder"`:
     - Recorder A: `overview/project-overview.md`
     - Recorder B: `reference/coding-conventions.md`
     - Recorder C: `reference/git-conventions.md`
   - All recorder tasks must run in `content-only` mode.
   - Require each recorder to send `DOC_DRAFT_READY`.
   - Wait for all recorder tasks to finish before continuing.

6. **Step 6: Concept docs (parallel recorder)**
   - For each selected concept, create one recorder task with scoped prompt.
   - Generate a compact document set:
     - Optional 1 `overview` file
     - Required 1-2 core `architecture` files
     - Required 1-2 practical `guides` files
     - Optional 1-2 concise `reference` files
   - Keep `content-only` mode.
   - If overlap detected, send `DOC_CONFLICT_RESOLVE` and wait for `DOC_CONFLICT_FIXED`.
   - Wait for all concept recorder tasks (`TaskOutput(..., block=true)`).

7. **Step 7: Cleanup**
   - Delete temporary scout reports under `llmdoc/agent/`.

8. **Step 8: Final indexing**
   - Invoke one final recorder task in `full` mode to regenerate `llmdoc/index.md`.

9. **Step 9: Shutdown Team**
   - Tear down team resources:
     ```
     TeamDelete("docflow-init-team")
     ```
