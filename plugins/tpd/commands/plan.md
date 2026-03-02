---
description: "TPD Plan phase: requirements -> architecture -> decomposition -> OpenSpec validate"
argument-hint: "[proposal_id]"
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
  - Glob
  - Grep
  - mcp__auggie-mcp__codebase-retrieval
---

# /tpd:plan

## Purpose

Convert a proposal into an executable plan and generate OpenSpec root artifacts required by strict validation.

## Delegation Chain

- Command only orchestrates flow and dispatch.
- Command must not execute phase skills directly.
- Execution chain is fixed: `Command -> Agent -> Skills`.

## Parameter Policy

- Optional input: `proposal_id`.
- If omitted, use active OpenSpec change from `openspec view`.
- Mode is not controlled by command parameters.
- Default task type is fixed to `fullstack`.

## OpenSpec Hard Requirements

To pass `openspec validate --strict`, this phase must output at change root:

- `openspec/changes/<proposal_id>/tasks.md`
- `openspec/changes/<proposal_id>/specs/<capability>/spec.md`

Spec minimum format requirements:

- Use `## ADDED Requirements` or `## MODIFIED Requirements`
- Each `### Requirement:` must include at least one `#### Scenario:`

## Required Artifacts (Minimal)

- `plan.md`
- `constraints.md`
- `tasks.md`
- `pbt.md`
- `meta/artifact-manifest.json`
- `openspec/changes/<proposal_id>/tasks.md`
- `openspec/changes/<proposal_id>/specs/<capability>/spec.md` (at least one)

## Optional Artifacts

- `requirements.md`
- `context.md`
- `codex-plan.md`
- `gemini-plan.md`
- `architecture.md`
- `risks.md`
- `decision-log.md`
- `timeline.md`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`
- `team/mailbox.jsonl`
- `team/hooks-snapshot.jsonl`
- `team/communication-failures.md`

## Agent Result Handling

- Lead agent is coordinator-only in team mode.
- After each dispatch batch, immediately wait for completion (blocking `Agent` first, fallback blocking `Task`).
- During wait, lead agent must not run phase work (no self execution of parse/synthesis/decomposition).
- Do not call `TaskOutput`.
- Do not create nested teams from teammate context.

## Agent Dispatch Contracts

- `context-explorer` (plan-context): build `requirements.md` and `context.md`.
- `codex-core` (architect): backend/data/api architecture to `codex-plan.md`.
- `gemini-core` (architect): frontend/ux integration architecture to `gemini-plan.md`.
- `codex-core` (architect, synthesis task): assemble `architecture.md`, `constraints.md`, `tasks.md`, `pbt.md`, `plan.md`, and manifest.

## Steps

### Step 0: Initialize

1. Resolve `PROPOSAL_ID` (argument or active change).
2. Initialize `openspec/changes/${PROPOSAL_ID}/plan/`.
3. Set effective task type to default `fullstack`.

### Step 1: Requirements and Context

1. Dispatch `context-explorer` for requirements normalization and context retrieval.
2. Wait for completion and verify `requirements.md` / `context.md`.

### Step 2: Architecture

1. Dispatch `codex-core` and `gemini-core` in architect role (fullstack baseline).
2. Wait until both teammates complete.
3. If architecture conflicts remain unresolved: **HARD STOP** with `AskUserQuestion`.

### Step 3: Plan Synthesis

1. Dispatch one `codex-core` teammate to run synthesis/decomposition/risk/plan assembly work.
2. Wait until synthesis teammate completes.
3. Ensure minimal required plan artifacts are generated.

### Step 4: OpenSpec Root Artifacts

1. Generate root `tasks.md` from plan tasks.
2. Generate at least one capability spec at `specs/*/spec.md` with required format.

### Step 5: Validate

1. Run:
   ```bash
   openspec validate "${PROPOSAL_ID}" --type change --strict --no-interactive
   ```
2. If validation fails, fix root artifacts and rerun.

### Step 6: Finalize

1. Build/update manifest.
2. Broadcast summary and close team.

## Fallback Policy

- Team API unavailable -> degrade to standalone blocking calls.
- One model perspective unavailable -> continue and record coverage gap.

## Verification

- Root `tasks.md` and at least one `specs/*/spec.md` exist.
- Strict validation passes.
- Minimal plan artifacts exist.
