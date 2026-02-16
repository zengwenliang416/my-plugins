---
name: plan-synthesizer
description: "Assemble final execution plan from architecture, tasks, risks, and constraints"
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
Generate final plan documents consumed by dev phase.

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

## Steps
1. Merge planning artifacts.
2. Ensure each task has verification criteria.
3. Capture unresolved decisions in `decision-log.md`.
4. Write timeline and final plan.

## Verification
- `plan.md` includes scope, sequence, and verification strategy.
