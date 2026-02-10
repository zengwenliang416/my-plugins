---
name: investigate
description: |
  【触发条件】用户要求解释代码、定位实现、分析系统工作方式
  【核心产出】文档优先的调查报告（直接回复，不落盘）
  【不触发】明确要求直接修改代码的执行任务
  【先问什么】要调查的模块范围、问题维度、是否需要外部信息
  [Resource Usage] Use references/.
context: fork
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - WebSearch
  - WebFetch
---

# /investigate

This skill performs rapid, documentation-driven codebase investigation and reports findings directly.

## Pre-fetched Context

- **Llmdoc exists:** !`test -d llmdoc && echo "llmdoc initialized" || echo "No llmdoc directory"`
- **Llmdoc index:** !`cat llmdoc/index.md 2>/dev/null | head -100 || echo "No index"`
- **Doc structure:** !`find llmdoc -name "*.md" 2>/dev/null | head -50`
- **Project structure:** !`ls -la 2>/dev/null | head -20`

## Investigation Protocol

### Phase 1: Documentation First

Before touching any source code, you MUST:

1. Check if `llmdoc/` exists (see pre-fetched context above).
2. If exists, read relevant documents in this order:
   - `llmdoc/index.md` - navigation and overview
   - `llmdoc/overview/*.md` - project context
   - `llmdoc/architecture/*.md` - system design
   - `llmdoc/guides/*.md` - workflows
   - `llmdoc/reference/*.md` - conventions

### Phase 2: Code Investigation

Only after exhausting documentation, investigate source code:

1. Use `Glob` to find relevant files.
2. Use `Grep` to search for patterns.
3. Use `Read` to examine specific files.

### Phase 3: Report

Output a concise report with this structure:

```markdown
#### Code Sections
- `path/to/file.ext:line~line` (SymbolName): Brief description

#### Report

**Conclusions:**
> Key findings...

**Relations:**
> File/module relationships...

**Result:**
> Direct answer to the question...
```

## Key Practices

- **Stateless**: Output directly, do not write files.
- **Concise**: Report under 150 lines.
- **No Code Blocks**: Reference code with `path/file.ext` format, not paste.
- **Objective**: State facts only, no subjective judgments.
