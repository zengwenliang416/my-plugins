---
name: tpd-complexity-analyzer
description: "This skill scores requirement complexity and suggests thinking depth, and it is not applicable when depth is explicitly fixed by user policy."
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Thinking run directory
---

# tpd-complexity-analyzer

## Workflow

1. Run `scripts/run-tpd-complexity-analyzer.ts` to validate inputs and score signals.
2. Apply scoring and routing rules in `references/decision-tree.md`.
3. Map score to depth recommendation deterministically.
4. Format outputs using `references/output-contract.md`.
5. Return recommendation and confidence boundary for next phase.

## Decision Tree

1. Validate that `input.md` exists in the target run directory.
2. Compute deterministic score from ambiguity, scope, and risk signals.
3. Route to `light`, `deep`, or `ultra` depth based on score interval.
4. Mark confirmation-required range when score falls in boundary interval.

## References

- `references/decision-tree.md`
- `references/output-contract.md`
- `scripts/run-tpd-complexity-analyzer.ts`
