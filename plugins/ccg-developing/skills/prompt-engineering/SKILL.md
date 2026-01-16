---
name: prompt-engineering
description: |
  【触发条件】当用户需要优化 Prompt、设计 Agent 系统提示词、提升 LLM 输出质量时使用。
  【核心产出】输出：优化后的 Prompt、系统提示词模板、提示工程最佳实践。
  【不触发】不用于：MCP 服务器开发（改用 mcp-builder）、内容写作（改用 content-writer）。
  【先问什么】若缺少：当前 Prompt、目标任务、期望输出格式，先提问补齐。
allowed-tools: Read, Write, Edit, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# Prompt Engineering - 提示工程助手

## 功能概述

提供经过验证的提示工程技巧和模式，帮助设计高效的 Prompt，包括 Anthropic 官方最佳实践和 Agent 设计原则。

## 核心原则

### 1. 清晰与具体

```markdown
❌ 模糊: "帮我写一些代码"
✅ 具体: "用 Python 实现一个函数，接收整数列表，返回其中所有偶数的平方和"
```

### 2. 结构化输入

```markdown
## 任务

[明确的任务描述]

## 上下文

[相关背景信息]

## 约束

- 约束1
- 约束2

## 期望输出

[输出格式说明]
```

### 3. 示例驱动 (Few-shot)

```markdown
将以下句子翻译成正式英语：

输入: "这玩意儿不行"
输出: "This product does not meet the expected quality standards."

输入: "搞定了"
输出: "The task has been completed successfully."

输入: "老板说再改改"
输出:
```

## 高级技巧

### Chain of Thought (思维链)

```markdown
请一步步思考：

1. 首先分析问题的核心是什么
2. 然后识别关键约束和边界条件
3. 接着列出可能的解决方案
4. 最后评估每个方案的优缺点

问题: [具体问题]
```

### Self-Consistency (自洽性)

```markdown
请用三种不同的方法解决这个问题，然后比较结果：

方法1: [描述]
方法2: [描述]
方法3: [描述]

最终答案基于多数一致的结果。
```

### ReAct 模式 (推理+行动)

```markdown
请按照以下模式处理：

Thought: 我需要思考下一步该做什么
Action: 执行具体操作
Observation: 观察操作结果
... (重复直到完成)
Final Answer: 最终结论
```

## Agent 系统提示词设计

### 角色定义框架

```markdown
# 角色

你是一个 [专业领域] 专家，专注于 [具体方向]。

# 能力

- 能力1: 描述
- 能力2: 描述

# 边界

- 不做: 边界1
- 不做: 边界2

# 沟通风格

[语气、格式、详细程度]

# 工具使用

可用工具: [工具列表]
使用策略: [何时使用哪个工具]
```

### 工具使用指导

```markdown
## 工具使用原则

1. **优先级**: 先尝试内置能力，必要时才调用工具
2. **确认性**: 重要操作前请求用户确认
3. **透明性**: 说明为什么选择特定工具
4. **错误处理**: 工具失败时提供替代方案

## 可用工具

### tool_name

- 用途: [具体用途]
- 触发条件: [何时使用]
- 输入: [参数说明]
- 输出: [返回值说明]
```

## Anthropic 最佳实践

### 使用 XML 标签

```markdown
<context>
这是背景信息
</context>

<instructions>
1. 步骤一
2. 步骤二
</instructions>

<output_format>
JSON 格式，包含 name 和 value 字段
</output_format>
```

### 预填充技巧

通过预填充 Assistant 回复来引导输出格式：

```
Human: 分析这段代码的安全问题
```
