---
name: thought-synthesizer
description: |
  [Trigger] Run after boundary exploration and optional model thought generation in `tpd:thinking`.
  [Output] `${run_dir}/synthesis.md` as the canonical thinking synthesis.
  [Skip] Not skipped; behavior varies by `depth`.
  [Ask] No user interaction in this skill; unresolved decisions are surfaced for command-level Hard Stop.
  [Resource Usage] Use `references/synthesis-strategies.md`, `references/conflict-resolution.md`, and `assets/synthesis.template.md`.
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

Combine boundary evidence and model findings into one decision-ready synthesis artifact.

## Inputs

- `${run_dir}/explore-*.json` (required)
- `${run_dir}/codex-thought.md` (optional for `light`, expected for `deep|ultra`)
- `${run_dir}/gemini-thought.md` (optional for `light`, expected for `deep|ultra`)
- `references/synthesis-strategies.md`
- `references/conflict-resolution.md`

## Outputs

- `${run_dir}/synthesis.md`

## Execution Flow

1. Load all available boundary artifacts and normalize key facts.
2. Merge constraints, risks, dependencies, and success criteria across boundaries.
3. For `deep|ultra`, integrate model thought artifacts and resolve overlaps/conflicts.
4. Classify results into:
   - hard constraints
   - soft constraints
   - risks
   - open questions
5. Write `synthesis.md` using `assets/synthesis.template.md` structure.

## Failure Handling

- If no `explore-*.json` exists, return blocking failure and write missing-input note.
- If one model artifact is missing in `deep|ultra`, continue with available evidence and record coverage gap.

## Verification

- `synthesis.md` exists and is non-empty.
- Document includes hard constraints, soft constraints, risks, and open questions.
- Every critical conclusion references at least one input artifact.
