# Subtask Plan: S5-4 (feature-impl command OpenSpec run path migration)

## Meta

- Subtask ID: S5-4
- Target file: `plugins/feature-impl/commands/implement.md`
- Goal: Migrate feature-impl run directory creation to OpenSpec-only path.
- Date: 2026-02-11

## Objective

Update `/feature-impl` command so that:
1. run directory setup uses OpenSpec hierarchy;
2. all existing `{run_dir}`-based downstream instructions remain valid;
3. no `.claude/feature-impl/runs` reference remains.

## Inputs

- Current `plugins/feature-impl/commands/implement.md`
- Batch D requirement 3.12
- Established runtime naming convention

## Outputs

- Updated `plugins/feature-impl/commands/implement.md` with OpenSpec-only initialization snippet.

## Execution Steps

1. In Phase 1 setup snippet, add `CHANGE_ID="runtime-feature-impl-workflow"`.
2. Introduce `RUN_DIR="openspec/changes/${CHANGE_ID}/feature-impl/${RUN_ID}"` and use it in `mkdir -p`.
3. Add hard-cutover policy note near initialization.
4. Keep existing `{run_dir}` narrative placeholders unchanged.
5. Verify no `.claude/feature-impl/runs` remains.

## Risks

- The file mixes shell variables and templated placeholders (`{run_dir}`); only concrete path literals should be changed.
- Avoid introducing variable-name mismatches in non-executable markdown blocks.

## Verification

- `rg -n "\.claude/feature-impl/runs" plugins/feature-impl/commands/implement.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/feature-impl" plugins/feature-impl/commands/implement.md` confirms migration.

## Done Criteria

- S5-4 acceptance met: feature-impl command no longer references `.claude/feature-impl/runs`.
- Single-file migration complete without semantic workflow change.
