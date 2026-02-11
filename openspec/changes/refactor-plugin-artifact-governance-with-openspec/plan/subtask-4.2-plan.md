# Subtask Plan: 4.2 (sync/validation docs alignment for OpenSpec runtime)

## Meta

- Subtask ID: 4.2
- Target files:
  - `scripts/sync-plugins.sh`
  - `scripts/validate-skills.sh` (already updated in 4.1, re-check for consistency)
- Goal: Align script-level documentation/comments with OpenSpec-only runtime path policy.
- Date: 2026-02-11

## Objective

Ensure plugin tooling scripts communicate the runtime path policy clearly and run without path-related warnings.

## Inputs

- Existing `scripts/sync-plugins.sh` and `scripts/validate-skills.sh`
- Task requirements 4.2 and hard-cutover policy

## Outputs

- Updated script comments/documentation where needed to reflect OpenSpec runtime model.
- Verification evidence that tooling runs without runtime-path warnings/errors.

## Execution Steps

1. Inspect script headers/comments for legacy runtime path assumptions.
2. Add concise note in sync script clarifying runtime artifacts are OpenSpec-governed and not synced via plugin cache.
3. Ensure validate script guard behavior aligns with this policy.
4. Run `bash scripts/validate-skills.sh` to verify no path-related warnings/errors.

## Risks

- Confusing plugin-cache path (`~/.claude/plugins/cache`) with runtime artifact path policy.
- Over-documenting may reduce readability; keep comment concise.

## Verification

- `bash scripts/validate-skills.sh` exits 0.
- `rg -n "\.claude/.*/runs|/Users/.*/\.claude/" plugins/*/commands/*.md` returns empty.

## Done Criteria

- 4.2 acceptance met: tooling scripts and comments are consistent with OpenSpec runtime path expectations.
