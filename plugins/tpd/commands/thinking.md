---
description: "TPD Thinking phase with Team-first orchestration: complexity -> boundary exploration -> constraint analysis -> synthesis -> handoff"
argument-hint: "[--depth=auto|light|deep|ultra] [--parallel] [--verbose] <problem description>"
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
  - mcp__auggie-mcp__codebase-retrieval
---

# /tpd:thinking

## Purpose

Produce a constraint set and handoff artifacts under `openspec/changes/<proposal_id>/thinking/`.

## Required Constraints

- Write TPD artifacts under `openspec/changes/<proposal_id>/thinking/`.
- Also write OpenSpec-required files at the change root: `openspec/changes/<proposal_id>/proposal.md`.
- Do not modify project source code.
- Use context-boundary split for investigation tasks.
- Keep artifact names compatible with downstream plan phase.

## Team Roles

- `context-explorer`: boundary/context investigation.
- `codex-core`: Codex role-routed reasoning (`constraint`).
- `gemini-core`: Gemini role-routed reasoning (`constraint`).

## Message Protocol

All team messages must use this schema:

```json
{
  "type": "boundary_ready|constraint_ready|constraint_question|constraint_answer|phase_broadcast|heartbeat|error",
  "from": "agent-name|lead",
  "to": "agent-name|lead|all",
  "proposal_id": "<proposal_id>",
  "task_id": "<task_id>",
  "requires_ack": true,
  "payload": {}
}
```

Acknowledgment rules:

- Directed message with `requires_ack=true` must get an ACK.
- If ACK is missing after one retry, lead marks communication timeout and continues with fallback notes.

## Progress Visibility Rules

- Before each step: append `start` event to `team/phase-events.jsonl` and print phase marker.
- After each step: append `done` event and print completion marker.
- On failure: append `error` event with exact stderr summary and failing step.
- During waits longer than 60 seconds: append heartbeat snapshot every 60 seconds to `team/heartbeat.jsonl`.
- If hook logs exist, append recent teammate/task events to `team/hooks-snapshot.jsonl`.

## Artifacts

Required outputs:

- `input.md`
- `complexity-analysis.md`
- `explore-*.json`
- `codex-thought.md` (for deep/ultra)
- `gemini-thought.md` (for deep/ultra)
- `synthesis.md`
- `conclusion.md`
- `handoff.md`
- `handoff.json`
- `meta/artifact-manifest.json`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`
- `team/mailbox.jsonl`

OpenSpec-required outputs (at change root `openspec/changes/<proposal_id>/`):

- `proposal.md`

Optional outputs:

- `team/hooks-snapshot.jsonl`
- `team/communication-failures.md`

## Steps

### Step 0: Initialize

1. Resolve OpenSpec state:
   ```bash
   openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null
   ```
2. Parse arguments and derive `PROPOSAL_ID` from the problem slug.
3. Initialize directories:
   ```bash
   THINKING_DIR="openspec/changes/${PROPOSAL_ID}/thinking"
   THINKING_META_DIR="${THINKING_DIR}/meta"
   TEAM_DIR="${THINKING_DIR}/team"
   mkdir -p "${THINKING_META_DIR}" "${TEAM_DIR}"
   ```
4. Initialize tracking files:
   - `${TEAM_DIR}/phase-events.jsonl`
   - `${TEAM_DIR}/heartbeat.jsonl`
   - `${TEAM_DIR}/mailbox.jsonl`
5. Write `input.md` and initial `state.json`.

### Step 1: Complexity Routing

1. Run:
   ```text
   Skill(skill="tpd:complexity-analyzer", args="run_dir=${THINKING_DIR}")
   ```
2. Verify `complexity-analysis.md` exists.
3. Resolve `DEPTH` (`light|deep|ultra`).
4. If score is medium and depth is auto, confirm with user once.

### Step 2: Create Team and Boundary Tasks

1. Create team:
   ```text
   TeamCreate(team_name="tpd-thinking-${PROPOSAL_ID}", description="Thinking boundary and constraint team")
   ```
2. Create boundary tasks (2-4 tasks, each on a distinct boundary) using `context-explorer` with `mode=boundary`.
3. Broadcast phase start and log message envelope to `mailbox.jsonl`.
4. Wait for task completion.
5. If wait exceeds 60 seconds, poll with `TaskList` and append heartbeat snapshots.
6. If `~/.claude/logs/hook-events/task-completed.jsonl` or `~/.claude/logs/hook-events/teammate-idle.jsonl` exists, append latest lines to `hooks-snapshot.jsonl`.
7. Verify at least one `explore-*.json` artifact.

### Step 3: Constraint Analysis and Agent Communication

1. Skip this step when `DEPTH=light`.
2. Create two tasks: `codex-core` and `gemini-core` with `role=constraint`.
3. Require each task to:
   - read all boundary artifacts,
   - send one directed message to peer (`constraint_question`),
   - wait for ACK and respond (`constraint_answer`),
   - **use the Write tool** to persist output to `${THINKING_DIR}/codex-thought.md` or `${THINKING_DIR}/gemini-thought.md` respectively, then **verify with Read** that the file exists and is non-empty,
   - send one `heartbeat` message before completion.
4. Wait for both tasks and verify artifacts exist. If either `*-thought.md` is missing, check the task output for content and write it manually as fallback.

### Step 4: Synthesis

1. Run:
   ```text
   Skill(skill="tpd:thought-synthesizer", args="run_dir=${THINKING_DIR} depth=${DEPTH}")
   ```
2. Verify `synthesis.md`.
3. If unresolved questions remain, ask user and append clarifications.

### Step 5: Conclusion and Handoff

1. Run:
   ```text
   Skill(skill="tpd:conclusion-generator", args="run_dir=${THINKING_DIR}")
   Skill(skill="tpd:handoff-generator", args="run_dir=${THINKING_DIR} proposal_id=${PROPOSAL_ID}")
   ```
2. Verify `conclusion.md`, `handoff.md`, `handoff.json`.
3. Build `meta/artifact-manifest.json`.

### Step 5.5: Generate OpenSpec Proposal

1. Set `CHANGE_DIR="openspec/changes/${PROPOSAL_ID}"`.
2. If `${CHANGE_DIR}/proposal.md` does not already exist, generate it from thinking artifacts:

   ```markdown
   # Change: [Brief title derived from input.md problem description]

   ## Why

   [1-2 sentences from input.md problem statement]

   ## What Changes

   [Bullet list from conclusion.md key findings and recommendations]

   ## Impact

   - Affected specs: [derive from synthesis.md affected boundaries]
   - Affected code: [derive from explore-*.json investigated paths]
   ```

3. Verify `${CHANGE_DIR}/proposal.md` exists and is non-empty.

### Step 6: Finalize

1. Send shutdown broadcast to all teammates.
2. Delete team with `TeamDelete`.
3. Update `state.json` to `completed`.

## Fallback Policy

- If `TeamCreate` fails, fall back to standalone `Task` execution while preserving the same artifacts.
- If one model task fails, continue with available artifacts and record gap in `synthesis.md`.
- If handoff generation fails, stop and return actionable error.
- If hook logs are unavailable, continue without hook snapshot output.

## Verification

- Every required artifact exists.
- `handoff.json` is valid JSON.
- `proposal.md` exists at change root and contains Why/What Changes/Impact sections.
- `team/phase-events.jsonl` and `team/heartbeat.jsonl` contain entries.
- No write outside `openspec/changes/<proposal_id>/` (thinking/ for TPD artifacts, root for OpenSpec files).
