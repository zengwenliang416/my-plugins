# 字段映射分析

## 源格式 (Claude Code Agent)

```yaml
---
name: string # Agent 名称
description: string # 简短描述
tools: string[] # 工具列表
model: string # 模型选择
color: string # 颜色标识
---
[Markdown 正文] # 详细提示词
```

## 目标格式 (SOLO Coder 智能体)

| 字段               | 限制          | 必填 | 映射来源      |
| ------------------ | ------------- | ---- | ------------- |
| 名称               | 最大20字符    | 是   | `name`        |
| 提示词             | 最大10000字符 | 否   | Markdown 正文 |
| 可被其他智能体调用 | 开关          | -    | 根据用途判断  |
| 英文标识名         | 最大50字符    | 是   | `name`        |
| 何时调用           | 最大5000字符  | 是   | `description` |
| 工具               | 多选          | 否   | `tools` 映射  |

## 工具映射表

| Claude Code     | SOLO Coder | 说明                     |
| --------------- | ---------- | ------------------------ |
| Read            | Read       | 检索和查看文件           |
| Write           | Edit       | 添加、删除和编辑文件     |
| Edit            | Edit       | 添加、删除和编辑文件     |
| Glob            | Read       | 文件模式匹配 (归入 Read) |
| Grep            | Read       | 内容搜索 (归入 Read)     |
| Bash            | Terminal   | 终端命令执行             |
| WebSearch       | Web search | 网页搜索                 |
| WebFetch        | Web search | 网页内容获取             |
| AskUserQuestion | -          | SOLO 无对应              |

## 可用 MCP 工具

- exa
- banana-image
- auggie-mcp
- gemini
- codex
