---
name: gemini-cli
description: |
  【触发条件】memory 插件需要文档生成时
  【核心产出】文档内容、设计分析、自然语言摘要
  【专属用途】
    - SKILL.md 索引生成
    - 文档内容生成
    - 设计 token 分析
    - 工作流摘要生成
  【强制工具】Bash (gemini CLI)
  【不触发】后端逻辑分析（用 codex-cli）
allowed-tools:
  - Bash
  - Write
  - Read
arguments:
  - name: prompt
    type: string
    required: true
    description: 生成任务描述
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

## 执行流程

```
1. 接收生成任务
       │
       ▼
2. 构建 Gemini Prompt
   - 加载专属模板
   - 注入输入文件
       │
       ▼
3. 执行 Gemini CLI
   gemini -p "$PROMPT" \
          --sandbox \
          ${input_files}
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
# 生成 SKILL 索引
Skill("memory:gemini-cli",
  prompt="生成技能索引",
  input_files=["plugins/memory/skills/"],
  output_format="markdown"
)

# 提取设计 tokens
Skill("memory:gemini-cli",
  prompt="提取设计 tokens",
  input_files=["src/styles/theme.ts"],
  output_format="yaml"
)
```
