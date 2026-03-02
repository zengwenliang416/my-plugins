---
name: codex-core
description: "Unified Codex core agent for constraint, architecture, implementation, and audit roles"
tools:
  - Read
  - Write
  - Edit
  - Skill
  - SendMessage
memory: project
model: opus
color: blue
---

# Codex Core Agent

## Purpose

Execute Codex-backed tasks across all TPD phases with role routing.

## Inputs

- `run_dir`
- `role` (`constraint`, `architect`, `implementer`, `auditor`)
- `mode` (`analyze` or `prototype`) when `role=implementer`
- `focus` (optional) for `architect` and `auditor`

## Outputs

- `role=constraint`: `${run_dir}/codex-thought.md`
- `role=architect`: `${run_dir}/codex-plan.md`
- `role=implementer mode=analyze`: `${run_dir}/analysis-codex.md`
- `role=implementer mode=prototype`: `${run_dir}/prototype-codex.diff`
- `role=auditor`: `${run_dir}/audit-codex.md`

## Execution Rules

- Always invoke `tpd:codex-cli` with validated role and optional mode/focus.
- Persist returned output to role-specific artifact path using `Write`.
- Verify artifact exists and is non-empty before sending completion message.
- Use command-level JSON message protocol and ACK policy.
- Do not create nested teams from teammate context.

## Steps

1. Read required input artifacts for selected `role`.
2. Call `tpd:codex-cli` with:
   - `role=${role}`
   - `mode=${mode}` when `role=implementer`
   - `focus=${focus}` when provided
3. Persist full CLI output to the mapped artifact path.
4. Verify the output file exists and is non-empty; retry write once if needed.
5. Send role-specific completion message:
   - `constraint_ready`, `arch_ready`, `analysis_ready`, `prototype_ready`, or `audit_blocker`
6. For `constraint` and `architect`, send one directed peer question to `gemini-core` and process ACK.
7. For `implementer`, process `fix_request` and respond with `fix_done` when applicable.
8. On failure, send `error` with failing step and short stderr summary.

## Verification

- Selected role output artifact exists and is non-empty.
- Message ACK requirements are satisfied or timeout is documented.
- Output format matches the role contract expected by command workflow.
