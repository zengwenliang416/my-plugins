---
description: "Generate OpenAPI/Swagger documentation from code"
argument-hint: "[--run-id <id>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
---

# /context-memory:swagger

## Purpose

Detect API endpoints in the codebase and generate OpenAPI/Swagger documentation.

## Steps

### Step 1: Setup Workspace

```bash
run_id="${args[--run-id]:-memory-swagger-$(date +%Y%m%d-%H%M%S)}"
run_dir="openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

### Step 2: Execute

```
Skill("context-memory:swagger-generator", {run_dir: "${run_dir}"})
```

### Step 3: Delivery

Report generated OpenAPI spec location and endpoint summary.
