---
name: exa
description: "AI search for trends, cases, and cross-industry inspiration"
allowed-tools:
  - Bash
  - Read
---

# Exa Search - Brainstorm Research Assistant

AI-native search engine for brainstorming research: trends, case studies, cross-industry inspiration.

## Execution

```bash
EXA_SCRIPT="${CLAUDE_PLUGIN_ROOT}/skills/exa/scripts/exa_exec.ts"
npx tsx "$EXA_SCRIPT" <command> <query> [options]
```

## Search Patterns

| Pattern        | Command                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Trends         | `npx tsx "$EXA_SCRIPT" search "{topic} trends 2026" --content --limit 5`                        |
| Case Studies   | `npx tsx "$EXA_SCRIPT" search "{topic} case study success story" --content --limit 5`           |
| Cross-Industry | `npx tsx "$EXA_SCRIPT" search "{topic} inspiration from {other_industry}" --content --limit 5`  |
| Pain Points    | `npx tsx "$EXA_SCRIPT" search "{topic} challenges problems pain points" --content --limit 5`    |
| Opportunities  | `npx tsx "$EXA_SCRIPT" search "{topic} opportunities innovations startups" --content --limit 5` |

## Commands

### search - Semantic Search

```bash
npx tsx "$EXA_SCRIPT" search "smart home innovation trends"
npx tsx "$EXA_SCRIPT" search "SaaS pricing models" --content --include techcrunch.com,forbes.com
npx tsx "$EXA_SCRIPT" search "AI application trends" --after 2025-01-01
```

### answer - Direct Answer

```bash
npx tsx "$EXA_SCRIPT" answer "What are the hottest consumer tech trends in 2026?"
```

### similar - Similar Pages

```bash
npx tsx "$EXA_SCRIPT" similar https://example.com/article --content
```

### research - Deep Research

```bash
npx tsx "$EXA_SCRIPT" research "Compare subscription vs one-time purchase models" --depth deep
```

## Parameters

| Parameter               | Description                                   | Commands        |
| ----------------------- | --------------------------------------------- | --------------- |
| `--limit, -n <int>`     | Result count (default 5)                      | search, similar |
| `--content`             | Include page body                             | search, similar |
| `--include <domains>`   | Limit to domains                              | search          |
| `--exclude <domains>`   | Exclude domains                               | search          |
| `--after <YYYY-MM-DD>`  | Published after date                          | search          |
| `--before <YYYY-MM-DD>` | Published before date                         | search          |
| `--category <type>`     | Content type: company/news/paper/tweet/github | search          |
| `--json`                | JSON output                                   | all             |

## Output Format

```json
{
  "ok": true,
  "command": "search",
  "data": {
    "results": [
      {
        "title": "Article Title",
        "url": "https://...",
        "publishedDate": "2026-01-15",
        "text": "Content summary..."
      }
    ]
  }
}
```

## Collaboration

1. **exa** search research -> outputs research-brief.md
2. **codex-cli** generates technical perspective ideas
3. **gemini-cli** generates user perspective ideas

## Environment

```bash
export EXA_API_KEY=your-api-key
```
