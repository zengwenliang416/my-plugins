# Subtask Plan: S5-6 (refactor-team command OpenSpec run path migration)

## Meta

- Subtask ID: S5-6
- Target file: `plugins/refactor-team/commands/refactor.md`
- Goal: Migrate refactor-team run directory to OpenSpec path.
- Date: 2026-02-11

## Objective

Update `/refactor-team` command so that:
1. Phase 1 run directory setup uses OpenSpec-only path;
2. existing `${run_dir}` references remain valid;
3. no `.claude/refactor-team/runs` reference remains.

## Inputs

- Current `plugins/refactor-team/commands/refactor.md`
- Batch D requirement 3.14
- Existing runtime naming convention

## Outputs

- Updated `plugins/refactor-team/commands/refactor.md` with OpenSpec run path initialization.

## Execution Steps

1. In Phase 1 setup snippet, add `CHANGE_ID="runtime-refactor-team-workflow"`.
2. Replace `run_dir` assignment with `openspec/changes/${CHANGE_ID}/refactor-team/${RUN_ID}`.
3. Add hard-cutover policy note near initialization.
4. Keep all later `${run_dir}` references unchanged.
5. Verify no `.claude/refactor-team/runs` remains.

## Risks

- Variable name in this file is `run_dir` (lowercase); ensure consistency is preserved.
- Other docs may still refer to old path and should be handled in doc update batch.

## Verification

- `rg -n "\.claude/refactor-team/runs" plugins/refactor-team/commands/refactor.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/refactor-team" plugins/refactor-team/commands/refactor.md` confirms migration.

## Done Criteria

- S5-6 acceptance met: refactor-team command no longer references `.claude/refactor-team/runs`.
- Single-file migration complete with unchanged workflow behavior.
