# Subtask Plan: 6.2 (reference docs update for runtime artifact standard)

## Meta

- Subtask ID: 6.2
- Target files:
  - `llmdoc/reference/coding-conventions.md`
  - `llmdoc/reference/workflow-inventory.md`
- Goal: Align reference docs with OpenSpec runtime artifact standard.
- Date: 2026-02-11

## Objective

Update reference docs so runtime directory guidance reflects hard-cutover policy:
1. coding conventions mention OpenSpec runtime location instead of `.claude/{workflow}/runs/{timestamp}`;
2. workflow inventory run-dir fields match migrated command definitions;
3. no reference docs claim legacy `.claude/*/runs` as active runtime source.

## Inputs

- Current reference docs listed above
- Migrated command files in plugins
- OpenSpec runtime conventions by workflow type

## Outputs

- Updated reference docs with OpenSpec-only runtime path descriptions.

## Execution Steps

1. Replace runtime directory bullet in coding conventions with OpenSpec model.
2. Update workflow inventory run-dir entries (commit/ui-design/brainstorm/refactor/context-memory as needed).
3. Keep tpd and docflow entries aligned with actual command semantics.
4. Verify no `.claude/*/runs` remains in the two reference docs.

## Risks

- Inventory paths can drift from command reality if generalized too aggressively.
- Need to keep context-memory/docflow descriptions accurate (router/team context, not forced run dir).

## Verification

- `rg -n "\.claude/.*/runs|\.claude/\{workflow\}/runs" llmdoc/reference/coding-conventions.md llmdoc/reference/workflow-inventory.md` returns no matches.
- Run-dir entries reflect current command conventions.

## Done Criteria

- 6.2 acceptance met: reference docs fully reflect OpenSpec runtime standard and remove legacy run-dir guidance.
