---
name: docflow-read-doc
description: |
  【触发条件】用户要求快速理解项目、阅读现有 llmdoc
  【核心产出】项目概览摘要（目标、架构、流程、参考文档）
  【不触发】llmdoc 尚未初始化且用户要求立即编码
  【先问什么】关注的业务域、需要概览还是深入某模块
context: fork
allowed-tools:
  - Read
  - Glob
  - Grep
---

# /docflow-read-doc

This skill reads the project's `llmdoc` documentation and provides a comprehensive summary to help understand the project quickly.

## Pre-fetched Context

- **Doc index:** !`cat llmdoc/index.md 2>/dev/null || echo "No llmdoc found"`
- **Doc structure:** !`find llmdoc -name "*.md" 2>/dev/null | head -200 || echo "No llmdoc directory"`

## Actions

1. **Step 1: Check Documentation Exists**
   - If `llmdoc/` directory doesn't exist, inform the user and suggest running `/prompts:docflow-init-doc` first.

2. **Step 2: Read Index**
   - Read `llmdoc/index.md` to understand the documentation structure.

3. **Step 3: Read Overview Documents**
   - Read all documents in `llmdoc/overview/` to understand the project's purpose and context.

4. **Step 4: Scan Architecture & Guides**
   - Scan `llmdoc/architecture/` for system design information.
   - Scan `llmdoc/guides/` for available workflows.

5. **Step 5: Generate Summary**
   - Provide a concise summary including:
     - Project purpose and main features
     - Key architectural components
     - Available guides and workflows
     - Important references

Output the summary directly to the user in a well-structured format.
