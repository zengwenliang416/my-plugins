---
name: tpd-task-decomposer
description: |
  [Trigger] This skill runs when architecture and constraints are ready for executable task decomposition.
  [Output] It produces tasks and property-based testing targets.
  [Skip] It does not run when architecture or constraints artifacts are missing.
  [Ask] It asks for `task_type` only when decomposition scope cannot be inferred.
  [Resource Usage] Use `scripts/run-tpd-task-decomposer.ts` and `references/`.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
  - name: task_type
    type: string
    required: false
    description: fullstack, frontend, or backend
---

# task-decomposer

## Purpose
Create execution tasks and property-based verification targets.

## Inputs
- `${run_dir}/architecture.md`
- `${run_dir}/constraints.md`
- `task_type` argument (optional, default: fullstack)

## Outputs
- `${run_dir}/tasks.md`
- `${run_dir}/pbt.md`

## Execution Flow
1. Resolve decomposition branch via `references/decision-tree.md`.
2. Run `scripts/run-tpd-task-decomposer.ts` for input and parameter validation.
3. Decompose tasks and map PBT targets under `references/output-contract.md`.
4. Validate dependency ordering and acceptance criteria coverage.

## Decision Tree
- Branching and fallback rules are documented in `references/decision-tree.md`.

## Output Contract
- Artifact structure and pass/fail gates are documented in `references/output-contract.md`.

## Runner
- `npx tsx scripts/run-tpd-task-decomposer.ts --run-dir <path> [--task-type fullstack|frontend|backend]`

## Verification
- Runner emits `STATUS: SUCCESS` only when all required preconditions pass.
- Runner emits `STATUS: FAILURE` with explicit error details when blocked.
