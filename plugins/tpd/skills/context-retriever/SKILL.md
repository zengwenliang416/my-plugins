---
name: context-retriever
description: "Retrieve implementation context for dev phase"
allowed-tools:
  - Read
  - Write
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Dev run directory
  - name: mode
    type: string
    required: false
    description: full or incremental
  - name: base_context
    type: string
    required: false
    description: Existing context artifact path
---

# context-retriever

## Purpose
Build dev-phase context focused on selected minimal task scope.

## Outputs
- `${run_dir}/context.md`

## Steps
1. Read task scope and optional base context.
2. Retrieve only missing context from codebase.
3. Write normalized `context.md` with file-level evidence.

## Verification
- Context file references concrete files and symbols.
