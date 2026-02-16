---
name: complexity-analyzer
description: "Estimate thinking depth and route to light/deep/ultra"
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
Score request complexity and select recommended thinking depth.

## Inputs
- `${run_dir}/input.md`

## Outputs
- `${run_dir}/complexity-analysis.md`

## Steps
1. Read input request and detect complexity signals.
2. Score complexity across structure, ambiguity, and domain risk.
3. Map score to depth recommendation.
4. Write `complexity-analysis.md` with score and reasoning.

## Verification
- Output includes numeric score and depth recommendation.
