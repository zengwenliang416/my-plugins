---
name: conclusion-generator
description: |
  [Trigger] Run after synthesis is complete in `tpd:thinking`.
  [Output] `${run_dir}/conclusion.md` for plan handoff.
  [Skip] Do not run when `${run_dir}/synthesis.md` is missing.
  [Ask] No direct user question in this skill.
  [Resource Usage] Use `references/conclusion-templates.md`, `references/output-formats.md`, and `assets/final-conclusion.template.md`.
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Thinking run directory
---

# conclusion-generator

## Purpose

Generate the final thinking conclusion with stable constraints, principal risks, and plan-phase action focus.

## Inputs

- `${run_dir}/synthesis.md` (required)
- `${run_dir}/clarifications.md` (optional)
- `references/conclusion-templates.md`

## Outputs

- `${run_dir}/conclusion.md`

## Execution Flow

1. Validate `synthesis.md` exists and is non-empty.
2. Extract confirmed constraints, risk hotspots, and decision priorities.
3. Merge optional user clarifications when present.
4. Produce concise plan-facing sections:
   - confirmed constraints
   - key risks and mitigation direction
   - success criteria
   - unresolved decisions (if any)
5. Write `conclusion.md` using `assets/final-conclusion.template.md` conventions.

## Failure Handling

- If `synthesis.md` is missing, return blocking status with remediation note.
- Do not fabricate constraints not present in source artifacts.

## Verification

- `conclusion.md` exists and is non-empty.
- Includes sections for constraints, risks, and success criteria.
- Unresolved decisions are explicit and actionable.
