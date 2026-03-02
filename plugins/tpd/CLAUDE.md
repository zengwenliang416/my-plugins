# TPD Plugin

<!-- Machine-readable metadata for unified-eval.sh -->
<available-skills>

| Skill           | Trigger                | Description                         |
| --------------- | ---------------------- | ----------------------------------- |
| `/tpd:init`     | "初始化", "init tpd"   | Initialize OpenSpec environment     |
| `/tpd:thinking` | "深度思考", "分析问题" | Build thinking handoff              |
| `/tpd:plan`     | "制定计划", "规划"     | Build OpenSpec-valid execution plan |
| `/tpd:dev`      | "开发", "实现"         | Execute minimal verifiable scope    |

</available-skills>

## Overview

TPD uses OpenSpec as the single chain-of-truth workspace:
`openspec/changes/<proposal_id>/`.

Recommended order:

1. `/tpd:init`
2. `/tpd:thinking`
3. `/tpd:plan`
4. `/tpd:dev`

## OpenSpec Must-Haves

For a valid change in `openspec/changes/<proposal_id>/`:

- `proposal.md`
- `tasks.md`
- `specs/<capability>/spec.md`

`spec.md` minimum format:

- `## ADDED Requirements` or `## MODIFIED Requirements`
- each `### Requirement:` has at least one `#### Scenario:`

## TPD Minimal Artifacts

### Thinking (minimum)

- `thinking/handoff.json`
- `proposal.md`

### Plan (minimum)

- `plan/plan.md`
- `plan/constraints.md`
- `plan/tasks.md`
- `plan/pbt.md`
- `plan/meta/artifact-manifest.json`
- root `tasks.md`
- root `specs/*/spec.md`

### Dev (minimum)

- `dev/tasks-scope.md`
- `dev/changes.md`
- `dev/tasks-progress.md`

## Optional Artifacts

Team logs, heartbeat snapshots, dual-model drafts, audit files, and timeline files are optional unless a workflow step explicitly requests them.

## Parameter Policy

- Default mode: minimal parameters.
- Modes are fixed by workflow defaults (not switched by command parameters).
- `thinking`: problem description only, default depth = `ultra`.
- `plan`: optional `proposal_id`, default task type = `fullstack`.
- `dev`: optional `proposal_id` + optional scope note, default task type = `fullstack`.
- `dev` fix loop cap default = `max 2` rounds.

## Agent Types

- `context-explorer`
- `codex-core`
- `gemini-core`

## Team Tool Rules

- Prefer blocking `Agent` calls.
- Runtime compatibility: fallback to blocking `Task` when needed.
- Do not call `TaskOutput`.
- Do not manually construct task IDs.
- Do not create nested teams from teammate context.

## Communication Rules

- Use command-defined JSON envelopes.
- Directed messages with `requires_ack=true` require ACK.
- Retry once, then log timeout and continue with fallback notes.
