# Subtask Plan: 1.2 (spec delta validation backfill)

## Meta

- Subtask ID: 1.2
- Target files:
  - `openspec/changes/refactor-plugin-artifact-governance-with-openspec/specs/artifact-governance/spec.md`
  - `openspec/changes/refactor-plugin-artifact-governance-with-openspec/specs/workflow-lifecycle/spec.md`
- Goal: Confirm spec deltas exist and strict validation passes.
- Date: 2026-02-11

## Objective

Verify that required capability deltas are present and valid under strict OpenSpec validation.

## Inputs

- Existing spec delta files listed above
- `openspec validate ... --strict --no-interactive` output

## Outputs

- Validation evidence and checklist completion for task 1.2.

## Execution Steps

1. Confirm both spec delta files exist.
2. Run strict OpenSpec validation for the change.
3. If validation fails, fix deltas; if it passes, mark task complete.

## Risks

- Unnoticed spec format regressions can block archive/merge later.
- Task completion without strict validation would be invalid.

## Verification

- `ls` confirms both spec delta files exist.
- `openspec validate refactor-plugin-artifact-governance-with-openspec --strict --no-interactive` passes.

## Done Criteria

- 1.2 acceptance met and task marked completed.
