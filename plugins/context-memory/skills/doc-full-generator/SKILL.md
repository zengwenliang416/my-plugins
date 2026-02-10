---
name: doc-full-generator
description: |
  【触发条件】/memory docs-full [path] 或需要生成完整文档时
  【核心产出】docs/ 目录下的完整文档集
  【专属用途】
    - 根据 plan.json 生成所有文档
    - 多模型协作 (codex 分析 + gemini 撰写)
    - 批量生成，保持一致性
  【强制工具】Skill(codex-cli), Skill(gemini-cli), Write
  【不触发】无有效规划时
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/generate-docs.ts`).
allowed-tools:
  - Skill
  - Read
  - Write
  - Glob
arguments:
  - name: path
    type: string
    required: false
    description: 文档输出目录 (默认 docs/)
  - name: filter
    type: string
    required: false
    description: 文档 ID 过滤器 (支持通配符)
  - name: parallel
    type: boolean
    default: true
    description: 是否并行生成
---

# Doc Full Generator - 完整文档生成器

## Script Entry

```bash
npx tsx scripts/generate-docs.ts [args]
```

## Resource Usage

- Reference docs: `references/doc-templates.md`
- Assets: `assets/generation-config.json`
- Execution script: `scripts/generate-docs.ts`

## 执行流程

```
1. 加载文档规划
   Read(".claude/memory/docs/plan.json")
       │
       ▼
2. 筛选待生成文档
   - 应用 filter 参数
   - 排除已生成且未过期的
       │
       ▼
3. 按依赖顺序处理
   forEach document in generation_order:
       │
       ├─▶ 4a. 代码分析 (codex-cli)
       │   Skill("memory:codex-cli", prompt="doc_analysis")
       │   - 提取接口定义
       │   - 分析函数签名
       │   - 识别使用示例
       │       │
       │       ▼
       ├─▶ 4b. 文档撰写 (gemini-cli)
       │   Skill("memory:gemini-cli", prompt="doc_generation")
       │   - 生成 Markdown 内容
       │   - 添加代码示例
       │   - 格式化输出
       │       │
       │       ▼
       └─▶ 4c. 写入文件
           Write(doc.path, content)
       │
       ▼
5. 更新规划状态
   - 标记已生成文档
   - 记录生成时间
       │
       ▼
6. 生成索引
   - 更新 docs/README.md
   - 生成 SUMMARY.md (可选)
```

## 多模型协作

### 阶段分工

```
┌─────────────────────────────────────────────────────┐
│                     codex-cli                        │
├─────────────────────────────────────────────────────┤
│ 任务: 代码分析                                       │
│ 输入: 源代码文件                                     │
│ 输出:                                                │
│   - 函数签名列表                                     │
│   - 参数类型和描述                                   │
│   - 返回值类型                                       │
│   - 使用示例代码                                     │
│   - 依赖关系                                         │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                    gemini-cli                        │
├─────────────────────────────────────────────────────┤
│ 任务: 文档撰写                                       │
│ 输入: codex 分析结果 + 文档模板                      │
│ 输出:                                                │
│   - 完整 Markdown 文档                               │
│   - 格式化代码块                                     │
│   - 结构化章节                                       │
└─────────────────────────────────────────────────────┘
```

### 并行执行

```
当 parallel=true 时:

Batch 1 (无依赖):
├── doc-001 → codex → gemini → write
├── doc-003 → codex → gemini → write
└── doc-005 → codex → gemini → write

Batch 2 (依赖 Batch 1):
├── doc-002 → codex → gemini → write
└── doc-004 → codex → gemini → write

...
```

## 文档模板

### API 文档模板

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

### 组件文档模板

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

## 输出结构

```
docs/
├── README.md               # 文档首页
├── SUMMARY.md              # 目录导航
├── api/
│   ├── auth.md
│   ├── users.md
│   └── orders.md
├── components/
│   ├── Button.md
│   └── Input.md
├── guides/
│   ├── getting-started.md
│   └── deployment.md
└── reference/
    ├── config.md
    └── errors.md
```

## 生成状态跟踪

### 状态文件

```json
// .claude/memory/docs/generation-status.json
{
  "last_run": "2024-01-20T08:00:00Z",
  "documents": {
    "doc-001": {
      "status": "generated",
      "generated_at": "2024-01-20T08:05:00Z",
      "output_path": "docs/api/auth.md",
      "source_hash": "abc123",
      "word_count": 1250
    },
    "doc-002": {
      "status": "pending",
      "depends_on": ["doc-001"]
    }
  },
  "statistics": {
    "total": 15,
    "generated": 8,
    "pending": 5,
    "failed": 2
  }
}
```

## 使用示例

```bash
# 生成所有文档
/memory docs-full

# 指定输出目录
/memory docs-full docs/v2/

# 仅生成 API 文档
/memory docs-full --filter "api-*"

# 串行生成 (调试用)
/memory docs-full --no-parallel

# 强制重新生成
/memory docs-full --regenerate
```

## 错误处理

```
1. codex-cli 分析失败
   → 使用静态分析降级
   → 标记文档为 "partial"

2. gemini-cli 生成失败
   → 使用 codex-cli 降级
   → 生成技术性文档

3. 写入失败
   → 保存到临时文件
   → 输出文件内容供手动创建

4. 依赖文档缺失
   → 跳过当前文档
   → 记录到 pending 队列
```

## 降级策略

```
gemini-cli 不可用:
├── 使用 codex-cli 生成
├── 输出技术风格文档
└── 标记需要人工润色

codex-cli 也不可用:
├── 使用静态分析
├── 生成基础结构文档
└── 标记需要补充内容
```

## 质量检查

```
生成后自动检查:
├── Markdown 语法有效性
├── 代码块语法高亮
├── 链接有效性 (内部)
├── 标题层级正确
└── 必需章节完整
```
