---
name: plan-context-retriever
description: "Retrieve planning context and evidence cache"
allowed-tools:
  - Read
  - Write
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
  - name: proposal_id
    type: string
    required: false
    description: OpenSpec proposal id
---

# plan-context-retriever

## Purpose
Create planning context artifacts and evidence cache for architecture synthesis.

## Outputs
- `${run_dir}/context.md`
- `${run_dir}/meta/evidence-capture.json`

## Steps
1. Read requirements and optional thinking handoff.
2. Retrieve code context with semantic search.
3. Write context summary and evidence capture JSON.

## Verification
- Both output artifacts exist.
