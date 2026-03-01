---
name: tpd-codex-cli
description: "This skill invokes Codex for backend-oriented TPD roles, and it is not applicable for frontend-only or UX-only analysis tasks."
allowed-tools:
  - Bash
  - Read
  - Task
arguments:
  - name: role
    type: string
    required: true
    description: constraint-analyst, architect, implementer, or auditor
  - name: mode
    type: string
    required: false
    description: analyze or prototype (required when role=implementer)
  - name: focus
    type: string
    required: false
    description: Optional focus area for architect or auditor roles
  - name: prompt
    type: string
    required: true
    description: Prompt passed to Codex
  - name: run_dir
    type: string
    required: false
    description: Output workspace for artifacts
---

# tpd-codex-cli

## Workflow

1. Run `scripts/run-tpd-codex-cli.ts` to validate role, mode, and prompt payload.
2. Select the correct role branch from `references/decision-tree.md`.
3. Build a deterministic invocation plan and keep sandbox mode read-only.
4. Stream execution output and preserve role-specific artifact mapping.
5. Return contract-compliant metadata from `references/output-contract.md`.

## Decision Tree

1. Validate role against supported backend role set.
2. If role is `implementer`, require `mode` as `analyze` or `prototype`.
3. Route to the matching backend template and output target.
4. Reject frontend-only intent and stop with a routing error.

## References

- `references/decision-tree.md`
- `references/output-contract.md`
- `scripts/run-tpd-codex-cli.ts`
