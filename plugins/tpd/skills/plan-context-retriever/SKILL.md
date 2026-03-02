---
name: plan-context-retriever
description: |
  [Trigger] Run in `tpd:plan` after requirements parsing.
  [Output] `${run_dir}/context.md` and `${run_dir}/meta/evidence-capture.json`.
  [Skip] Do not run when requirement inputs are unavailable.
  [Ask] No direct user interaction in this skill.
  [Resource Usage] Use retrieval references, evidence rules, and context templates.
allowed-tools:
  - Read
  - Write
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
---

# plan-context-retriever

## Purpose

Create planning context and evidence capture artifacts for architecture synthesis.

## Parameter Policy

- Only `run_dir` is required.
- Proposal linkage is inferred from directory context.

## Inputs

- `${run_dir}/requirements.md`
- optional thinking handoff artifacts
- retrieval strategy references

## Outputs

- `${run_dir}/context.md`
- `${run_dir}/meta/evidence-capture.json`

## Execution Flow

1. Validate requirements input.
2. Reuse thinking evidence when available.
3. Retrieve additional repository context.
4. Write context summary and evidence capture JSON.

## Failure Handling

- Missing requirements -> blocking failure.
- Partial evidence -> keep output and mark gaps.

## Verification

- Both output files exist and are non-empty.
- Evidence JSON is valid and references source paths.
