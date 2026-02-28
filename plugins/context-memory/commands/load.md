---
description: "Load project context for a task using semantic retrieval and module scan"
argument-hint: "<task description>"
allowed-tools:
  - Read
  - Bash
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
---

# /context-memory:load

## Purpose

Load project context for a specific task. Combines auggie-mcp semantic retrieval with module scanning to build a comprehensive context bundle.

## Steps

### Step 1: Validate Arguments — HARD STOP

A task description is required. **MANDATORY**: If no task description argument is provided, you MUST call `AskUserQuestion` below and WAIT for the user's response. Do NOT guess or infer the task.

```
AskUserQuestion({
  questions: [{
    question: "What task do you need context for?",
    header: "Task",
    multiSelect: false,
    options: [
      { label: "Current task", description: "Load context for what I'm currently working on" },
      { label: "Custom", description: "I'll describe the task" }
    ]
  }]
})
```

### Step 2: Execute

```
Skill("context-memory:context-loader", {task: "<task description>"})
```

### Step 3: Delivery

Report the loaded context summary and suggest next steps.
