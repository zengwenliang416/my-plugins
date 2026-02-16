---
name: conclusion-generator
description: "Generate thinking phase conclusion from synthesis and constraints"
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Thinking run directory
---

# conclusion-generator

## Purpose
Produce final thinking conclusion for plan handoff.

## Inputs
- `${run_dir}/synthesis.md`
- Optional `${run_dir}/clarifications.md`

## Outputs
- `${run_dir}/conclusion.md`

## Steps
1. Read synthesis and optional clarifications.
2. Summarize stable constraints, risks, and success criteria.
3. Record open questions that need planning decisions.
4. Write `conclusion.md`.

## Verification
- Output includes constraints, risks, and success criteria sections.
