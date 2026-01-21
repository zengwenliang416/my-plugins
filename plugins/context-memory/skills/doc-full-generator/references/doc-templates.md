# Documentation Templates Reference

## API 文档模板

```markdown
# {API_NAME}

{OVERVIEW}

## Authentication

{AUTH_SECTION}

## Endpoints

### {METHOD} {PATH}

{ENDPOINT_DESCRIPTION}

**Request**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| {param}   | {type} | {req}    | {desc}      |

**Response**

\`\`\`json
{RESPONSE_EXAMPLE}
\`\`\`

**Errors**

| Code   | Description |
| ------ | ----------- |
| {code} | {desc}      |

## Examples

\`\`\`typescript
{CODE_EXAMPLE}
\`\`\`
```

## 组件文档模板

```markdown
# {COMPONENT_NAME}

{OVERVIEW}

## Installation

\`\`\`bash
{INSTALL_COMMAND}
\`\`\`

## Props

| Prop   | Type   | Default | Description |
| ------ | ------ | ------- | ----------- |
| {prop} | {type} | {def}   | {desc}      |

## Usage

\`\`\`tsx
{USAGE_EXAMPLE}
\`\`\`

## Variants

### {VARIANT_NAME}

{VARIANT_DESCRIPTION}

## Accessibility

{A11Y_NOTES}
```

## 指南文档模板

```markdown
# {GUIDE_TITLE}

{INTRODUCTION}

## Prerequisites

- {PREREQ_1}
- {PREREQ_2}

## Step-by-Step Guide

### Step 1: {STEP_TITLE}

{STEP_CONTENT}

### Step 2: {STEP_TITLE}

{STEP_CONTENT}

## Troubleshooting

### {ISSUE_TITLE}

**症状**: {SYMPTOM}

**解决方案**: {SOLUTION}

## FAQ

### {QUESTION}

{ANSWER}
```

## 多模型协作

### Codex 分析阶段

```
输入: 源代码文件
输出:
- 函数签名列表
- 参数类型和描述
- 返回值类型
- 使用示例代码
- 依赖关系
```

### Gemini 撰写阶段

```
输入: Codex 分析结果 + 模板
输出:
- 完整 Markdown 文档
- 格式化代码块
- 结构化章节
```

## 质量检查

| 检查项        | 说明          |
| ------------- | ------------- |
| Markdown 语法 | 确保格式有效  |
| 代码高亮      | 语言标识正确  |
| 链接有效性    | 内部链接可达  |
| 标题层级      | H1→H2→H3 正确 |
| 必需章节      | 模板章节完整  |
