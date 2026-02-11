# Subtask Plan: 5.2 (cleanup audit report)

## Meta

- Subtask ID: 5.2
- Target file: `openspec/changes/refactor-plugin-artifact-governance-with-openspec/plan/cleanup-report.md`
- Goal: Record before/after cleanup metrics and reclaimed size.
- Date: 2026-02-11

## Objective

Produce an auditable cleanup report capturing:
1. pre-cleanup inventory metrics;
2. executed cleanup actions;
3. post-cleanup verification metrics and reclaimed storage.

## Inputs

- Dry-run output before cleanup (`roots=7`, `runs=43`, `kb=57584`)
- Cleanup execution logs
- Post-cleanup dry-run output (`roots=0`, `runs=0`, `kb=0`)

## Outputs

- `cleanup-report.md` with before/after counts, reclaimed size, and command evidence.

## Execution Steps

1. Compile command log summary (dry-run before, execute, dry-run after).
2. Calculate reclaimed size and delta counts.
3. Write structured markdown report with timestamp and safety scope.
4. Ensure report references only project-local `.claude/*/runs` cleanup.

## Risks

- Missing pre-cleanup metrics would weaken audit quality; use captured dry-run output from execution history.
- Need to clearly explain execute rerun semantics after first cleanup pass.

## Verification

- Report contains before/after roots, run dirs, disk usage (KB), reclaimed size.
- Report includes exact commands used and observed summaries.

## Done Criteria

- 5.2 acceptance met: cleanup report exists with complete before/after and reclaimed-size metrics.
