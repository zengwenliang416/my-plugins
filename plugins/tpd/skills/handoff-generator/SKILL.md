---
name: handoff-generator
description: "Generate handoff artifacts from thinking phase outputs"
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
Create plan-consumable handoff artifacts after thinking phase.

## Inputs
- `${run_dir}/conclusion.md`
- `${run_dir}/synthesis.md`

## Outputs
- `${run_dir}/handoff.md`
- `${run_dir}/handoff.json`
- `${run_dir}/meta/artifact-manifest.json`

## Steps
1. Read conclusion and synthesis artifacts.
2. Build concise markdown handoff.
3. Build machine-readable `handoff.json`.
4. Update artifact manifest.

## Verification
- JSON artifact is valid.
- Manifest references both handoff files.
