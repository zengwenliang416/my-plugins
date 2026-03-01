---
name: tpd-plan-context-retriever
description: |
  [Trigger] This skill runs when Plan phase needs context and evidence capture.
  [Output] It produces a planning context summary and evidence-capture JSON.
  [Skip] It does not run when requirements input is not available.
  [Ask] It asks for `proposal_id` only when proposal linkage is required for traceability.
  [Resource Usage] Use `scripts/run-tpd-plan-context-retriever.ts` and `references/`.
allowed-tools:
  - Read
  - Write
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
  - name: proposal_id
    type: string
    required: false
    description: OpenSpec proposal id
---

# plan-context-retriever

## Purpose
Create planning context artifacts and evidence cache for architecture synthesis.

## Inputs
- `${run_dir}/requirements.md`
- `${run_dir}/../thinking/handoff.json` (optional)
- `proposal_id` argument (optional)

## Outputs
- `${run_dir}/context.md`
- `${run_dir}/meta/evidence-capture.json`

## Execution Flow
1. Resolve branch conditions with `references/decision-tree.md`.
2. Run `scripts/run-tpd-plan-context-retriever.ts` to verify context prerequisites.
3. Retrieve missing repository context and evidence links.
4. Produce outputs that comply with `references/output-contract.md`.

## Decision Tree
- Branching and fallback rules are documented in `references/decision-tree.md`.

## Output Contract
- Artifact structure and pass/fail gates are documented in `references/output-contract.md`.

## Runner
- `npx tsx scripts/run-tpd-plan-context-retriever.ts --run-dir <path> [--proposal-id <id>]`

## Verification
- Runner emits `STATUS: SUCCESS` only when all required preconditions pass.
- Runner emits `STATUS: FAILURE` with explicit error details when blocked.
