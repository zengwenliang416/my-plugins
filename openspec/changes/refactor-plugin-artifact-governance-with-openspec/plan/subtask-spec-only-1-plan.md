# Subtask Plan: spec-only-1 (workflow command path pivot to spec/change-only)

## Meta

- Subtask ID: spec-only-1
- Target scope: non-TPD workflow commands (`plugins/*/commands/*.md`)
- Goal: remove independent runtime directories and point workflow paths directly to `openspec/changes/<change-id>/`.
- Date: 2026-02-11

## Objective

Refactor command runtime path guidance to pure spec/change usage:
1. no `.runtime/...` references;
2. no legacy nested `openspec/changes/.../...` references in these commands;
3. workflow outputs resolved directly from `openspec/changes/${CHANGE_ID}`.

## Inputs

- Existing migrated command files with `.runtime` or legacy nested paths
- User decision: OpenSpec spec/change only, drop independent runtime nesting

## Outputs

- Updated command definitions with change-root path model
- Consistent policy text describing spec-only mode

## Execution Steps

1. Update initialization snippets in each command to set `CHANGE_ID` and `RUN_DIR="openspec/changes/${CHANGE_ID}"`.
2. Rewrite policy notes from runtime/artifact mode to spec-only mode.
3. Update any documented run directory examples to change-root paths.
4. Validate no `.runtime` and no legacy nested OpenSpec path remain in non-TPD command files.

## Risks

- Some workflows use `--run-id`; mapping this to `CHANGE_ID` must stay resumable.
- Overbroad replacements can affect non-path semantics.

## Verification

- `rg -n "\.runtime/" plugins/*/commands/*.md`
- Manual spot-check of initialization sections.

## Done Criteria

- Non-TPD command files use spec/change root paths only.
