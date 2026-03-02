---
description: "TPD Dev phase: minimal-scope implementation -> review -> progress update"
argument-hint: "[proposal_id] [scope]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
  - Agent
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

Implement one minimal verifiable scope from OpenSpec tasks and update progress.

## Delegation Chain

- Command only orchestrates flow and dispatch.
- Command must not execute phase skills directly.
- Execution chain is fixed: `Command -> Agent -> Skills`.

## Parameter Policy

- Optional inputs: `proposal_id` and scope note.
- If `proposal_id` is omitted, use active OpenSpec change.
- Mode is not controlled by command parameters.
- Default task type is fixed to `fullstack`.
- Default fix-loop cap is fixed to `max 2` rounds.

## OpenSpec Hard Requirements

- Use `openspec/changes/<proposal_id>/tasks.md` as source of truth.
- Only mark tasks complete after implementation and review.

## Required Artifacts (Minimal)

- `tasks-scope.md`
- `changes.md`
- `tasks-progress.md`

## Optional Artifacts

- `context.md`
- `analysis-codex.md`
- `analysis-gemini.md`
- `prototype-codex.diff`
- `prototype-gemini.diff`
- `audit-codex.md`
- `audit-gemini.md`
- `team/mailbox.jsonl`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`
- `team/hooks-snapshot.jsonl`
- `team/communication-failures.md`

## Agent Result Handling

- Lead agent is coordinator-only in team mode.
- After each dispatch batch, immediately wait for completion (blocking `Agent` first, fallback blocking `Task`).
- During wait, lead agent must not run phase work (no self execution of coding/review/fix loops).
- Do not call `TaskOutput`.
- Do not create nested teams from teammate context.

## Agent Dispatch Contracts

- `context-explorer` (plan-context): collect incremental implementation context into `context.md`.
- `codex-core` (implementer): backend/fullstack analysis + prototype diff + fix application.
- `gemini-core` (implementer): frontend/ux prototype diff + fix application.
- `codex-core` / `gemini-core` (auditor): parallel audits and blocker reporting.
- `codex-core` (implementer, finalize task): consolidate reviewed patches into `changes.md`.

## Steps

### Step 0: Resolve Inputs

1. Resolve `PROPOSAL_ID` and load plan/root artifacts.
2. Initialize `openspec/changes/${PROPOSAL_ID}/dev/`.
3. Set effective task type to default `fullstack`.

### Step 1: Select Minimal Scope

1. Select 1-3 tasks from root `tasks.md`.
2. Write `tasks-scope.md` with acceptance and test expectations.
3. **HARD STOP**: confirm selected scope with `AskUserQuestion`.

### Step 2: Implement and Review

1. Dispatch `context-explorer` for incremental context retrieval if needed, then wait.
2. Dispatch `codex-core` and `gemini-core` implementers for analysis/prototype generation, then wait.
3. Dispatch `codex-core` and `gemini-core` auditors; if blockers exist, dispatch implementer fix tasks (`max 2` rounds), waiting after each round.
4. Dispatch one `codex-core` finalize task to assemble `changes.md`, then wait.

### Step 3: Update Progress

1. Update root `tasks.md` completion state.
2. Write `tasks-progress.md`.
3. **HARD STOP**: ask whether to continue next minimal scope.

### Step 4: Finalize

1. Broadcast summary and close team.
2. If all tasks complete, run `/openspec:archive`.

## Fallback Policy

- Team API unavailable -> degrade to standalone blocking calls.
- One model unavailable -> continue with available model and document risk.
- Exceeded fix-loop cap -> stop auto-loop and request user decision.

## Verification

- `tasks-scope.md`, `changes.md`, and `tasks-progress.md` exist.
- Root `tasks.md` matches actual completed scope.
- Residual blockers are explicitly documented.
