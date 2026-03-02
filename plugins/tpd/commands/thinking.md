---
description: "TPD Thinking phase: problem analysis -> boundary exploration -> synthesis -> handoff"
argument-hint: "<problem description>"
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
  - mcp__auggie-mcp__codebase-retrieval
---

# /tpd:thinking

## Purpose

Produce thinking outputs for OpenSpec change initialization.

## Delegation Chain

- Command only orchestrates flow and dispatch.
- Command must not execute phase skills directly.
- Execution chain is fixed: `Command -> Agent -> Skills`.

## Parameter Policy

- Only one input is required: problem description.
- Mode is not controlled by command parameters.
- Default depth is fixed to `ultra`.

## OpenSpec Hard Requirements

For OpenSpec chain continuity, this phase must ensure:

- `openspec/changes/<proposal_id>/proposal.md`
- `openspec/changes/<proposal_id>/thinking/handoff.json`

Notes:

- OpenSpec strict validation is enforced at plan phase.
- Do not modify project source code in this phase.

## Required Artifacts (Minimal)

- `conclusion.md`
- `handoff.json`
- `openspec/changes/<proposal_id>/proposal.md`

## Optional Artifacts

- `complexity-analysis.md`
- `explore-*.json`
- `codex-thought.md`
- `gemini-thought.md`
- `synthesis.md`
- `handoff.md`
- `meta/artifact-manifest.json`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`
- `team/mailbox.jsonl`
- `team/hooks-snapshot.jsonl`
- `team/communication-failures.md`

## Agent Result Handling

- Lead agent is coordinator-only in team mode.
- After each dispatch batch, immediately wait for completion (blocking `Agent` first, fallback blocking `Task`).
- During wait, lead agent must not run phase work (no self execution of analysis/synthesis/generation).
- Do not call `TaskOutput`.
- Do not create nested teams from teammate context.

## Agent Dispatch Contracts

- `context-explorer` (boundary): split boundaries and output `explore-*.json`.
- `codex-core` (constraint): backend/architecture constraints and `codex-thought.md`.
- `gemini-core` (constraint): frontend/UX constraints and `gemini-thought.md`.
- `codex-core` (constraint, synthesis task): consolidate evidence and produce `synthesis.md`, `conclusion.md`, `handoff.json`.

## Steps

### Step 0: Initialize

1. Resolve OpenSpec state and derive `PROPOSAL_ID`.
2. Initialize `openspec/changes/${PROPOSAL_ID}/thinking/`.
3. Write `input.md`.

### Step 1: Complexity Baseline

1. Keep depth fixed to default `ultra` (no parameter override).
2. If baseline evidence is needed, dispatch one `codex-core` teammate and wait.

### Step 2: Boundary Exploration

1. Create team and boundary work items.
2. Dispatch `context-explorer` teammates for all boundaries in one batch.
3. Wait until all dispatched teammates complete.
4. Ensure boundary evidence is captured.

### Step 3: Constraint Synthesis

1. Dispatch `codex-core` and `gemini-core` in constraint role.
2. Wait until both teammates complete.
3. Dispatch one `codex-core` teammate for synthesis/handoff generation and wait.
4. If unresolved decisions remain: **HARD STOP** with `AskUserQuestion`.

### Step 4: Conclusion and Handoff

1. Confirm dispatched synthesis teammate produced `conclusion.md` and `handoff.json`.
2. Ensure `handoff.json` exists and is valid JSON.

### Step 5: Proposal

1. Ensure `openspec/changes/${PROPOSAL_ID}/proposal.md` exists.
2. If missing, generate minimal `Why / What Changes / Impact` sections.

### Step 6: Finalize

1. Broadcast summary and close team.

## Fallback Policy

- Team API unavailable -> degrade to standalone blocking calls with same minimal contract.
- Single model unavailable -> continue with available evidence and mark gap.

## Verification

- `proposal.md` and `handoff.json` exist.
- `handoff.json` is valid JSON.
- Any unresolved decisions are explicitly documented.
