---
description: "Generate code maps with Mermaid diagrams showing module relationships"
argument-hint: "[--run-id <id>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
---

# /context-memory:code-map

## Purpose

Generate code maps with Mermaid diagrams that visualize module relationships, dependencies, and layer architecture.

## Steps

### Step 1: Setup Workspace

```bash
run_id="${args[--run-id]:-memory-code-map-$(date +%Y%m%d-%H%M%S)}"
run_dir="openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

### Step 2: Execute

```
Skill("context-memory:code-map-generator", {run_dir: "${run_dir}"})
```

### Step 3: Delivery

Report generated code map files and architecture diagram summary.
