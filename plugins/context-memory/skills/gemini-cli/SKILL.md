---
name: gemini-cli
description: |
  【触发条件】memory 插件需要文档生成时
  【核心产出】CLAUDE.md 模块文档、设计分析、自然语言摘要
  【专属用途】
    - CLAUDE.md 模块文档生成 (update-full/update-related)
    - SKILL.md 索引生成
    - 设计 token 分析
    - 工作流摘要生成
  【强制工具】scripts/invoke-gemini.ts
  【不触发】后端逻辑分析（用 codex-cli）
  【降级】gemini 失败时切换到 codex-cli
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, assets/, and scripts/ (`scripts/invoke-gemini.ts`, `scripts/gemini-generate.ts`).
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

# Memory Plugin - Gemini CLI Skill

## Script Entry

```bash
npx tsx scripts/invoke-gemini.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"] [--session "<id>"]
```

## 执行流程

### CLAUDE.md 生成流程

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
3. 构建 Prompt (基于策略)
   - single-layer: @*/CLAUDE.md @*.ts ...
   - multi-layer: @**/*
       │
       ▼
4. 执行脚本入口
   cd ${module_path} && \
   npx tsx scripts/invoke-gemini.ts \
     --role "architect" \
     --prompt "${prompt}" \
     --workdir "."
       │
       ▼
5. 验证输出
   - 检查 CLAUDE.md 是否生成
   - 降级到 codex-cli (如失败)
```

### 通用文档生成流程

```
1. 接收生成任务
       │
       ▼
2. 构建 Gemini Prompt
   - 加载专属模板
   - 注入输入文件
       │
       ▼
3. 执行 scripts/invoke-gemini.ts
   npx tsx scripts/invoke-gemini.ts \
     --role "architect" \
     --prompt "$PROMPT"
       │
       ▼
4. 处理输出
   - 解析生成结果
   - 格式化为目标格式
       │
       ▼
5. 返回结果
```

## 专属 Prompt 模板

### CLAUDE.md 生成 (Single-Layer)

```markdown
Directory Structure Analysis:
${structure_info}

Read: @_/CLAUDE.md @_.ts @_.tsx @_.js @_.jsx @_.py @_.sh @_.md @_.json @_.yaml @\*.yml

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
```

### CLAUDE.md 生成 (Multi-Layer)

```markdown
Directory Structure Analysis:
${structure_info}

Read: @\*_/_

Generate CLAUDE.md files:

- Primary: ./CLAUDE.md (current directory)
- Additional: CLAUDE.md in each subdirectory containing files

Instructions:

- Work bottom-up: deepest directories first
- Parent directories reference children
- Each CLAUDE.md in its respective directory
- No placeholder text or TODOs
```

### SKILL.md 索引生成

```markdown
# Memory Plugin - SKILL Index Generation

## Task

为技能目录生成 SKILL.md 索引

## Input Directory

${input_directory}

## Index Requirements

支持 4 级渐进式加载:

- Level 1: 名称 + 一句话描述
- Level 2: + 触发条件 + 核心产出
- Level 3: + 参数列表 + 依赖
- Level 4: + 完整执行流程

## Output Format

${output_format}
```

### 文档摘要生成

```markdown
# Memory Plugin - Document Summary

## Task

生成项目文档摘要

## Input Files

${input_files}

## Summary Structure

1. 项目概述 (1-2段)
2. 架构要点 (bullet points)
3. API 概览 (如适用)
4. 使用示例 (如适用)

## Constraints

- 总长度 ≤ 2000 tokens
- 保留技术准确性
```

### 设计 Token 分析

```markdown
# Memory Plugin - Design Token Extraction

## Task

分析设计系统 token

## Input Files

${input_files}

## Token Categories

1. 颜色系统
   - Primary/Secondary/Accent
   - Semantic colors
   - Gradients

2. 间距系统
   - Base unit
   - Scale factors

3. 字体层级
   - Font families
   - Size scale
   - Weight mappings

4. 动画系统
   - Duration tokens
   - Easing functions
   - Transition patterns

## Output Format

YAML (design-tokens.yaml)
```

### 工作流摘要生成

```markdown
# Memory Plugin - Workflow Summary

## Task

总结工作流会话

## Session ID

${session_id}

## Summary Focus

1. 关键决策及理由
2. 已完成任务清单
3. 产出文件列表
4. 待处理事项
5. 重要上下文

## Output Format

Markdown (workflow-summary.md)
```

## 降级策略

```
Gemini CLI 不可用时:
1. 检测错误类型
   - 网络错误 → 重试 (3次, 指数退避)
   - 配额错误 → 切换到 codex-cli
   - 服务错误 → 通知用户

2. 降级到 Codex
   - 调用 memory:codex-cli
   - 使用简化 prompt
   - 输出质量可能下降
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

### JSON

```json
{
  "title": "...",
  "sections": [
    {"heading": "...", "content": "..."}
  ],
  "metadata": {...}
}
```

### YAML

```yaml
document:
  title: "..."
  sections:
    - heading: "..."
      content: "..."
  metadata:
    generated_at: "..."
```

## 使用示例

```
# 生成单模块 CLAUDE.md (single-layer)
Skill("context-memory:gemini-cli",
  module_path="src/auth",
  strategy="single-layer"
)

# 生成深层模块 CLAUDE.md (multi-layer)
Skill("context-memory:gemini-cli",
  module_path="src/core/handlers",
  strategy="multi-layer"
)

# 生成 SKILL 索引
Skill("context-memory:gemini-cli",
  prompt="生成技能索引",
  input_files=["plugins/memory/skills/"],
  output_format="markdown"
)

# 提取设计 tokens
Skill("context-memory:gemini-cli",
  prompt="提取设计 tokens",
  input_files=["src/styles/theme.ts"],
  output_format="yaml"
)
```

## CLI 命令示例

```bash
# 通过脚本入口生成 CLAUDE.md
cd /path/to/module && \
npx tsx scripts/invoke-gemini.ts \
  --role "architect" \
  --prompt "$(cat <<'EOF'
Directory Structure Analysis:
[structure info here]

Read: @*/CLAUDE.md @*.ts @*.tsx

Generate single file: ./CLAUDE.md
EOF
)"
```
