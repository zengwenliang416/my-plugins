---
name: plan-synthesizer
description: |
  [Trigger] Run near the end of `tpd:plan` after architecture/tasks/risks are available.
  [Output] `${run_dir}/plan.md`, `${run_dir}/decision-log.md`, `${run_dir}/timeline.md`.
  [Skip] Do not run when any core planning artifact is missing.
  [Ask] No direct user interaction in this skill; unresolved decisions are recorded.
  [Resource Usage] Use templates and references in this skill directory.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
---

# plan-synthesizer

## Purpose

Assemble final execution plan artifacts consumed by `tpd:dev`.

## Parameter Policy

- Only `run_dir` is required.
- `proposal_id` is inferred from path context when needed.

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

1. Validate required planning artifacts.
2. Merge scope, sequence, constraints, risks, and verification strategy.
3. Capture unresolved decisions in `decision-log.md`.
4. Generate timeline and final plan.

## Failure Handling

- Missing inputs -> blocking failure.
- Conflicts without resolution -> keep outputs with explicit blockers.

## Verification

- All outputs exist and are non-empty.
- `plan.md` includes scope, order, and verification strategy.
- `decision-log.md` contains unresolved blockers when present.
