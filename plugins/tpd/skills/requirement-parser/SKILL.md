---
name: requirement-parser
description: |
  [Trigger] Run at the start of `tpd:plan` after proposal selection.
  [Output] `${run_dir}/requirements.md` with structured functional and non-functional requirements.
  [Skip] Do not run when requirement sources are unavailable.
  [Ask] User clarification is requested by command layer if ambiguities remain.
  [Resource Usage] Use `references/requirements-structure.md`, `references/definition-of-ready.md`, and assets templates.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
---

# requirement-parser

## Purpose

Normalize proposal and thinking inputs into testable requirements for plan synthesis.

## Parameter Policy

- Only `run_dir` is required.
- Requirement source is auto-resolved from OpenSpec chain (proposal and thinking artifacts).

## Inputs

Required source (at least one):

- `${run_dir}/proposal.md`
- `${run_dir}/../proposal.md`
- `${run_dir}/../thinking/handoff.json`

Optional:

- `${run_dir}/clarifications.md`
- `references/requirements-structure.md`
- `references/definition-of-ready.md`

## Outputs

- `${run_dir}/requirements.md`

## Execution Flow

1. Resolve and validate available requirement sources.
2. Extract explicit requirements, assumptions, constraints, and open questions.
3. Normalize into categories:
   - functional requirements
   - non-functional requirements
   - constraints and assumptions
4. Enforce testability with Definition-of-Ready checks.
5. Write `requirements.md` for downstream planning skills.

## Failure Handling

- If no requirement source can be resolved, return blocking status with missing paths.
- If requirements are ambiguous, record ambiguity explicitly instead of guessing.

## Verification

- `requirements.md` exists and is non-empty.
- Requirements are grouped and testable.
- Ambiguities are listed as explicit follow-up items.
