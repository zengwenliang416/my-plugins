---
name: gemini-cli
description: "Gemini wrapper skill for frontend analysis, planning, implementation, and auditing"
allowed-tools:
  - Bash
  - Read
  - Write
arguments:
  - name: role
    type: string
    required: true
    description: constraint, architect, implementer, or auditor
  - name: mode
    type: string
    required: false
    description: analyze or prototype (required when role=implementer)
  - name: focus
    type: string
    required: false
    description: Optional focus for architect or auditor roles
  - name: prompt
    type: string
    required: true
    description: Prompt passed to Gemini wrapper
  - name: run_dir
    type: string
    required: false
    description: Output workspace for artifacts
  - name: session_id
    type: string
    required: false
    description: Existing Gemini session id
---

# gemini-cli

## Purpose
Call `scripts/invoke-gemini.ts` with a controlled prompt and return parsed output.

## Steps
1. Validate role:
   - must be one of `constraint`, `architect`, `implementer`, `auditor`.
2. Validate mode:
   - required when `role=implementer`,
   - optional and ignored for other roles.
3. Build invocation arguments from skill inputs.
4. Execute wrapper script in project root.
5. Capture result, session id, and error state.
6. Write optional execution log under `${run_dir}` if provided.

## Verification
- Command exits successfully or returns structured error.
- Session id is retained for follow-up calls when available.
