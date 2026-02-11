# Subtask Plan: S2-2 (brainstorm command OpenSpec run path migration)

## Meta

- Subtask ID: S2-2
- Target file: `plugins/brainstorm/commands/brainstorm.md`
- Goal: Migrate brainstorm workflow runtime directory from legacy `.claude/brainstorm/runs/*` to OpenSpec artifact hierarchy.
- Date: 2026-02-11

## Objective

Update `/brainstorm` command definition so that:
1. initialization and resume both use OpenSpec run path only;
2. all phase outputs remain under `${RUN_DIR}` without changing workflow semantics;
3. command text explicitly states hard-cutover policy (no legacy runtime path).

## Inputs

- Current `plugins/brainstorm/commands/brainstorm.md`
- OpenSpec hard-cutover requirements in change `refactor-plugin-artifact-governance-with-openspec`
- Existing path naming convention from S2-1 (`runtime-<workflow>-workflow` + `openspec/changes/.../<workflow>/<run-id>`)

## Outputs

- Updated `plugins/brainstorm/commands/brainstorm.md` with OpenSpec-only RUN_DIR initialization and resume path.

## Execution Steps

1. In Phase 0 setup, introduce fixed `CHANGE_ID` for brainstorm runtime governance.
2. Replace RUN_DIR assignment for both new run and resume mode with:
   `openspec/changes/${CHANGE_ID}/brainstorm/${RUN_ID}`.
3. Keep downstream `${RUN_DIR}` references unchanged.
4. Add hard-cutover note to prevent reintroducing `.claude/brainstorm/runs`.
5. Verify no legacy path string remains.

## Risks

- Resume logic depends on path continuity; both new and resume branches must use the same OpenSpec root.
- Other scripts outside command definition may still assume old path (to be handled in later subtasks if detected).

## Verification

- `rg -n "\.claude/brainstorm/runs" plugins/brainstorm/commands/brainstorm.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/brainstorm" plugins/brainstorm/commands/brainstorm.md` confirms new path.

## Done Criteria

- S2-2 acceptance met: brainstorm command no longer references `.claude/brainstorm/runs`.
- Single-file behavior-preserving migration completed.
