---
name: architecture-analyzer
description: "Integrate multi-model planning outputs into unified architecture and constraints"
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

# architecture-analyzer

## Purpose
Integrate `codex-plan.md` and `gemini-plan.md` into canonical planning artifacts.

## Inputs
- `${run_dir}/requirements.md`
- `${run_dir}/context.md`
- `${run_dir}/codex-plan.md` (if backend/fullstack)
- `${run_dir}/gemini-plan.md` (if frontend/fullstack)

## Outputs
- `${run_dir}/architecture.md`
- `${run_dir}/constraints.md`

## Steps
1. Validate required planner outputs based on `task_type`.
2. Extract architecture decisions from available planner files.
3. Resolve conflicts and mark unresolved points explicitly.
4. Write `architecture.md` as integrated design.
5. Write `constraints.md` with hard and soft constraints.

## Verification
- Output files exist.
- `constraints.md` includes at least one hard constraint.
