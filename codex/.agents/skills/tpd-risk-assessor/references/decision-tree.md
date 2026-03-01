# Decision Tree

## Entry Gate
- Require `architecture.md`, `tasks.md`, and `constraints.md`.

## Branches
1. **Any required input missing** -> `STATUS: FAILURE`.
2. **Inputs complete** -> produce full risk register.
3. **High severity risk without owner** -> keep artifact generation but mark as blocking item.
4. **Security-sensitive path detected** -> raise baseline security risk category explicitly.

## Exit Criteria
- **Success:** risk register covers delivery, security, and operational categories.
- **Failure:** missing mandatory planning artifact.
