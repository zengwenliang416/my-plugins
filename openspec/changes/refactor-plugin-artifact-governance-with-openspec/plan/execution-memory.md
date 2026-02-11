# Execution Memory

## User Preference (Pinned)

- Effective date: 2026-02-11
- Rule: Before executing each subtask, create a complete plan document first, then execute.
- Scope: All subtasks in `refactor-plugin-artifact-governance-with-openspec`.
- Enforcement:
  1. Each subtask must have a dedicated `subtask-<id>-plan.md`.
  2. Plan must include objective, inputs, outputs, steps, risks, and verification.
  3. Execution starts only after plan file is written.

## Runtime Strategy (Pinned)

- Effective date: 2026-02-11
- Policy: All active workflows must use pure OpenSpec spec/change workspace paths only.
- Required pattern:
  - Generic workflows: `openspec/changes/{change_id}/`
  - TPD phased workflows: `openspec/changes/{proposal_id}/{thinking|plan|dev}/`
- Forbidden runtime roots:
  - `.claude/*/runs/*`
  - `.runtime/*`
  - legacy nested runtime paths under `openspec/changes/`

## Current Queue

- Next subtask: none (all checklist items complete)
- Plan file: n/a
