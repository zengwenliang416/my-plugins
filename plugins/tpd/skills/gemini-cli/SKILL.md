---
name: gemini-cli
description: |
  [Trigger] Use when TPD needs Gemini-backed frontend/UX analysis.
  [Output] Raw Gemini CLI output returned to caller.
  [Skip] Skip for backend-only architecture/API tasks (use codex-cli).
  [Ask] No user interaction; called by command/agent workflows.
  [Resource Usage] Use `scripts/invoke-gemini.ts` and role references.
allowed-tools:
  - Bash
  - Read
arguments:
  - name: role
    type: string
    required: true
    description: "constraint-analyst, architect, implementer, or auditor"
  - name: prompt
    type: string
    required: true
    description: "Prompt passed to Gemini"
---

# gemini-cli

## Purpose

Invoke Gemini CLI for frontend/UX reasoning and return full output to caller.

## Parameter Policy

- Only `role` and `prompt` are required.
- Mode/focus/workdir are inferred by caller context when needed.

## Script Entry

```bash
npx tsx scripts/invoke-gemini.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"]
```

## Execution Flow

1. Validate `role` and non-empty `prompt`.
2. Build role-scoped prompt framing from references.
3. Execute `scripts/invoke-gemini.ts`.
4. Return full CLI output without truncation.

## Output Ownership

- This skill does not write role artifacts directly.
- Caller must persist output and verify files.

## Failure Handling

- Invalid role/prompt -> fail fast.
- Script execution error -> return stderr summary.
- Empty output -> fail and request retry diagnostics.

## Constraints

Required:

- Must call `scripts/invoke-gemini.ts`.
- Must return raw CLI output.

Forbidden:

- Do not swallow output.
- Do not apply code changes directly from this skill.
- Do not infer unsupported roles.
