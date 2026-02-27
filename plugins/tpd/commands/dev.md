---
description: "TPD Dev phase with Team-first orchestration: minimal scope -> analyze -> prototype -> audit -> refactor -> archive"
argument-hint: "[feature-description] [--proposal-id=<proposal_id>] [--task-type=frontend|backend|fullstack]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
  - Skill
  - Task
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskUpdate
  - TaskList
  - SendMessage
---

# /tpd:dev

## Purpose

Implement one minimal verifiable phase from `tasks.md` and produce audited changes under `openspec/changes/<proposal_id>/dev/`.

## Required Constraints

- Always confirm `proposal_id` before development.
- Use plan manifest to resolve `architecture.md`, `constraints.md`, `pbt.md`, `risks.md`, `context.md`.
- Implement only selected scope (1-3 tasks).
- Do not apply external model output directly without refactor and side-effect review.

## Team Roles

- `codex-core`: role-routed implementation and audit (`implementer`, `auditor`).
- `gemini-core`: role-routed implementation and audit (`implementer`, `auditor`).

## Message Protocol

Use this schema in every directed or broadcast message:

```json
{
  "type": "scope_confirmed|analysis_ready|prototype_ready|audit_blocker|fix_request|fix_done|phase_broadcast|heartbeat|error",
  "from": "agent-name|lead",
  "to": "agent-name|lead|all",
  "proposal_id": "<proposal_id>",
  "task_id": "<task_id>",
  "requires_ack": true,
  "payload": {}
}
```

Communication and ACK policy:

- Every `audit_blocker` or `fix_request` must receive ACK.
- Lead retries once if ACK is missing.
- After retry failure, lead records timeout in `team/communication-failures.md` and falls back to manual review path.

## Progress Visibility Rules

- Write step start and completion events to `team/phase-events.jsonl`.
- Print phase marker before and after each major step.
- On failure, log exact error and step id in `team/phase-events.jsonl`.
- During waits longer than 60 seconds, append heartbeat snapshots to `team/heartbeat.jsonl`.
- If hook logs exist, append latest `TeammateIdle` and `TaskCompleted` events to `team/hooks-snapshot.jsonl`.

## Required Artifacts

- `tasks-scope.md`
- `context.md`
- `analysis-codex.md`
- `prototype-codex.diff`
- `prototype-gemini.diff` (if frontend/fullstack)
- `changes.md`
- `audit-codex.md`
- `audit-gemini.md`
- `tasks-progress.md`
- `team/mailbox.jsonl`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`

Optional artifacts:

- `team/hooks-snapshot.jsonl`
- `team/communication-failures.md`

## Steps

## Task Result Handling

Each `Task` call **blocks** until the teammate finishes and returns the result directly in the call response.

**FORBIDDEN — never do this:**
- MUST NOT call `TaskOutput` — this tool does not exist
- MUST NOT manually construct task IDs (e.g., `agent-name@worktree-id`)

**CORRECT — always use direct return:**
- The result comes from the `Task` call itself, no extra step needed

### Step 0: Resolve OpenSpec and Artifacts

1. Resolve proposal id from argument or `openspec view`.
2. Apply proposal:
   ```text
   /openspec:apply ${PROPOSAL_ID}
   ```
3. Resolve plan manifest and required artifacts:

   ```bash
   PLAN_DIR="openspec/changes/${PROPOSAL_ID}/plan"
   DEV_DIR="openspec/changes/${PROPOSAL_ID}/dev"
   PLAN_MANIFEST="${PLAN_DIR}/meta/artifact-manifest.json"
   TEAM_DIR="${DEV_DIR}/team"
   mkdir -p "${TEAM_DIR}"

   PLAN_ARCHITECTURE_MD=$(jq -r '.artifacts[]? | select(.name=="architecture.md") | .path' "${PLAN_MANIFEST}" | head -n1)
   PLAN_CONSTRAINTS_MD=$(jq -r '.artifacts[]? | select(.name=="constraints.md") | .path' "${PLAN_MANIFEST}" | head -n1)
   PLAN_PBT_MD=$(jq -r '.artifacts[]? | select(.name=="pbt.md") | .path' "${PLAN_MANIFEST}" | head -n1)
   PLAN_RISKS_MD=$(jq -r '.artifacts[]? | select(.name=="risks.md") | .path' "${PLAN_MANIFEST}" | head -n1)
   PLAN_CONTEXT_MD=$(jq -r '.artifacts[]? | select(.name=="context.md") | .path' "${PLAN_MANIFEST}" | head -n1)
   ```

4. Initialize tracking files:
   - `${TEAM_DIR}/phase-events.jsonl`
   - `${TEAM_DIR}/heartbeat.jsonl`
   - `${TEAM_DIR}/mailbox.jsonl`
5. Verify all required plan artifacts exist.

### Step 1: Select Minimal Scope

1. Read `openspec/changes/${PROPOSAL_ID}/tasks.md`.
2. Pick 1-3 tasks forming a verifiable closed loop.
3. Write `tasks-scope.md` with constraints and test requirements from `pbt.md`.
4. Ask user to confirm scope.

### Step 2: Create Team and Analysis Tasks

1. Create team:
   ```text
   TeamCreate(team_name="tpd-dev-${PROPOSAL_ID}", description="Implementation and audit team")
   ```
2. Broadcast `scope_confirmed` and log message envelope.
3. Run context retrieval skill:
   ```text
   Skill(skill="tpd:context-retriever", args="run_dir=${DEV_DIR} mode=incremental base_context=${PLAN_CONTEXT_MD}")
   ```
4. Spawn codex-core analysis teammate:
   ```text
   Task(name="codex-core-analyze", subagent_type="tpd:codex-core", team_name="tpd-dev-${PROPOSAL_ID}", prompt="role=implementer mode=analyze run_dir=${DEV_DIR} Read tasks-scope.md and context.md. Produce analysis-codex.md with implementation strategy.")
   ```
   # Task call blocks until the teammate finishes.
   # Result is returned directly — no TaskOutput needed.
5. Verify `analysis-codex.md` exists.

### Step 3: Prototype Round (Parallel)

1. Spawn implementer teammates in a single message (parallel execution):
   ```text
   Task(name="codex-core-proto", subagent_type="tpd:codex-core", team_name="tpd-dev-${PROPOSAL_ID}", prompt="role=implementer mode=prototype run_dir=${DEV_DIR} Read analysis-codex.md and tasks-scope.md. Generate prototype-codex.diff. Notify prototype_ready and send one heartbeat update.")
   Task(name="gemini-core-proto", subagent_type="tpd:gemini-core", team_name="tpd-dev-${PROPOSAL_ID}", prompt="role=implementer mode=prototype run_dir=${DEV_DIR} Read analysis-codex.md and tasks-scope.md. Generate prototype-gemini.diff. Notify prototype_ready and send one heartbeat update.")
   ```
   # All teammates launched in a single message (parallel execution).
   # Each Task call blocks until the teammate finishes.
   # Results are returned directly — no TaskOutput needed.
   Note: Only spawn `gemini-core-proto` when task type is frontend/fullstack.
2. Verify prototype artifacts exist.

### Step 4: Audit Round (Parallel)

1. Spawn auditor teammates in a single message (parallel execution):
   ```text
   Task(name="codex-core-audit", subagent_type="tpd:codex-core", team_name="tpd-dev-${PROPOSAL_ID}", prompt="role=auditor run_dir=${DEV_DIR} Review prototype diffs against constraints and pbt. Produce audit-codex.md. Send audit_blocker or analysis_ready to lead.")
   Task(name="gemini-core-audit", subagent_type="tpd:gemini-core", team_name="tpd-dev-${PROPOSAL_ID}", prompt="role=auditor run_dir=${DEV_DIR} Review prototype diffs against constraints and pbt. Produce audit-gemini.md. Send audit_blocker or analysis_ready to lead.")
   ```
   # All teammates launched in a single message (parallel execution).
   # Each Task call blocks until the teammate finishes.
   # Results are returned directly — no TaskOutput needed.
2. If blocker exists, send `fix_request` to implementers and iterate prototype+audit loop.
3. Maximum iterations: 2. After limit, record fallback and move to manual review path.

### Step 5: Refactor and Side-effect Review

1. Run:
   ```text
   Skill(skill="tpd:code-implementer", args="run_dir=${DEV_DIR} constraints_ref=${PLAN_CONSTRAINTS_MD} pbt_ref=${PLAN_PBT_MD}")
   ```
2. Verify `changes.md` exists.
3. Confirm constraints compliance and side-effect boundaries.

### Step 6: Progress and Archival

1. Update completed items in `tasks.md`.
2. Write `tasks-progress.md`.
3. Ask user whether to continue next minimal phase.
4. When all tasks are done, run:
   ```text
   /openspec:archive
   ```

### Step 7: Team Shutdown

1. Broadcast completion summary.
2. Send shutdown messages.
3. Delete team.

## Fallback Policy

- If Team API is unavailable, use standalone `Task` calls with same artifact contract.
- If one model fails, continue with remaining model and record gap.
- If communication timeout persists, stop iterative loop and require user decision.
- If hook logs are unavailable, continue without hook snapshot output.

## Verification

- Required artifacts exist for the current minimal phase.
- Communication failures are either resolved or documented.
- `team/phase-events.jsonl` and `team/heartbeat.jsonl` contain entries.
- `tasks.md` progress reflects completed work only.
