---
name: architecture-analyzer
description: |
  [Trigger] Run in `tpd:plan` after codex/gemini architecture drafts are available.
  [Output] `${run_dir}/architecture.md` and `${run_dir}/constraints.md`.
  [Skip] Do not run when required planner outputs are missing.
  [Ask] Unresolved conflicts are surfaced for command-layer decision.
  [Resource Usage] Use architecture references and templates under this skill directory.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
---

# architecture-analyzer

## Purpose

Integrate multi-model planning outputs into one canonical architecture and constraint set.

## Parameter Policy

- Only `run_dir` is required.
- Default task type is fixed to `fullstack`.
- No mode switching via parameters.

## Inputs

- `${run_dir}/requirements.md`
- `${run_dir}/context.md`
- `${run_dir}/codex-plan.md` (expected for fullstack)
- `${run_dir}/gemini-plan.md` (expected for fullstack)

## Outputs

- `${run_dir}/architecture.md`
- `${run_dir}/constraints.md`

## Execution Flow

1. Use fullstack baseline by default.
2. Validate planner artifacts required by fullstack baseline.
3. Extract architecture decisions, interfaces, and dependencies.
4. Merge aligned decisions and mark unresolved conflicts explicitly.
5. Write integrated outputs.

## Failure Handling

- Missing mandatory planner inputs -> blocking failure with missing-file list.
- If one model artifact is missing, continue with available side and record coverage gap.
- Major model conflicts -> output with unresolved decision markers.

## Verification

- Both output files exist and are non-empty.
- `constraints.md` contains hard constraints.
- `architecture.md` records fullstack baseline and any fallback decisions.
