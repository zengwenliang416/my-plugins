# Decision Tree

## Purpose

Defines role routing and validation for Codex backend execution.

## Branches

1. Argument gate
   - `role` and `prompt` are required.
   - Missing values stop with `INVALID_ARGUMENT`.
2. Role gate
   - Allowed roles: `constraint-analyst`, `architect`, `implementer`, `auditor`.
   - Any other role stops with `INVALID_ROLE`.
3. Mode gate
   - When role is `implementer`, `mode` must be `analyze` or `prototype`.
   - For other roles, `mode` is ignored.
4. Routing gate
   - Backend scope continues with Codex.
   - Frontend-only intent must be routed to `tpd-gemini-cli` and stopped here.
5. Output gate
   - Emit contract JSON for invocation planning and artifact naming.
