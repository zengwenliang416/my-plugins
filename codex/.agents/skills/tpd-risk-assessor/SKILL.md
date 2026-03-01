---
name: tpd-risk-assessor
description: |
  [Trigger] This skill runs when Plan artifacts are ready for risk scoring and mitigation planning.
  [Output] It produces a risk register with severity, likelihood, and mitigations.
  [Skip] It does not run when architecture, tasks, or constraints artifacts are missing.
  [Ask] It asks for owner assignment when high-severity risks have no clear owner.
  [Resource Usage] Use `scripts/run-tpd-risk-assessor.ts` and `references/`.
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

## Execution Flow
1. Validate baseline planning artifacts using `references/decision-tree.md`.
2. Run `scripts/run-tpd-risk-assessor.ts` to ensure risk-analysis prerequisites.
3. Score and classify risks following `references/output-contract.md`.
4. Ensure every high-risk item has mitigation, trigger, and owner fields.

## Decision Tree
- Branching and fallback rules are documented in `references/decision-tree.md`.

## Output Contract
- Artifact structure and pass/fail gates are documented in `references/output-contract.md`.

## Runner
- `npx tsx scripts/run-tpd-risk-assessor.ts --run-dir <path>`

## Verification
- Runner emits `STATUS: SUCCESS` only when all required preconditions pass.
- Runner emits `STATUS: FAILURE` with explicit error details when blocked.
