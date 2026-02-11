# Subtask Plan: spec-only-4 (documentation and status convergence)

## Meta

- Subtask ID: spec-only-4
- Date: 2026-02-11
- Scope: OpenSpec change records + plugin/llmdoc residual runtime-path cleanup verification

## Objective

Complete final convergence after spec-only cutover by:
1. syncing OpenSpec task/memory summaries with the latest spec-only decision;
2. recording additional documentation cleanup outside command files;
3. re-running strict validations and grep checks.

## Inputs

- Existing migration change package:
  - `openspec/changes/refactor-plugin-artifact-governance-with-openspec/tasks.md`
  - `openspec/changes/refactor-plugin-artifact-governance-with-openspec/plan/migration-summary.md`
  - `openspec/changes/refactor-plugin-artifact-governance-with-openspec/plan/execution-memory.md`
- Updated plugin/llmdoc files from spec-only cleanup

## Outputs

- Updated task checklist including doc-level residual cleanup and final full-scope checks
- Updated migration summary reflecting spec/change-only runtime policy (no legacy nested runtime layer)
- Updated execution memory reflecting completed convergence state
- Validation evidence (openspec validate + validate-skills + repository grep)

## Execution Steps

1. Update `tasks.md` to include remaining doc-level cleanup/verification tasks and mark completion.
2. Update `migration-summary.md` wording from legacy runtime path model to "spec/change-only workspace" and append doc cleanup scope.
3. Update `execution-memory.md` queue/status to reflect final closure state.
4. Run strict validation and grep checks; capture outcomes.

## Risks

- Historical/archived examples may still intentionally contain old paths and be mistaken as active runtime policy.
- Broad grep may produce noise from unrelated archived changes.

## Verification

- `openspec validate refactor-plugin-artifact-governance-with-openspec --strict --no-interactive`
- `bash scripts/validate-skills.sh`
- `rg -n "\.claude/.*/runs|/Users/.*/\.claude/|\.runtime/" plugins llmdoc`
