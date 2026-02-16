---
name: task-decomposer
description: "Decompose architecture into executable tasks and PBT checks"
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

## Outputs
- `${run_dir}/tasks.md`
- `${run_dir}/pbt.md`

## Steps
1. Split architecture into independently verifiable tasks.
2. Annotate dependencies and recommended order.
3. Define property-based checks for critical behaviors.
4. Write `tasks.md` and `pbt.md`.

## Verification
- Each task has acceptance criteria.
- `pbt.md` maps tests to constraints.
