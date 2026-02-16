---
description: "TPD Plan phase with Team-first orchestration: context -> architecture -> ambiguity resolution -> decomposition -> risk -> final plan"
argument-hint: "[proposal_id] [--task-type=frontend|backend|fullstack] [--loop]"
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
  - TaskGet
  - TaskOutput
  - SendMessage
  - Glob
  - Grep
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__codex__codex
  - mcp__gemini__gemini
---

# /tpd:plan

## Purpose
Convert an OpenSpec proposal into a zero-decision executable plan under `openspec/changes/<proposal_id>/plan/`.

## Required Constraints
- Do not implement code in this phase.
- Resolve all referenced artifacts through manifests when available.
- Keep outputs compatible with dev phase artifact contracts.

## Team Roles
- `context-explorer`: targeted context retrieval (`mode=plan-context`).
- `codex-core`: Codex role-routed planning (`role=architect`).
- `gemini-core`: Gemini role-routed planning (`role=architect`).

## Message Protocol
All team messages follow:

```json
{
  "type": "context_ready|arch_ready|arch_question|arch_answer|risk_alert|phase_broadcast|heartbeat|error",
  "from": "agent-name|lead",
  "to": "agent-name|lead|all",
  "proposal_id": "<proposal_id>",
  "task_id": "<task_id>",
  "requires_ack": true,
  "payload": {}
}
```

Communication rules:
- Architect agents must exchange at least one directed message (`arch_question` / `arch_answer`).
- Lead records unresolved communication or architecture conflicts in `decision-log.md`.
- Directed messages requiring ACK are retried once before fallback.

## Progress Visibility Rules
- Write step start and completion events to `team/phase-events.jsonl`.
- Print phase marker before and after each major step.
- On failure, log exact error to `team/phase-events.jsonl` and include step id.
- During waits longer than 60 seconds, append heartbeat snapshots to `team/heartbeat.jsonl`.
- If hook logs exist, append recent entries to `team/hooks-snapshot.jsonl`.

## Required Artifacts
- `requirements.md`
- `context.md`
- `codex-plan.md`
- `gemini-plan.md`
- `architecture.md`
- `constraints.md`
- `tasks.md`
- `risks.md`
- `pbt.md`
- `plan.md`
- `decision-log.md`
- `timeline.md`
- `meta/artifact-manifest.json`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`
- `team/mailbox.jsonl`

Optional artifacts:
- `team/hooks-snapshot.jsonl`
- `team/communication-failures.md`

## Steps

### Step 0: Initialize
1. Resolve proposal id:
   - from argument, or
   - from `openspec view` active change selection.
2. Ensure proposal exists under `openspec/changes/${PROPOSAL_ID}`.
3. Initialize plan directories:
   ```bash
   PLAN_DIR="openspec/changes/${PROPOSAL_ID}/plan"
   PLAN_META_DIR="${PLAN_DIR}/meta"
   THINKING_DIR="openspec/changes/${PROPOSAL_ID}/thinking"
   TEAM_DIR="${PLAN_DIR}/team"
   mkdir -p "${PLAN_META_DIR}" "${TEAM_DIR}"
   ```
4. Initialize tracking files:
   - `${TEAM_DIR}/phase-events.jsonl`
   - `${TEAM_DIR}/heartbeat.jsonl`
   - `${TEAM_DIR}/mailbox.jsonl`
5. Write `input.md` with task type and assumptions.

### Step 1: Build Team and Retrieve Context
1. Create team:
   ```text
   TeamCreate(team_name="tpd-plan-${PROPOSAL_ID}", description="Plan context and architecture team")
   ```
2. Parse requirements:
   ```text
   Skill(skill="tpd:requirement-parser", args="run_dir=${PLAN_DIR}")
   ```
3. Verify `requirements.md`.
4. Create task `context-explorer` with `mode=plan-context`.
5. Wait for output and verify `context.md`.
6. If wait exceeds 60 seconds, append heartbeat snapshots.
7. Broadcast context completion and log message envelope.

### Step 2: Parallel Architecture Planning with Communication
1. Create tasks `codex-core` and `gemini-core` in parallel with `role=architect`.
2. Require both tasks to:
   - read `requirements.md` and `context.md`,
   - send one directed message to peer (`arch_question`) and process ACK,
   - send one `heartbeat` update,
   - write plan draft artifact.
3. Wait for both tasks.
4. If wait exceeds 60 seconds, append heartbeat and hook snapshots.
5. Verify `codex-plan.md` and `gemini-plan.md`.

### Step 3: Ambiguity Resolution
1. Compare two architecture drafts.
2. If unresolved differences remain, ask user one focused question per decision.
3. Write all decisions and rationale to `decision-log.md`.

### Step 4: Synthesis Pipeline
Run skills in sequence:

```text
Skill(skill="tpd:architecture-analyzer", args="run_dir=${PLAN_DIR} task_type=${TASK_TYPE}")
Skill(skill="tpd:task-decomposer", args="run_dir=${PLAN_DIR} task_type=${TASK_TYPE}")
Skill(skill="tpd:risk-assessor", args="run_dir=${PLAN_DIR}")
Skill(skill="tpd:plan-synthesizer", args="run_dir=${PLAN_DIR} proposal_id=${PROPOSAL_ID}")
```

Verify required artifacts after each call.

### Step 5: Validate
1. Run strict validation:
   ```bash
   openspec validate "${PROPOSAL_ID}" --strict --no-interactive
   ```
2. If validation fails, fix generated artifacts and rerun.
3. Build `meta/artifact-manifest.json` for downstream dev phase.

### Step 6: Finalize
1. Broadcast final summary to team.
2. Send shutdown messages.
3. Delete team.

## Fallback Policy
- If Team API fails, run architect agents with standalone `Task` calls and keep the same outputs.
- If one architecture task fails, continue with the other and record missing perspective.
- If strict validation keeps failing, stop and return errors with file paths.
- If hook logs are unavailable, continue without hook snapshot output.

## Verification
- `plan.md`, `tasks.md`, and `meta/artifact-manifest.json` exist.
- `openspec validate --strict` succeeds.
- `team/phase-events.jsonl` and `team/heartbeat.jsonl` contain entries.
- Architecture decision points are resolved or explicitly marked for user follow-up.
