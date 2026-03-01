---
name: tpd-context-retriever
description: "This skill retrieves implementation context for dev execution, and it is not applicable when task scope is undefined or run artifacts are absent."
allowed-tools:
  - Read
  - Write
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Dev run directory
  - name: mode
    type: string
    required: false
    description: full or incremental
  - name: base_context
    type: string
    required: false
    description: Existing context artifact path
---

# tpd-context-retriever

## Workflow

1. Run `scripts/run-tpd-context-retriever.ts` for argument and artifact validation.
2. Choose `full` or `incremental` branch from `references/decision-tree.md`.
3. Retrieve only missing evidence required by current task scope.
4. Normalize context evidence and references using `references/output-contract.md`.
5. Return readiness status for downstream implementation steps.

## Decision Tree

1. Validate `mode` as `full` or `incremental`.
2. In `incremental` mode, require readable `base_context`.
3. Build retrieval scope from task artifacts in `run_dir`.
4. Emit `context.md` only after evidence completeness checks pass.

## References

- `references/decision-tree.md`
- `references/output-contract.md`
- `scripts/run-tpd-context-retriever.ts`
