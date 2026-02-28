---
description: "Compact session insights into persistent memory files"
argument-hint: "[--run-id <id>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
---

# /context-memory:compact

## Purpose

Compact the current session's insights, decisions, and patterns into persistent memory files under `.claude/memory/`.

## Steps

### Step 1: Setup Workspace

```bash
run_id="${args[--run-id]:-memory-compact-$(date +%Y%m%d-%H%M%S)}"
run_dir="openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

### Step 2: Execute

```
Skill("context-memory:session-compactor", {run_dir: "${run_dir}"})
```

### Step 3: Delivery

Report compacted memory files and any new patterns discovered.
