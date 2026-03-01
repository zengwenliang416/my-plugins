# Decision Tree

## Entry Gate
- Require all planning artifacts: `architecture.md`, `constraints.md`, `tasks.md`, `risks.md`, `pbt.md`.

## Branches
1. **Any input missing** -> `STATUS: FAILURE` with exact file list.
2. **All inputs present** -> build `plan.md`, `decision-log.md`, `timeline.md`.
3. **Task without verification criteria detected** -> keep generation but mark item in decision log.
4. **Critical unresolved risk detected** -> keep generation and escalate in plan summary.

## Exit Criteria
- **Success:** final plan bundle is complete and cross-referenced.
- **Failure:** mandatory planning input is incomplete.
