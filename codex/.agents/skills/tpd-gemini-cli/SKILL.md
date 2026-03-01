---
name: tpd-gemini-cli
description: "This skill invokes Gemini for frontend and UX TPD roles, and it is not applicable for backend-only architecture or API analysis."
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
    description: Prompt passed to Gemini
  - name: run_dir
    type: string
    required: false
    description: Output workspace for artifacts
---

# tpd-gemini-cli

## Workflow

1. Run `scripts/run-tpd-gemini-cli.ts` to validate role, mode, and prompt payload.
2. Choose role branch from `references/decision-tree.md`.
3. Build deterministic Gemini invocation metadata and artifact mapping.
4. Stream execution output while preserving calling-skill ownership.
5. Return output metadata following `references/output-contract.md`.

## Decision Tree

1. Validate role against frontend and UX role set.
2. If role is `implementer`, require `mode` as `analyze` or `prototype`.
3. Route to role-specific output artifact naming.
4. Reject backend-only intent and return reroute signal.

## References

- `references/decision-tree.md`
- `references/output-contract.md`
- `scripts/run-tpd-gemini-cli.ts`
