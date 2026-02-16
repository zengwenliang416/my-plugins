---
name: gemini-cli
description: |
  Gemini wrapper skill for documentation generation, style analysis, and API extraction.
  [Trigger] Agent or skill needs Gemini model for doc-gen/style/api tasks.
  [Output] Model response via codeagent-wrapper + optional ${run_dir}/gemini-${role}.log
  [Skip] When task can be handled by Claude inline without external model.
  [Ask] Which role to use (doc-generator, style-analyzer, api-extractor) if not specified.
allowed-tools:
  - Bash
  - Read
  - Write
arguments:
  - name: role
    type: string
    required: true
    description: doc-generator, style-analyzer, or api-extractor
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
    description: Existing Gemini session id for multi-turn
---

# gemini-cli

## Purpose

Call `scripts/invoke-gemini.ts` with role-routed prompts for context-memory workflows.

## Roles

- `doc-generator`: Documentation generation, CLAUDE.md synthesis, README content
- `style-analyzer`: Design token extraction, style pattern detection
- `api-extractor`: OpenAPI/Swagger spec generation from code

## Steps

1. Validate role is one of `doc-generator`, `style-analyzer`, `api-extractor`.
2. Build invocation arguments from skill inputs.
3. Execute `npx tsx scripts/invoke-gemini.ts --role ${role} --prompt "${prompt}" [--workdir ${run_dir}] [--session ${session_id}]`.
4. Capture result, session id, and error state.
5. Write execution log under `${run_dir}/gemini-${role}.log` if `run_dir` provided.

## Verification

- Command exits successfully or returns structured error.
- Session id is retained for follow-up calls when available.
