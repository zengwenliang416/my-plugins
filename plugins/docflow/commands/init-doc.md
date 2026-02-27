---
description: "Initialize llmdoc using Agent Team orchestration (scout + recorder)"
argument-hint: ""
allowed-tools:
  - Task
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskList
  - TaskUpdate
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

## Task Result Handling

Each `Task` call **blocks** until the teammate finishes and returns the result directly in the call response.

**FORBIDDEN — never do this:**
- MUST NOT call `TaskOutput` — this tool does not exist
- MUST NOT manually construct task IDs (e.g., `agent-name@worktree-id`)

**CORRECT — always use direct return:**
- The result comes from the `Task` call itself, no extra step needed

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
   - MUST spawn teammates using `Task` tool with `team_name` parameter.
   - MUST launch parallel teammates in a single message for concurrent execution.
   - MUST NOT construct task IDs manually — use message-based coordination.
   - Require each scout to send `SCOUT_REPORT_READY` to the lead when report is written.

   **Example** (adapt name/prompt to actual scopes):

   ```
   Task(
     name: "scout-auth",
     subagent_type: "docflow:scout",
     team_name: "docflow-init-team",
     prompt: "You are scout-auth on team docflow-init-team.

   Your task: Investigate the auth scope of this project.
   scope: auth

   When done, send a SCOUT_REPORT_READY message to lead with your findings."
   )

   Task(
     name: "scout-api",
     subagent_type: "docflow:scout",
     team_name: "docflow-init-team",
     prompt: "You are scout-api on team docflow-init-team.

   Your task: Investigate the api scope of this project.
   scope: api

   When done, send a SCOUT_REPORT_READY message to lead with your findings."
   )

   # All scouts launch in parallel (single message).
   # Each Task call blocks until the teammate finishes.
   # Results are returned directly — no TaskOutput needed.
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
   - MUST spawn recorders using `Task` tool with `team_name` parameter.
   - MUST launch all 3 recorders in a single message for concurrent execution.
   - All recorder tasks must run in `content-only` mode.
   - Require each recorder to send `DOC_DRAFT_READY`.

   ```
   Task(
     name: "recorder-overview",
     subagent_type: "docflow:recorder",
     team_name: "docflow-init-team",
     prompt: "You are recorder-overview on team docflow-init-team.

   Your task: Generate overview/project-overview.md in content-only mode.

   When done, send a DOC_DRAFT_READY message to lead."
   )

   Task(
     name: "recorder-coding",
     subagent_type: "docflow:recorder",
     team_name: "docflow-init-team",
     prompt: "You are recorder-coding on team docflow-init-team.

   Your task: Generate reference/coding-conventions.md in content-only mode.

   When done, send a DOC_DRAFT_READY message to lead."
   )

   Task(
     name: "recorder-git",
     subagent_type: "docflow:recorder",
     team_name: "docflow-init-team",
     prompt: "You are recorder-git on team docflow-init-team.

   Your task: Generate reference/git-conventions.md in content-only mode.

   When done, send a DOC_DRAFT_READY message to lead."
   )

   # All 3 recorders launch in parallel (single message).
   # Each Task call blocks until the teammate finishes.
   # Results are returned directly — no TaskOutput needed.
   ```

6. **Step 6: Concept docs (parallel recorder)**
   - For each selected concept, spawn one recorder teammate using `Task` tool with `team_name` parameter.
   - MUST launch all concept recorders in a single message for concurrent execution.
   - Generate a compact document set:
     - Optional 1 `overview` file
     - Required 1-2 core `architecture` files
     - Required 1-2 practical `guides` files
     - Optional 1-2 concise `reference` files
   - Keep `content-only` mode.
   - If overlap detected, send `DOC_CONFLICT_RESOLVE` and wait for `DOC_CONFLICT_FIXED`.

   **Example** (adapt name/prompt to actual concepts):

   ```
   Task(
     name: "recorder-auth",
     subagent_type: "docflow:recorder",
     team_name: "docflow-init-team",
     prompt: "You are recorder-auth on team docflow-init-team.

   Your task: Generate architecture and guide docs for the Authentication concept in content-only mode.

   When done, send a DOC_DRAFT_READY message to lead."
   )

   # Launch one Task per concept in a single message (parallel execution).
   # Each Task call blocks until the teammate finishes.
   # Results are returned directly — no TaskOutput needed.
   ```

7. **Step 7: Cleanup**
   - Delete temporary scout reports under `llmdoc/agent/`.

8. **Step 8: Final indexing**
   - Spawn one final recorder using `Task` tool in `full` mode to regenerate `llmdoc/index.md`.

   ```
   Task(
     name: "recorder-index",
     subagent_type: "docflow:recorder",
     team_name: "docflow-init-team",
     prompt: "You are recorder-index on team docflow-init-team.

   Your task: Regenerate llmdoc/index.md in full mode based on all generated docs.

   When done, send a DOC_DRAFT_READY message to lead."
   )
   ```

9. **Step 9: Shutdown Team**
   - Tear down team resources:
     ```
     TeamDelete("docflow-init-team")
     ```
