---
name: tpd-thought-synthesizer
description: |
  [Trigger] This skill runs when boundary exploration and model thought artifacts are ready for consolidation.
  [Output] It produces a unified synthesis artifact for Thinking handoff.
  [Skip] It does not run when exploration evidence files are absent.
  [Ask] It asks for `depth` when expected synthesis granularity is unclear.
  [Resource Usage] Use `scripts/run-tpd-thought-synthesizer.ts` and `references/`.
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
- `${run_dir}/explore-*.json` (at least one)
- `${run_dir}/codex-thought.md` (optional)
- `${run_dir}/gemini-thought.md` (optional)
- `depth` argument

## Outputs
- `${run_dir}/synthesis.md`

## Execution Flow
1. Check synthesis branch in `references/decision-tree.md`.
2. Run `scripts/run-tpd-thought-synthesizer.ts` to validate depth and evidence files.
3. Merge constraints and open questions according to `references/output-contract.md`.
4. Verify depth-specific detail level and unresolved-risk annotations.

## Decision Tree
- Branching and fallback rules are documented in `references/decision-tree.md`.

## Output Contract
- Artifact structure and pass/fail gates are documented in `references/output-contract.md`.

## Runner
- `npx tsx scripts/run-tpd-thought-synthesizer.ts --run-dir <path> --depth light|deep|ultra`

## Verification
- Runner emits `STATUS: SUCCESS` only when all required preconditions pass.
- Runner emits `STATUS: FAILURE` with explicit error details when blocked.
