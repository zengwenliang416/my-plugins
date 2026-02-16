---
name: thought-synthesizer
description: "Synthesize boundary exploration and model constraints into unified thinking output"
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Thinking run directory
  - name: depth
    type: string
    required: true
    description: light, deep, or ultra
---

# thought-synthesizer

## Purpose
Combine exploration and model outputs into a consolidated constraint set.

## Inputs
- `${run_dir}/explore-*.json`
- `${run_dir}/codex-thought.md` (optional)
- `${run_dir}/gemini-thought.md` (optional)

## Outputs
- `${run_dir}/synthesis.md`

## Steps
1. Aggregate constraints, risks, and dependencies across boundaries.
2. Merge model-specific findings and deduplicate overlaps.
3. Extract success criteria and open questions.
4. Write `synthesis.md`.

## Verification
- Output includes hard constraints, soft constraints, risks, and open questions.
