---
description: "Index, package, and load SKILL packages from project modules"
argument-hint: "[index|load] [--run-id <id>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
---

# /context-memory:skill

## Purpose

Manage SKILL packages: index project modules into skill packages, or load existing packages into the session.

## Steps

### Step 1: Determine Action — HARD STOP

If an action argument is provided (`index` or `load`), skip to Step 2.

**MANDATORY**: If no action argument is provided, you MUST call `AskUserQuestion` below and WAIT for the user's response. Do NOT guess or infer the action. Do NOT skip this step.

```
AskUserQuestion({
  questions: [{
    question: "Which SKILL operation?",
    header: "Operation",
    multiSelect: false,
    options: [
      { label: "index", description: "Scan project modules and package them as SKILLs" },
      { label: "load", description: "Load existing SKILL packages into session" }
    ]
  }]
})
```

### Step 2: Setup Workspace

```bash
run_id="${args[--run-id]:-memory-skill-$(date +%Y%m%d-%H%M%S)}"
run_dir="openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

### Step 3: Execute

```
action=index → Skill("context-memory:skill-indexer", {run_dir: "${run_dir}"})
action=load  → Skill("context-memory:skill-loader")
```

### Step 4: Delivery

Report packaged or loaded skills and their locations.
