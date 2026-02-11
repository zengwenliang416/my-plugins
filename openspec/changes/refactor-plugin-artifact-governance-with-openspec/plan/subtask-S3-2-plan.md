# Subtask Plan: S3-2 (code-review command OpenSpec run path migration)

## Meta

- Subtask ID: S3-2
- Target file: `plugins/code-review/commands/review.md`
- Goal: Replace absolute and legacy `.claude` run paths with OpenSpec-only runtime paths.
- Date: 2026-02-11

## Objective

Update `/code-review` command definition so that:
1. initialization uses OpenSpec artifact path only;
2. report section no longer references `.claude/code-review/runs/...`;
3. all `${RUN_DIR}` references remain behavior-compatible.

## Inputs

- Current `plugins/code-review/commands/review.md`
- OpenSpec hard-cutover requirements (W3 S3-2)
- Prior naming convention (`CHANGE_ID="runtime-code-review-workflow"`)

## Outputs

- Updated `plugins/code-review/commands/review.md` with OpenSpec-only RUN_DIR configuration and detailed report paths.

## Execution Steps

1. Replace Phase 1 init snippet with:
   - `CHANGE_ID="runtime-code-review-workflow"`
   - `RUN_DIR="openspec/changes/${CHANGE_ID}/code-review/${RUN_ID}"`
2. Add hard-cutover policy note near init.
3. Update "Detailed Reports" legacy `.claude/code-review/runs/...` paths to OpenSpec hierarchy.
4. Keep all existing `${RUN_DIR}`-based logic unchanged.
5. Verify no absolute `/Users/.../.claude/...` and no `.claude/code-review/runs` remain.

## Risks

- Report examples and runtime snippet must stay aligned to avoid confusion in downstream manual checks.
- Existing external docs may still show old paths; addressed in later documentation batch.

## Verification

- `rg -n "/Users/.*/\.claude/|\.claude/code-review/runs" plugins/code-review/commands/review.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/code-review" plugins/code-review/commands/review.md` confirms new path wiring.

## Done Criteria

- S3-2 acceptance met: code-review command no longer references absolute or legacy `.claude` run paths.
- Single-file migration complete without changing review workflow phases.
