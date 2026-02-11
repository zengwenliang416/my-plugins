# Subtask Plan: spec-only-3 (policy/spec/docs alignment for spec/change-only mode)

## Meta

- Subtask ID: spec-only-3
- Target scope: OpenSpec change docs, validation guard, llmdoc references
- Goal: align policy language from artifact-hierarchy model to spec/change-only model.
- Date: 2026-02-11

## Objective

Ensure governance docs/specs/validation consistently represent:
1. workflow outputs use `openspec/changes/<change-id>/` workspace;
2. independent runtime paths (`.runtime` and `/artifacts`) are prohibited;
3. lifecycle/cleanup and validation guidance remains executable.

## Inputs

- Current OpenSpec change docs/spec files
- Updated command files and validation intent

## Outputs

- Updated policy/spec documents and guard rules consistent with spec-only strategy.

## Execution Steps

1. Update proposal/design/spec delta path definitions.
2. Update plugin-subtasks protocol path statements and verification commands.
3. Confirm validate-skills guard enforces `.runtime` and `/artifacts` prohibition.
4. Run strict validation + grep checks.

## Risks

- Existing completed-subtask history may still mention old model; preserve auditability while correcting active policy text.

## Verification

- `openspec validate refactor-plugin-artifact-governance-with-openspec --strict --no-interactive`
- `rg -n "\.runtime/" plugins/*/commands/*.md`

## Done Criteria

- Policy/spec/docs and command files converge on spec/change-only mode.
