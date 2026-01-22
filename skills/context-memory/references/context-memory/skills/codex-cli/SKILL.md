---
name: codex-cli
description: |
  【触发条件】gemini-cli 失败时的降级选项
  【核心产出】CLAUDE.md 模块文档（作为 gemini 的备选）
  【专属用途】
    - CLAUDE.md 生成（降级）
    - 后端代码分析优先
  【强制工具】codeagent-wrapper codex
  【不触发】gemini 可用时（优先使用 gemini）
allowed-tools:
  - Bash
  - Write
  - Read
arguments:
  - name: prompt
    type: string
    required: true
    description: 生成任务描述
  - name: module_path
    type: string
    required: false
    description: 目标模块路径 (CLAUDE.md 生成用)
  - name: strategy
    type: string
    required: false
    description: 生成策略 (single-layer|multi-layer)
  - name: input_files
    type: array
    required: false
    description: 输入文件路径列表
  - name: output_format
    type: string
    default: "markdown"
    description: 输出格式 (markdown|json|yaml)
---

# Memory Plugin - Codex CLI Skill

## 触发条件

此 Skill 仅在以下情况触发：

1. **gemini-cli 失败**：非零退出码
2. **gemini-cli 输出为空**：无有效内容
3. **gemini 配额耗尽**：API 限制

## 执行流程

### CLAUDE.md 生成流程（降级）

```
1. 接收模块路径和策略
   - module_path: 目标目录
   - strategy: single-layer | multi-layer
       │
       ▼
2. 扫描目录结构
   - 统计文件数量和类型
   - 识别子目录
       │
       ▼
3. 构建 Prompt (与 gemini-cli 相同模板)
   - single-layer: @*/CLAUDE.md @*.ts ...
   - multi-layer: @**/*
       │
       ▼
4. 执行 codeagent-wrapper codex
   cd ${module_path} && \
   ~/.claude/bin/codeagent-wrapper codex \
     --prompt "${prompt}" \
     --workdir "."
       │
       ▼
5. 验证输出
   - 检查 CLAUDE.md 是否生成
   - 返回手动模式提示 (如失败)
```

## 与 gemini-cli 的差异

| 维度     | gemini-cli           | codex-cli            |
| -------- | -------------------- | -------------------- |
| 优先级   | 主要工具             | 降级选项             |
| 擅长     | 文档生成、自然语言   | 后端逻辑、代码分析   |
| 上下文   | 32k tokens           | 128k tokens          |
| 速度     | 较快                 | 较慢                 |
| 文档质量 | 更流畅               | 更技术化             |

## 执行命令

```bash
# 单层策略
cd ${module_path} && \
~/.claude/bin/codeagent-wrapper codex \
  --prompt "$(cat <<'PROMPT'
Directory Structure Analysis:
[structure info]

Read: @*/CLAUDE.md @*.ts @*.tsx

Generate single file: ./CLAUDE.md

Template Structure:
- Purpose (1-2 sentences)
- Structure (directory tree)
- Components (exports, dependencies)
- Integration points
- Implementation notes

Instructions:
- Create exactly one CLAUDE.md file
- Reference child CLAUDE.md files, do not duplicate
- No placeholder text or TODOs
PROMPT
)"

# 多层策略
cd ${module_path} && \
~/.claude/bin/codeagent-wrapper codex \
  --prompt "$(cat <<'PROMPT'
Directory Structure Analysis:
[structure info]

Read: @**/*

Generate CLAUDE.md files:
- Primary: ./CLAUDE.md (current directory)
- Additional: CLAUDE.md in each subdirectory

Instructions:
- Work bottom-up: deepest directories first
- Parent directories reference children
- No placeholder text or TODOs
PROMPT
)"
```

## 输出格式规范

### Markdown (默认)

```markdown
# Generated Document

## Overview

[概述内容]

## Details

[详细内容]

## References

[相关引用]
```

## 最终降级

如果 codex-cli 也失败：

```
Error: Both gemini-cli and codex-cli failed
Suggestion: 请手动创建 ${module_path}/CLAUDE.md

推荐结构:
# ${module_name}

## Purpose
[描述模块功能]

## Structure
[目录结构]

## Components
[组件列表]
```

## 使用示例

```
# 降级生成 CLAUDE.md (single-layer)
Skill("context-memory:codex-cli",
  module_path="src/auth",
  strategy="single-layer"
)

# 降级生成 CLAUDE.md (multi-layer)
Skill("context-memory:codex-cli",
  module_path="src/core/handlers",
  strategy="multi-layer"
)
```

## 验证清单

- [ ] gemini-cli 已确认失败
- [ ] prompt 构建完整
- [ ] codeagent-wrapper codex 调用成功
- [ ] CLAUDE.md 已生成
- [ ] 输出符合模板结构
