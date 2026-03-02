---
name: handoff-generator
description: |
  [Trigger] Run at the end of `tpd:thinking` after conclusion is generated.
  [Output] `${run_dir}/handoff.md`, `${run_dir}/handoff.json`, and `${run_dir}/meta/artifact-manifest.json`.
  [Skip] Do not run when `conclusion.md` or `synthesis.md` is missing.
  [Ask] No direct user interaction by default; proposal linkage is inferred from run directory.
  [Resource Usage] Use handoff and OpenSpec templates in this skill directory.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Thinking run directory
---

# handoff-generator

## Purpose

Generate plan-consumable handoff artifacts from thinking outputs.

## Parameter Policy

- Only `run_dir` is required.
- `proposal_id` is inferred from the OpenSpec path context (`openspec/changes/<proposal_id>/thinking`).
- Caller may still pass explicit proposal linkage metadata, but it is not required.

## Inputs

Required:

- `${run_dir}/conclusion.md`
- `${run_dir}/synthesis.md`

Optional:

- proposal linkage hints provided by caller

## Outputs

- `${run_dir}/handoff.md`
- `${run_dir}/handoff.json`
- `${run_dir}/meta/artifact-manifest.json`

## Execution Flow

1. Validate required thinking artifacts and infer proposal linkage.
2. Build concise markdown handoff summary for human review.
3. Build machine-readable `handoff.json` for downstream tooling.
4. Update artifact manifest with deterministic artifact entries.

## Failure Handling

- Missing required inputs -> blocking failure with explicit missing paths.
- Failed proposal linkage inference -> fail with remediation note.
- Invalid JSON output -> fail fast and regenerate before returning success.

## Verification

- `handoff.md` exists and is non-empty.
- `handoff.json` is valid JSON and includes key decision fields.
- Manifest references both handoff artifacts.
