# Subtask Plan: S2-1 (commit command OpenSpec run path migration)

## Meta

- Subtask ID: S2-1
- Target file: `plugins/commit/commands/commit.md`
- Goal: Migrate commit workflow run directory from legacy `.claude/committing/runs/*` to OpenSpec artifact hierarchy.
- Date: 2026-02-11

## Objective

Update `/commit` command definition so that:
1. phase initialization uses OpenSpec run path only;
2. all downstream `${RUN_DIR}` outputs remain valid under new path;
3. command text explicitly follows hard-cutover policy (no legacy runtime path).

## Inputs

- Current `plugins/commit/commands/commit.md`
- OpenSpec hard-cutover change requirements (`artifact-governance`, `workflow-lifecycle`).
- Current migration wave plan (`W2 Batch A`).

## Outputs

- Updated `plugins/commit/commands/commit.md` with OpenSpec-only RUN_DIR initialization.

## Execution Steps

1. Replace Phase 1 RUN_DIR initialization with OpenSpec hierarchy:
   - `CHANGE_ID` + `RUN_ID` + `RUN_DIR=openspec/changes/<change-id>/commit/<run-id>`.
2. Add short hard-cutover note in Phase 1 block.
3. Keep all later phases using `${RUN_DIR}` unchanged (path-agnostic).
4. Ensure no `.claude/committing/runs` string remains in file.

## Risks

- Non-TPD command has no proposal id; path convention must be deterministic.
- If other docs/scripts still assume old path, later doc/task updates are needed (already planned in W7/W8).

## Verification

- `rg -n "\.claude/committing/runs" plugins/commit/commands/commit.md` returns no matches.
- `rg -n "openspec/changes/.*/commit|CHANGE_ID|RUN_ID" plugins/commit/commands/commit.md` shows new path variables.

## Done Criteria

- S2-1 acceptance met: commit command no longer references `.claude/committing/runs`.
- Single-file edit only (`plugins/commit/commands/commit.md`).
