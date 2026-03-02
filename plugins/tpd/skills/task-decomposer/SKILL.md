---
name: task-decomposer
description: |
  [Trigger] Run in `tpd:plan` after architecture and constraints are ready.
  [Output] `${run_dir}/tasks.md` and `${run_dir}/pbt.md`.
  [Skip] Do not run when `${run_dir}/architecture.md` or `${run_dir}/constraints.md` is missing.
  [Ask] No direct user interaction in this skill.
  [Resource Usage] Use decomposition references and templates in this skill directory.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
---

# task-decomposer

## Purpose

Convert architecture into executable task units and property-based verification targets.

## Parameter Policy

- Only `run_dir` is required.
- Default task type is fixed to `fullstack`.
- No mode switching via parameters.

## Inputs

- `${run_dir}/architecture.md`
- `${run_dir}/constraints.md`

## Outputs

- `${run_dir}/tasks.md`
- `${run_dir}/pbt.md`

## Execution Flow

1. Use fullstack decomposition baseline by default.
2. Split architecture into independently verifiable tasks.
3. Annotate dependency order and acceptance criteria.
4. Define PBT checks mapped to constraints.
5. Write `tasks.md` and `pbt.md`.

## Failure Handling

- Missing required inputs -> blocking failure.
- Critical constraints without test mapping -> verification failure.
- If architecture coverage is partial, record decomposition gaps explicitly.

## Verification

- `tasks.md` and `pbt.md` exist and are non-empty.
- Every task has acceptance criteria.
- Critical constraints are covered by PBT mappings.
