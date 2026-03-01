---
name: tpd-handoff-generator
description: |
  [Trigger] This skill runs when Thinking artifacts are ready for Plan handoff.
  [Output] It produces handoff artifacts and manifest updates for planning.
  [Skip] It does not run when Thinking synthesis or conclusion artifacts are missing.
  [Ask] It asks for `proposal_id` when OpenSpec proposal linkage is missing.
  [Resource Usage] Use `scripts/run-tpd-handoff-generator.ts` and `references/`.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Thinking run directory
  - name: proposal_id
    type: string
    required: true
    description: OpenSpec proposal id
---

# handoff-generator

## Purpose
Create plan-consumable handoff artifacts after Thinking phase.

## Inputs
- `${run_dir}/conclusion.md`
- `${run_dir}/synthesis.md`
- `proposal_id` argument

## Outputs
- `${run_dir}/handoff.md`
- `${run_dir}/handoff.json`
- `${run_dir}/meta/artifact-manifest.json`

## Execution Flow
1. Validate prerequisites with `references/decision-tree.md`.
2. Run `scripts/run-tpd-handoff-generator.ts` to preflight required inputs.
3. Generate handoff artifacts following `references/output-contract.md`.
4. Confirm all output files are consistent and linked in manifest.

## Decision Tree
- Branching and fallback rules are documented in `references/decision-tree.md`.

## Output Contract
- Artifact structure and pass/fail gates are documented in `references/output-contract.md`.

## Runner
- `npx tsx scripts/run-tpd-handoff-generator.ts --run-dir <path> --proposal-id <id>`

## Verification
- Runner emits `STATUS: SUCCESS` only when all required preconditions pass.
- Runner emits `STATUS: FAILURE` with explicit error details when blocked.
