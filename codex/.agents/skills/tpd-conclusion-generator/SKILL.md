---
name: tpd-conclusion-generator
description: "This skill generates final thinking conclusions from synthesis artifacts, and it is not applicable before synthesis output is available."
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Thinking run directory
---

# tpd-conclusion-generator

## Workflow

1. Run `scripts/run-tpd-conclusion-generator.ts` to validate required thinking artifacts.
2. Apply branch rules in `references/decision-tree.md` for clarifications and open questions.
3. Consolidate stable constraints, risks, and success criteria.
4. Emit outputs according to `references/output-contract.md`.
5. Return status and any unresolved planning questions.

## Decision Tree

1. Require `synthesis.md` and stop if missing.
2. Include `clarifications.md` only when present.
3. Route unresolved items into an explicit open-question set.
4. Emit `conclusion.md` only when mandatory sections are complete.

## References

- `references/decision-tree.md`
- `references/output-contract.md`
- `scripts/run-tpd-conclusion-generator.ts`
