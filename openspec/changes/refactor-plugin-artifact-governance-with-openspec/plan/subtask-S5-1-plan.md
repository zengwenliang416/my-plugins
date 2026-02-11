# Subtask Plan: S5-1 (database-design command OpenSpec run path migration)

## Meta

- Subtask ID: S5-1
- Target file: `plugins/database-design/commands/design.md`
- Goal: Migrate database-design run directory from legacy `.claude` path to OpenSpec path.
- Date: 2026-02-11

## Objective

Update `/database-design` command so that:
1. initialization writes runtime artifacts under OpenSpec hierarchy only;
2. all downstream `${RUN_DIR}` references remain valid without behavior changes;
3. no `.claude/database-design/runs` reference remains.

## Inputs

- Current `plugins/database-design/commands/design.md`
- Batch D requirement 3.9 in OpenSpec tasks
- Existing runtime naming convention (`runtime-<workflow>-workflow`)

## Outputs

- Updated `plugins/database-design/commands/design.md` with OpenSpec-only RUN_DIR initialization.

## Execution Steps

1. In Phase 1 initialization snippet, add `CHANGE_ID="runtime-database-design-workflow"`.
2. Replace `RUN_DIR` with `openspec/changes/${CHANGE_ID}/database-design/${RUN_ID}`.
3. Add hard-cutover policy note near initialization.
4. Keep all later `${RUN_DIR}` usage unchanged.
5. Verify no `.claude/database-design/runs` text remains.

## Risks

- Any downstream docs/examples outside this file may still assume old path and will be handled in docs batch.
- Must keep timestamp format to preserve existing run-id readability.

## Verification

- `rg -n "\.claude/database-design/runs" plugins/database-design/commands/design.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/database-design" plugins/database-design/commands/design.md` confirms migration.

## Done Criteria

- S5-1 acceptance met: database-design command no longer references `.claude/database-design/runs`.
- Single-file migration complete with preserved workflow semantics.
