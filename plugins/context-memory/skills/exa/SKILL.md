---
name: exa
description: |
  【触发条件】memory 插件需要外部文档检索时
  【核心产出】搜索结果、技术文档链接
  【专属用途】
    - 技术栈最佳实践搜索
    - API 文档检索
    - 框架使用示例搜索
  【强制工具】Bash (exa_exec.ts)
  【不触发】本地代码搜索（用 grep/glob）
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, scripts/ (entry: `scripts/exa_exec.ts`).
allowed-tools:
  - Bash
arguments:
  - name: query
    type: string
    required: true
    description: 搜索查询
  - name: category
    type: string
    default: "auto"
    description: 搜索类别 (auto|docs|examples|best-practices)
  - name: limit
    type: number
    default: 5
    description: 返回结果数量
---

# Memory Plugin - Exa Search Skill

## Script Entry

```bash
npx tsx scripts/exa_exec.ts [args]
```

## Resource Usage

- Reference docs: `references/search-strategies.md`
- Execution script: `scripts/exa_exec.ts`

## 执行流程

```
1. 接收搜索请求
       │
       ▼
2. 确定搜索策略
   - 根据 category 选择模板
   - 优化查询关键词
       │
       ▼
3. 执行 Exa 搜索
   bun run exa_exec.ts \
       --query "$QUERY" \
       --limit $LIMIT
       │
       ▼
4. 处理结果
   - 过滤低质量结果
   - 提取关键信息
       │
       ▼
5. 返回结构化结果
```

## 专属搜索策略

### 技术栈最佳实践

```
Query Template: "${tech} best practices production 2024"

Filters:
- domain: official docs, reputable blogs
- freshness: last 2 years
- quality: high engagement

Examples:
- "React best practices production 2024"
- "TypeScript best practices production 2024"
- "Node.js best practices production 2024"
```

### API 文档检索

```
Query Template: "${framework} API documentation official"

Filters:
- domain: official docs only
- type: reference documentation
- version: latest stable

Examples:
- "Express.js API documentation official"
- "FastAPI API documentation official"
- "Spring Boot API documentation official"
```

### 代码示例搜索

```
Query Template: "${tech} example implementation github"

Filters:
- domain: github.com
- stars: > 100
- updated: last year

Examples:
- "React hooks example implementation github"
- "NestJS CRUD example implementation github"
- "Go REST API example implementation github"
```

## 类别自动检测

```
Query Analysis:
├── 包含 "how to" / "tutorial" → examples
├── 包含 "docs" / "reference" → docs
├── 包含 "best" / "pattern" → best-practices
└── 默认 → auto (综合搜索)
```

## 降级策略

```
Exa API 不可用时:
1. 检测错误类型
   - 网络错误 → 重试 (3次)
   - API 错误 → 降级

2. 降级方案
   - 使用 WebSearch 工具
   - 使用 Context7 文档检索
   - 返回缓存结果 (如有)
```

## 输出格式

```json
{
  "query": "原始查询",
  "category": "detected|specified",
  "results": [
    {
      "title": "文档标题",
      "url": "https://...",
      "snippet": "相关摘要...",
      "source": "official|github|blog",
      "relevance": 0.95
    }
  ],
  "metadata": {
    "total_found": 100,
    "returned": 5,
    "search_time_ms": 230
  }
}
```

## 使用示例

```
# 搜索最佳实践
Skill("memory:exa",
  query="TypeScript",
  category="best-practices",
  limit=5
)

# 搜索 API 文档
Skill("memory:exa",
  query="NestJS dependency injection",
  category="docs",
  limit=3
)

# 搜索代码示例
Skill("memory:exa",
  query="React context provider pattern",
  category="examples",
  limit=5
)
```

## 与其他 Skills 协作

```
tech-rules-generator 典型流程:
    │
    ├─► exa("TypeScript best practices")
    │       │
    │       ▼
    │   搜索结果
    │       │
    └─► codex-cli("基于搜索结果生成规则")
            │
            ▼
        规则文件
```
