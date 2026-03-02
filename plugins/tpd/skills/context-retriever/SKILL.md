---
name: context-retriever
description: |
  [Trigger] Run in `tpd:dev` after minimal task scope selection.
  [Output] `${run_dir}/context.md` with implementation-focused evidence.
  [Skip] Do not run when task scope is missing.
  [Ask] No direct user interaction in this skill.
  [Resource Usage] Use retrieval strategies, templates, and `scripts/retrieve-context.ts`.
allowed-tools:
  - Read
  - Write
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Dev run directory
---

# context-retriever

## Purpose

Build dev-phase context focused on selected minimal task scope.

## Parameter Policy

- Only `run_dir` is required.
- Retrieval mode and base context are auto-detected from existing artifacts.

## Inputs

- `${run_dir}/tasks-scope.md`
- optional existing context artifacts
- retrieval references

## Outputs

- `${run_dir}/context.md`

## Execution Flow

1. Validate task scope and parse target boundaries.
2. Reuse available context artifacts when possible.
3. Retrieve missing evidence via semantic search.
4. Write normalized `context.md`.

## Failure Handling

- Missing task scope -> blocking failure.
- Retrieval gaps -> output with explicit unknowns.

## Verification

- `context.md` exists and is non-empty.
- Evidence references concrete files or symbols.
