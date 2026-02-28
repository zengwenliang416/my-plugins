---
description: "Show available context-memory commands and their usage"
argument-hint: ""
allowed-tools:
  - Read
---

# /context-memory:memory

## Purpose

Help command that lists all available context-memory commands. Each workflow is now a standalone command for direct invocation.

## Steps

### Step 1: Display Command Reference

Print the following command reference to the user:

```
## context-memory Commands

### CLAUDE.md Documentation
/context-memory:doc [plan|generate|update] [--scope full|related]
  Generate, update, or plan CLAUDE.md documentation via Gemini pipeline.

### Context Management
/context-memory:load <task description>
  Load project context for a specific task.

/context-memory:compact [--run-id <id>]
  Compact session insights into persistent memory.

### API & Rules
/context-memory:swagger [--run-id <id>]
  Generate OpenAPI/Swagger documentation from code.

/context-memory:tech-rules [--run-id <id>]
  Generate tech stack rules to .claude/memory/rules/.

### Code Intelligence
/context-memory:code-map [--run-id <id>]
  Generate code maps with Mermaid diagrams.

/context-memory:skill [index|load] [--run-id <id>]
  Index and package or load SKILL packages.

### Direct Skill Invocation (advanced)
Skill("context-memory:style-memory", {run_dir})    — Extract style patterns
Skill("context-memory:workflow-memory", {run_dir})  — Archive workflow state
```
