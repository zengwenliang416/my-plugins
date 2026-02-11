# Subtask Plan: S4-3 (plan-execute execute command OpenSpec run path migration)

## Meta

- Subtask ID: S4-3
- Target file: `plugins/plan-execute/commands/execute.md`
- Goal: Migrate execute phase artifact loading to OpenSpec-only prerequisite lookup.
- Date: 2026-02-11

## Objective

Update `/plan-execute:execute` command so that:
1. run artifact loading uses OpenSpec path only;
2. prerequisites (`issues.csv`, `csv-metadata.json`, `plan/`) are checked under OpenSpec path;
3. no `.claude/plan-execute/runs` reference remains.

## Inputs

- Current `plugins/plan-execute/commands/execute.md`
- W4 Batch C requirement 3.8
- Path convention established by S4-1 and S4-2

## Outputs

- Updated `plugins/plan-execute/commands/execute.md` with OpenSpec-only RUN_DIR resolution.

## Execution Steps

1. In Step 1 load block, add `CHANGE_ID="runtime-plan-execute-workflow"`.
2. Replace `RUN_DIR=.claude/plan-execute/runs/${RUN_ID}` with OpenSpec path.
3. Add hard-cutover policy note to enforce OpenSpec-only prerequisite lookup.
4. Keep all subsequent `${RUN_DIR}` references untouched.
5. Verify no `.claude/plan-execute/runs` remains.

## Risks

- execute phase is the final consumer of plan+csv artifacts; inconsistent path would break the entire pipeline.
- Changes must remain aligned with S4-1/S4-2 convention.

## Verification

- `rg -n "\.claude/plan-execute/runs" plugins/plan-execute/commands/execute.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/plan-execute" plugins/plan-execute/commands/execute.md` confirms OpenSpec lookup path.

## Done Criteria

- S4-3 acceptance met: execute command prerequisites reference OpenSpec path only.
- Single-file migration complete without changing per-issue execution semantics.
