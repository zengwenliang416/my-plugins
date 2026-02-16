---
name: code-implementer
description: "Refactor prototype diffs into reviewed implementation and summarize changes"
allowed-tools:
  - Read
  - Write
  - Edit
  - Skill
  - LSP
arguments:
  - name: run_dir
    type: string
    required: true
    description: Dev run directory
  - name: constraints_ref
    type: string
    required: false
    description: Path to constraints artifact
  - name: pbt_ref
    type: string
    required: false
    description: Path to test requirement artifact
---

# code-implementer

## Purpose
Turn prototype diffs into implementation-ready changes and produce a constrained change summary.

## Inputs
- `${run_dir}/prototype-codex.diff` (optional)
- `${run_dir}/prototype-gemini.diff` (optional)
- `${constraints_ref}` (optional)
- `${pbt_ref}` (optional)

## Outputs
- `${run_dir}/changes.md`
- Project code updates within approved task scope

## Steps
1. Verify at least one prototype diff exists.
2. Refactor via `tpd:codex-cli` and `tpd:gemini-cli` guidance when needed.
3. Apply approved diff chunks with `scripts/apply-diff.ts`.
4. Run symbol or reference checks with LSP for affected files.
5. Write `changes.md` with files changed, rationale, and test implications.

## Verification
- `changes.md` exists and lists changed files.
- Changes align with task scope and constraints.
