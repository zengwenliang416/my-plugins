---
name: complexity-analyzer
description: |
  [Trigger] Run at the beginning of `tpd:thinking` to route depth.
  [Output] `${run_dir}/complexity-analysis.md` with score, depth recommendation, and rationale.
  [Skip] Never skipped in thinking workflow.
  [Ask] No direct user question inside this skill; command layer handles Hard Stop.
  [Resource Usage] Use `references/scoring-rules.md` and `references/keyword-triggers.md`.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Thinking run directory
---

# complexity-analyzer

## Purpose

Score request complexity and recommend thinking depth (`light`, `deep`, or `ultra`).

## Inputs

- `${run_dir}/input.md`
- `references/scoring-rules.md`
- `references/keyword-triggers.md`

## Outputs

- `${run_dir}/complexity-analysis.md`

## Execution Flow

1. Validate `${run_dir}/input.md` exists and is non-empty.
2. Extract complexity signals (scope size, ambiguity, integration risk, security/perf sensitivity).
3. Score dimensions using `references/scoring-rules.md`.
4. Map total score to depth recommendation:
   - low -> `light`
   - medium -> `deep`
   - high/critical -> `ultra`
5. Write `complexity-analysis.md` with:
   - numeric score
   - per-dimension reasoning
   - recommended depth
   - confidence and known unknowns

## Failure Handling

- If input is missing, write a blocking note to `complexity-analysis.md` and return failure context.
- Do not infer depth without explicit evidence from input.

## Verification

- Output includes numeric score and one depth recommendation.
- Rationale references concrete signals from `input.md`.
- File exists and is non-empty.
