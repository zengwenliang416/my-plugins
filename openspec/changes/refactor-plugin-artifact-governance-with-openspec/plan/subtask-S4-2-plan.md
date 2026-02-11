# Subtask Plan: S4-2 (plan-execute csv command OpenSpec run path migration)

## Meta

- Subtask ID: S4-2
- Target file: `plugins/plan-execute/commands/csv.md`
- Goal: Migrate CSV phase run directory lookup to OpenSpec-only path.
- Date: 2026-02-11

## Objective

Update `/plan-execute:csv` command so that:
1. run artifact lookup uses OpenSpec path only;
2. prerequisite checks and output locations remain logically identical;
3. no `.claude/plan-execute/runs` reference remains.

## Inputs

- Current `plugins/plan-execute/commands/csv.md`
- W4 Batch C requirement 3.7
- Path convention established in S4-1

## Outputs

- Updated `plugins/plan-execute/commands/csv.md` using OpenSpec-only RUN_DIR resolution.

## Execution Steps

1. In Step 1 lookup block, add `CHANGE_ID="runtime-plan-execute-workflow"`.
2. Replace `RUN_DIR=.claude/plan-execute/runs/${RUN_ID}` with OpenSpec path.
3. Add hard-cutover policy note near lookup/prerequisite section.
4. Keep all `${RUN_DIR}` usage in later sections unchanged.
5. Verify no `.claude/plan-execute/runs` remains.

## Risks

- csv phase depends on artifacts from plan phase; both commands must share identical path convention.
- Wrong path mapping would break execute phase prerequisite chain.

## Verification

- `rg -n "\.claude/plan-execute/runs" plugins/plan-execute/commands/csv.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/plan-execute" plugins/plan-execute/commands/csv.md` confirms migration.

## Done Criteria

- S4-2 acceptance met: csv command no longer references `.claude/plan-execute/runs`.
- Single-file migration completed with deterministic prerequisite lookup.
