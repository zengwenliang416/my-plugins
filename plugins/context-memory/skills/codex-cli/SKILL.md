---
name: codex-cli
description: |
  Codex wrapper skill for code analysis, documentation generation, and quality auditing.
  [Trigger] Agent or skill needs Codex model for analysis/generation/audit tasks.
  [Output] Model response via codeagent-wrapper + optional ${run_dir}/codex-${role}.log
  [Skip] When task can be handled by Claude inline without external model.
  [Ask] Which role to use (analyzer, doc-generator, auditor) if not specified.
allowed-tools:
  - Bash
  - Read
  - Write
arguments:
  - name: role
    type: string
    required: true
    description: analyzer, doc-generator, or auditor
  - name: prompt
    type: string
    required: true
    description: Prompt passed to Codex wrapper
  - name: run_dir
    type: string
    required: false
    description: Output workspace for artifacts
  - name: session_id
    type: string
    required: false
    description: Existing Codex session id for multi-turn
---

# codex-cli

## Purpose

Call `scripts/invoke-codex.ts` with role-routed prompts for context-memory workflows.

## Roles

- `analyzer`: Code structure analysis, module classification, dependency mapping
- `doc-generator`: CLAUDE.md content generation, documentation synthesis
- `auditor`: Quality review, completeness checks, consistency validation

## Steps

1. Validate role is one of `analyzer`, `doc-generator`, `auditor`.
2. Build invocation arguments from skill inputs.
3. Execute `npx tsx scripts/invoke-codex.ts --role ${role} --prompt "${prompt}" [--workdir ${run_dir}] [--session ${session_id}] --sandbox read-only`.
4. Capture result, session id, and error state.
5. Write execution log under `${run_dir}/codex-${role}.log` if `run_dir` provided.

## Verification

- Command exits successfully or returns structured error.
- Session id is retained for follow-up calls when available.
