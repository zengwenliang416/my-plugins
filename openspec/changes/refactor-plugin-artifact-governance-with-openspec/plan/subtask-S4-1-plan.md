# Subtask Plan: S4-1 (plan-execute plan command OpenSpec run path migration)

## Meta

- Subtask ID: S4-1
- Target file: `plugins/plan-execute/commands/plan.md`
- Goal: Migrate plan phase run directory to OpenSpec-only path.
- Date: 2026-02-11

## Objective

Update `/plan-execute:plan` command so that:
1. run initialization uses OpenSpec path instead of `.claude/plan-execute/runs`;
2. resume behavior via `--run-id` remains unchanged;
3. all downstream `${RUN_DIR}` references remain valid.

## Inputs

- Current `plugins/plan-execute/commands/plan.md`
- Batch C requirement 3.6 in OpenSpec tasks
- Existing naming convention for workflow change id

## Outputs

- Updated `plugins/plan-execute/commands/plan.md` with OpenSpec-only run directory initialization.

## Execution Steps

1. In Step 1 initialization block, add `CHANGE_ID="runtime-plan-execute-workflow"`.
2. Replace `RUN_DIR` assignment with `openspec/changes/${CHANGE_ID}/plan-execute/${RUN_ID}`.
3. Keep `mkdir -p ${RUN_DIR}/plan` and all `${RUN_DIR}` usages unchanged.
4. Add hard-cutover note near initialization.
5. Verify no `.claude/plan-execute/runs` remains in this file.

## Risks

- plan/csv/execute three commands share path convention; migration must stay consistent across all three subtasks.
- Any later docs showing old path must be updated in documentation phase.

## Verification

- `rg -n "\.claude/plan-execute/runs" plugins/plan-execute/commands/plan.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/plan-execute" plugins/plan-execute/commands/plan.md` confirms migration.

## Done Criteria

- S4-1 acceptance met: plan command no longer references `.claude/plan-execute/runs`.
- Single-file migration complete with unchanged phase semantics.
