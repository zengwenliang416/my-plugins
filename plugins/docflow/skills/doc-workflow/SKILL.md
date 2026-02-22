---
name: doc-workflow
description: |
  [Trigger] User asks about the documentation system, llmdoc workflow, or doc maintenance.
  [Output] llmdoc usage guide and next-step recommendations for the current project.
  [Skip] When request is purely code implementation with no documentation workflow involved.
  [Ask] Whether llmdoc is initialized and whether user wants to read or update docs.
  [Resource Usage] Use references/.
allowed-tools:
  - Read
  - Glob
  - AskUserQuestion
---

# /doc-workflow

This skill provides guidance on the llmdoc documentation system and available documentation workflows.

## Pre-fetched Context

- **Llmdoc status:** !`test -d llmdoc && echo "INITIALIZED" || echo "NOT_INITIALIZED"`
- **Doc count:** !`find llmdoc -name "*.md" 2>/dev/null | wc -l`
- **Doc index:** !`cat llmdoc/index.md 2>/dev/null | head -30`

## Workflow Guide

### If llmdoc is NOT initialized:

Recommend running `/docflow:init-doc` to initialize the documentation system.

Explain the benefits:

- Documentation-driven development
- LLM-optimized retrieval maps
- Consistent project understanding

### If llmdoc IS initialized:

Explain the available workflows:

| Task        | Command/Skill       | Description                   |
| ----------- | ------------------- | ----------------------------- |
| Read docs   | `/read-doc`         | Quick project understanding   |
| Update docs | `/update-doc`       | Sync docs after code changes  |
| Investigate | `/investigate`      | Doc-first codebase research   |
| Initialize  | `/docflow:init-doc` | One-time setup (already done) |

### llmdoc Structure

```
llmdoc/
├── index.md          # Navigation hub
├── overview/         # "What is this project?"
├── architecture/     # "How does it work?" (LLM Retrieval Map)
├── guides/           # "How do I do X?"
└── reference/        # "What are the specifics?"
```

## Actions

1. Check the pre-fetched context to determine llmdoc status.
2. Based on user's question, provide relevant guidance.
3. If user wants to perform an action, guide them to the appropriate skill/command.
