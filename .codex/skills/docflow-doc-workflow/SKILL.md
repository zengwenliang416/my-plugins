---
name: docflow-doc-workflow
description: |
  【触发条件】用户询问文档体系、llmdoc 工作流、如何维护文档
  【核心产出】针对当前项目的 llmdoc 使用指南与下一步建议
  【不触发】纯代码实现请求且不涉及文档流程
  【先问什么】是否已初始化 llmdoc、希望读文档还是更新文档
  [Resource Usage] Use references/.
allowed-tools:
  - Read
  - Glob
  - AskUserQuestion
---

# /docflow-doc-workflow

This skill provides guidance on the llmdoc documentation system and available documentation workflows.

## Pre-fetched Context

- **Llmdoc status:** !`test -d llmdoc && echo "INITIALIZED" || echo "NOT_INITIALIZED"`
- **Doc count:** !`find llmdoc -name "*.md" 2>/dev/null | wc -l`
- **Doc index:** !`cat llmdoc/index.md 2>/dev/null | head -30`

## Workflow Guide

### If llmdoc is NOT initialized:

Recommend running `/prompts:docflow-init-doc` to initialize the documentation system.

Explain the benefits:
- Documentation-driven development
- LLM-optimized retrieval maps
- Consistent project understanding

### If llmdoc IS initialized:

Explain the available workflows:

| Task | Command/Skill | Description |
|------|--------------|-------------|
| Read docs | `docflow-read-doc` | Quick project understanding |
| Update docs | `docflow-update-doc` | Sync docs after code changes |
| Investigate | `docflow-investigate` | Doc-first codebase research |
| Initialize | `/prompts:docflow-init-doc` | One-time setup (already done) |

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
