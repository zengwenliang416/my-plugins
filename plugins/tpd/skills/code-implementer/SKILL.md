---
name: code-implementer
description: |
  [Trigger] Run in `tpd:dev` after prototype and audit artifacts are available.
  [Output] Reviewed code updates plus `${run_dir}/changes.md`.
  [Skip] Do not run when no prototype diff is available.
  [Ask] No direct user interaction in this skill.
  [Resource Usage] Use refactoring references, templates, and `scripts/apply-diff.ts`.
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
---

# code-implementer

## Purpose

Refactor prototype diffs into production-ready implementation within approved scope.

## Parameter Policy

- Only `run_dir` is required.
- Constraints and PBT references are auto-resolved from plan artifacts.

## Inputs

- `${run_dir}/prototype-codex.diff` (optional)
- `${run_dir}/prototype-gemini.diff` (optional)
- plan constraints/PBT artifacts when available
- audit artifacts when available

## Outputs

- `${run_dir}/changes.md`
- reviewed code updates within approved scope

## Execution Flow

1. Verify at least one prototype diff exists.
2. Validate scope boundaries against `tasks-scope.md` and plan constraints.
3. Apply approved diff chunks with `scripts/apply-diff.ts`.
4. Refactor for readability and safety.
5. Run LSP checks for impacted files.
6. Write `changes.md` with changed files, rationale, and risks.

## Failure Handling

- No prototype diff -> blocking failure.
- Unsafe/out-of-scope chunk -> reject and record reason.

## Verification

- `changes.md` exists and is non-empty.
- File list in summary matches actual touched files.
- Changes stay inside approved minimal scope.
