---
name: tpd-plan-synthesizer
description: |
  [Trigger] This skill runs when architecture, tasks, risks, and constraints are ready for final plan assembly.
  [Output] It produces the final plan, decision log, and timeline artifacts.
  [Skip] It does not run when any required planning artifact is missing.
  [Ask] It asks for `proposal_id` when decision traceability must be attached.
  [Resource Usage] Use `scripts/run-tpd-plan-synthesizer.ts` and `references/`.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
  - name: proposal_id
    type: string
    required: false
    description: OpenSpec proposal id
---

# plan-synthesizer

## Purpose
Generate final plan documents consumed by Dev phase.

## Inputs
- `${run_dir}/architecture.md`
- `${run_dir}/constraints.md`
- `${run_dir}/tasks.md`
- `${run_dir}/risks.md`
- `${run_dir}/pbt.md`

## Outputs
- `${run_dir}/plan.md`
- `${run_dir}/decision-log.md`
- `${run_dir}/timeline.md`

## Execution Flow
1. Check required inputs through `references/decision-tree.md`.
2. Run `scripts/run-tpd-plan-synthesizer.ts` to enforce preflight gates.
3. Assemble plan artifacts under `references/output-contract.md`.
4. Verify task sequencing, unresolved decisions, and verification coverage.

## Decision Tree
- Branching and fallback rules are documented in `references/decision-tree.md`.

## Output Contract
- Artifact structure and pass/fail gates are documented in `references/output-contract.md`.

## Runner
- `npx tsx scripts/run-tpd-plan-synthesizer.ts --run-dir <path> [--proposal-id <id>]`

## Verification
- Runner emits `STATUS: SUCCESS` only when all required preconditions pass.
- Runner emits `STATUS: FAILURE` with explicit error details when blocked.
