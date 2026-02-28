---
description: "Generate tech stack rules and conventions for .claude/memory/rules/"
argument-hint: "[--run-id <id>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
---

# /context-memory:tech-rules

## Purpose

Analyze the project's tech stack and generate convention rules to `.claude/memory/rules/`. These rules inform Claude's coding style for this project.

## Steps

### Step 1: Setup Workspace

```bash
run_id="${args[--run-id]:-memory-tech-rules-$(date +%Y%m%d-%H%M%S)}"
run_dir="openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

### Step 2: Execute

```
Skill("context-memory:tech-rules-generator", {run_dir: "${run_dir}"})
```

### Step 3: Delivery

Report generated rule files and detected tech stack conventions.
