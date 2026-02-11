# Subtask Plan: S5-5 (refactor command OpenSpec run path migration)

## Meta

- Subtask ID: S5-5
- Target file: `plugins/refactor/commands/refactor.md`
- Goal: Replace legacy `.claude/refactoring/runs` references with OpenSpec path.
- Date: 2026-02-11

## Objective

Update `/refactor` command so that:
1. documented RUN_DIR resolves to OpenSpec-only path;
2. run directory structure example no longer uses `.claude/refactoring/runs/...`;
3. all existing `${RUN_DIR}`-based phase references remain compatible.

## Inputs

- Current `plugins/refactor/commands/refactor.md`
- Batch D requirement 3.13
- Existing runtime naming convention

## Outputs

- Updated `plugins/refactor/commands/refactor.md` with OpenSpec runtime path references.

## Execution Steps

1. Update Phase 1 RUN_DIR description to `openspec/changes/runtime-refactor-workflow/refactor/${RUN_ID}`.
2. Add hard-cutover note near initialization section.
3. Replace run directory structure example root path with OpenSpec path.
4. Keep all `${RUN_DIR}` placeholders unchanged.
5. Verify no `.claude/refactoring/runs` remains.

## Risks

- This file uses narrative path declarations (not executable snippets); consistency with runtime implementation depends on related scripts.
- Example path should remain easy to map for users.

## Verification

- `rg -n "\.claude/refactoring/runs" plugins/refactor/commands/refactor.md` returns no matches.
- `rg -n "runtime-refactor-workflow|openspec/changes/.*/refactor" plugins/refactor/commands/refactor.md` confirms migration.

## Done Criteria

- S5-5 acceptance met: refactor command no longer references `.claude/refactoring/runs`.
- OpenSpec path guidance is consistent in both initialization and structure example sections.
