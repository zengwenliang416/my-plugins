---
name: tpd-requirement-parser
description: |
  [Trigger] This skill runs when Plan phase needs normalized requirements from proposal or handoff sources.
  [Output] It produces a structured requirements artifact for downstream planning.
  [Skip] It does not run when no requirement source is available.
  [Ask] It asks for missing scope assumptions only when sources are ambiguous.
  [Resource Usage] Use `scripts/run-tpd-requirement-parser.ts` and `references/`.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
---

# requirement-parser

## Purpose
Extract functional and non-functional requirements for Plan phase.

## Inputs
- One of requirement sources: `${run_dir}/input.md`, `${run_dir}/proposal.md`, `${run_dir}/../proposal.md`, `${run_dir}/../thinking/handoff.json`
- `${run_dir}/clarifications.md` (optional)

## Outputs
- `${run_dir}/requirements.md`

## Execution Flow
1. Identify available requirement source with `references/decision-tree.md`.
2. Run `scripts/run-tpd-requirement-parser.ts` to validate source availability.
3. Normalize requirements according to `references/output-contract.md`.
4. Check traceability between extracted requirements and source evidence.

## Decision Tree
- Branching and fallback rules are documented in `references/decision-tree.md`.

## Output Contract
- Artifact structure and pass/fail gates are documented in `references/output-contract.md`.

## Runner
- `npx tsx scripts/run-tpd-requirement-parser.ts --run-dir <path>`

## Verification
- Runner emits `STATUS: SUCCESS` only when all required preconditions pass.
- Runner emits `STATUS: FAILURE` with explicit error details when blocked.
