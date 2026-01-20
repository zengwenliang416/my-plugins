---
name: exa
description: |
  【触发条件】头脑风暴主题研究阶段，搜索趋势、案例、跨领域灵感
  【核心产出】AI 原生搜索引擎，语义检索 → 返回结构化结果（标题/URL/内容/引用）
  【不触发】本地代码搜索、创意生成（用 codex-cli/gemini-cli）
  【先问什么】无需询问，根据主题自动执行搜索
allowed-tools:
  - Bash
  - Read
---

# Exa Search - 头脑风暴研究助手

AI-native search engine for brainstorming research: trends, case studies, cross-industry inspiration.

## 执行命令

```bash
# 使用 exa_exec.ts 脚本
EXA_SCRIPT="${CLAUDE_PLUGIN_ROOT}/skills/exa/scripts/exa_exec.ts"
npx tsx "$EXA_SCRIPT" <command> <query> [options]
```

## 头脑风暴专用搜索模式

### 1. 趋势搜索

```bash
npx tsx "$EXA_SCRIPT" search "{topic} trends 2026" --content --limit 5
```

### 2. 案例搜索

```bash
npx tsx "$EXA_SCRIPT" search "{topic} case study success story" --content --limit 5
```

### 3. 跨领域灵感

```bash
npx tsx "$EXA_SCRIPT" search "{topic} inspiration from {other_industry}" --content --limit 5
```

### 4. 问题与痛点

```bash
npx tsx "$EXA_SCRIPT" search "{topic} challenges problems pain points" --content --limit 5
```

### 5. 创新机会

```bash
npx tsx "$EXA_SCRIPT" search "{topic} opportunities innovations startups" --content --limit 5
```

## 命令参考

### search - 语义搜索

```bash
# 基础搜索
npx tsx "$EXA_SCRIPT" search "智能家居创新趋势"

# 带内容和域名过滤
npx tsx "$EXA_SCRIPT" search "SaaS pricing models" --content --include techcrunch.com,forbes.com

# 时间过滤（只搜索最近内容）
npx tsx "$EXA_SCRIPT" search "AI应用新趋势" --after 2025-01-01
```

### answer - 直接回答

```bash
npx tsx "$EXA_SCRIPT" answer "2026年最热门的消费科技趋势是什么？"
```

### similar - 相似页面

```bash
npx tsx "$EXA_SCRIPT" similar https://example.com/interesting-article --content
```

### research - 深度研究

```bash
npx tsx "$EXA_SCRIPT" research "对比分析订阅制和买断制商业模式" --depth deep
```

## 参数说明

| 参数 | 描述 | 适用命令 |
|------|------|----------|
| `--limit, -n <int>` | 结果数量（默认 5） | search, similar |
| `--content` | 包含页面正文 | search, similar |
| `--include <domains>` | 限定域名（逗号分隔） | search |
| `--exclude <domains>` | 排除域名 | search |
| `--after <YYYY-MM-DD>` | 发布日期之后 | search |
| `--before <YYYY-MM-DD>` | 发布日期之前 | search |
| `--category <type>` | 内容类型：company/news/paper/tweet/github | search |
| `--json` | JSON 格式输出 | all |

## 输出格式

```json
{
  "ok": true,
  "command": "search",
  "data": {
    "results": [
      {
        "title": "文章标题",
        "url": "https://...",
        "publishedDate": "2026-01-15",
        "text": "页面内容摘要..."
      }
    ]
  }
}
```

## 头脑风暴场景示例

### 主题：为程序员设计减压玩具

```bash
# 趋势搜索
npx tsx "$EXA_SCRIPT" search "programmer stress relief products trends 2026" --content --limit 5

# 案例搜索
npx tsx "$EXA_SCRIPT" search "fidget toys for developers success stories" --content --limit 5

# 跨领域灵感
npx tsx "$EXA_SCRIPT" search "stress relief innovations from gaming industry" --content --limit 5

# 问题搜索
npx tsx "$EXA_SCRIPT" search "developer burnout causes office stress" --content --limit 5
```

## 与其他 Skill 协作

1. **exa** 搜索研究 → 输出 research-brief.md
2. **codex-cli** 基于研究生成技术视角创意
3. **gemini-cli** 基于研究生成用户视角创意

## 环境要求

```bash
export EXA_API_KEY=your-api-key
```
