# Subtask Plan: S3-1 (bug-investigation command OpenSpec run path migration)

## Meta

- Subtask ID: S3-1
- Target file: `plugins/bug-investigation/commands/investigate.md`
- Goal: Replace absolute legacy run path with OpenSpec artifact path.
- Date: 2026-02-11

## Objective

Update `/bug-investigation` command definition so that:
1. runtime directory is created under OpenSpec hierarchy only;
2. no absolute `/Users/.../.claude/...` path remains;
3. all existing `${RUN_DIR}` consumers keep working unchanged.

## Inputs

- Current `plugins/bug-investigation/commands/investigate.md`
- OpenSpec hard-cutover policy and W3 batch requirements
- Existing naming convention from prior subtasks (`runtime-<workflow>-workflow`)

## Outputs

- Updated `plugins/bug-investigation/commands/investigate.md` with OpenSpec-only initialization snippet.

## Execution Steps

1. Replace initialization block in Phase 1.1:
   - introduce `CHANGE_ID="runtime-bug-investigation-workflow"`
   - switch `RUN_DIR` to `openspec/changes/${CHANGE_ID}/bug-investigation/${TIMESTAMP}`
2. Add hard-cutover note near initialization.
3. Keep all downstream `${RUN_DIR}` references unchanged.
4. Verify no absolute `.claude` path remains.

## Risks

- Some external docs may still reference old path; this subtask focuses only command execution contract.
- Timestamp format remains unchanged to avoid implicit behavior changes.

## Verification

- `rg -n "/Users/.*/\.claude/|\.claude/bug-investigation/runs" plugins/bug-investigation/commands/investigate.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/bug-investigation" plugins/bug-investigation/commands/investigate.md` confirms migration.

## Done Criteria

- S3-1 acceptance met: no absolute legacy run path in investigate command.
- Single-file migration complete with unchanged orchestration semantics.
