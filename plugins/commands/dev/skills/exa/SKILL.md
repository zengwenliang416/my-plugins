---
name: exa
description: |
  【触发条件】当需要查找最新技术文档、代码示例、API 用法、或搜索特定领域信息时使用。
  【触发关键词】搜索、查找文档、最新信息、类似页面、直接回答、exa
  【核心能力】AI 原生搜索引擎，语义检索 → 返回结构化结果（标题/URL/内容/引用）
  【不触发】本地代码搜索（用 grep/glob）、通用知识问答、数学计算
  【注意】需要 EXA_API_KEY 环境变量
allowed-tools:
  - Bash
  - Read
---

# Exa Search

AI-native search engine for finding documentation, code examples, and web content with semantic understanding.

## Quick Start

```bash
# 使用插件相对路径
EXA_SCRIPT="${CLAUDE_PLUGIN_ROOT}/skills/exa/scripts/exa_exec.ts"
npx tsx "$EXA_SCRIPT" search "React 19 useActionState hook examples" --content --limit 5
```

## 执行方式

当被其他 Skill 通过 `Skill("exa", "search ...")` 调用时，执行：

```bash
EXA_SCRIPT="${CLAUDE_PLUGIN_ROOT}/skills/exa/scripts/exa_exec.ts"
npx tsx "$EXA_SCRIPT" $ARGS
```

## When to Use

| Use Exa                                    | Use Other Tools                       |
| ------------------------------------------ | ------------------------------------- |
| Latest library docs after knowledge cutoff | Local codebase search (use grep/glob) |
| Code examples and best practices           | General knowledge already known       |
| Finding similar resources to a URL         | Math or logic questions               |
| Direct answers with citations              | Internal project documentation        |

## Commands

### search

Semantic web search with optional content retrieval.

```bash
# Basic search
exa search "Next.js 15 app router"

# With content and domain filter
exa search "Supabase auth SSR" --content --include react.dev,supabase.com

# Date filtered
exa search "OpenAI API changes" --after 2024-01-01
```

### answer

Get direct answers with citations.

```bash
exa answer "How to fix heap out of memory in Node 22?"
```

### similar

Find pages similar to a given URL.

```bash
exa similar https://github.com/fastapi/fastapi --content
```

### research

Deep research with structured output.

```bash
exa research "Compare React state management libraries 2025" --depth deep
```

## Parameters

| Param                   | Description                     | Commands        |
| ----------------------- | ------------------------------- | --------------- |
| `--limit, -n <int>`     | Number of results (default: 5)  | search, similar |
| `--content`             | Include page text               | search, similar |
| `--include <domains>`   | Comma-separated domains         | search          |
| `--exclude <domains>`   | Exclude domains                 | search          |
| `--after <YYYY-MM-DD>`  | Published after date            | search          |
| `--before <YYYY-MM-DD>` | Published before date           | search          |
| `--category <type>`     | company/news/paper/tweet/github | search          |
| `--json`                | JSON output format              | all             |

## Output

```json
{
  "ok": true,
  "command": "search",
  "data": {
    "results": [
      {
        "title": "React 19 Documentation",
        "url": "https://react.dev/...",
        "text": "..."
      }
    ]
  }
}
```

## Integration

Works with other skills:

1. **Exa** finds latest documentation
2. **Codex** implements based on the docs
3. **Gemini** synthesizes and formats

## Requirements

Set `EXA_API_KEY` environment variable:

```bash
export EXA_API_KEY=your-api-key
```
