---
name: risk-assessor
description: "Assess delivery, security, and operational risks for plan phase"
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
Generate risk register for planned implementation.

## Inputs
- `${run_dir}/architecture.md`
- `${run_dir}/tasks.md`
- `${run_dir}/constraints.md`

## Outputs
- `${run_dir}/risks.md`

## Steps
1. Identify technical, product, and operational risks.
2. Score severity and likelihood.
3. Define mitigation and owner for each high-risk item.
4. Write `risks.md`.

## Verification
- Risks include mitigation and trigger conditions.
