---
name: tpd-code-implementer
description: "This skill converts approved prototype diffs into implementation-ready changes, and it is not applicable when no reviewed prototype diff is available."
allowed-tools:
  - Read
  - Write
  - Edit
  - Skill
  - LSP
arguments:
  - name: run_dir
    type: string
    required: true
    description: Dev run directory
  - name: constraints_ref
    type: string
    required: false
    description: Path to constraints artifact
  - name: pbt_ref
    type: string
    required: false
    description: Path to test requirement artifact
---

# tpd-code-implementer

## Workflow

1. Run `scripts/run-tpd-code-implementer.ts` to validate executable scope.
2. Follow `references/decision-tree.md` to choose diff source and merge policy.
3. Apply only approved diff chunks within scope and constraints.
4. Verify affected symbols and test obligations before finalizing.
5. Produce outputs matching `references/output-contract.md`.

## Decision Tree

1. Detect available prototype diffs and stop if none exists.
2. If both diffs exist, prioritize non-conflicting chunks first.
3. Apply constraints and PBT checks before writing summaries.
4. Emit `changes.md` only after scope and verification checks pass.

## References

- `references/decision-tree.md`
- `references/output-contract.md`
- `scripts/run-tpd-code-implementer.ts`
