---
name: risk-assessor
description: |
  [Trigger] Run in `tpd:plan` after tasks and constraints are available.
  [Output] `${run_dir}/risks.md` risk register with mitigation guidance.
  [Skip] Do not run when architecture/tasks/constraints inputs are incomplete.
  [Ask] No direct user interaction in this skill.
  [Resource Usage] Use OWASP and risk templates under this skill directory.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
---

# risk-assessor

## Purpose

Assess delivery, security, and operational risks for the current plan.

## Parameter Policy

- Only `run_dir` is required.
- Risk scope is inferred from architecture, constraints, and task decomposition artifacts.

## Inputs

Required:

- `${run_dir}/architecture.md`
- `${run_dir}/tasks.md`
- `${run_dir}/constraints.md`

Optional:

- `${run_dir}/context.md`
- `${run_dir}/requirements.md`

## Outputs

- `${run_dir}/risks.md`

## Execution Flow

1. Enumerate risks across technical, security, product, and operational dimensions.
2. Score each risk by severity and likelihood.
3. Define mitigation, trigger conditions, and ownership for high-risk items.
4. Write normalized risk register to `risks.md`.

## Failure Handling

- Missing required inputs -> blocking failure with file-level diagnostics.
- If a high-risk item has no owner, mark as unresolved critical risk.

## Verification

- `risks.md` exists and is non-empty.
- Each high-risk item includes mitigation and trigger condition.
- Residual unresolved critical risks are explicitly called out.
