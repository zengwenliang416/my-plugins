# Subtask Plan: 7.2 (repository-wide legacy path grep checks)

## Meta

- Subtask ID: 7.2
- Target scope: `plugins/*/commands/*.md`
- Goal: Verify complete removal of legacy runtime path references.
- Date: 2026-02-11

## Objective

Run repository-wide grep checks to confirm:
1. no `.claude/*/runs` references remain in command definitions;
2. no absolute `/Users/.../.claude/` references remain.

## Inputs

- Current plugin command markdown files
- 7.2 test commands from tasks checklist

## Outputs

- Empty grep results demonstrating successful hard-cutover path removal.

## Execution Steps

1. Run `.claude/*/runs` grep check.
2. Run absolute `/Users/.../.claude/` grep check.
3. If any matches found, patch and rerun until empty.

## Risks

- Late edits or examples could accidentally reintroduce forbidden paths.

## Verification

- `rg -n "\.claude/.*/runs" plugins/*/commands/*.md`
- `rg -n "/Users/.*/\.claude/" plugins/*/commands/*.md`

## Done Criteria

- 7.2 marked completed with both grep commands returning no matches.
