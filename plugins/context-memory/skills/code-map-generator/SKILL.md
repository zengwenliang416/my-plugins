---
name: code-map-generator
description: |
  【触发条件】/memory code-map <feature> 或需要生成代码流程图
  【核心产出】.claude/skills/codemap-{feature}/ 目录
  【专属用途】
    - 3阶段代码分析编排
    - 生成 Mermaid 流程图文档
    - 架构流、函数调用、数据流、条件路径
  【强制工具】Skill(codex-cli)
  【不触发】已存在且未过期的 codemap
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/analyze-deps.ts`).
allowed-tools:
  - Skill
  - Write
  - Read
  - Glob
  - Grep
arguments:
  - name: feature
    type: string
    required: true
    description: 功能/模块关键词
  - name: entry_point
    type: string
    required: false
    description: 入口文件路径 (可选)
  - name: depth
    type: number
    default: 3
    description: 分析深度层级
---

# Code Map Generator - 代码地图生成器

## Script Entry

```bash
npx tsx scripts/analyze-deps.ts [args]
```

## Resource Usage

- Reference docs: `references/module-patterns.md`
- Assets: `assets/config.json`
- Execution script: `scripts/analyze-deps.ts`

## 执行流程

```
阶段 1: 定位入口
       │
       ├── 使用 feature 关键词搜索
       ├── 或使用指定的 entry_point
       └── 确定分析起点
       │
       ▼
阶段 2: 深度分析 (codex-cli)
       │
       ├── 模块结构分析
       ├── 函数调用链追踪
       ├── 数据流分析
       └── 条件分支分析
       │
       ▼
阶段 3: 文档生成
       │
       ├── architecture-flow.md
       ├── function-calls.md
       ├── data-flow.md
       ├── conditional-paths.md
       ├── complete-flow.md
       └── SKILL.md (索引)
```

## 输出结构

```
.claude/skills/codemap-{feature}/
├── SKILL.md                    # 技能索引
├── architecture-flow.md        # 架构流程图
├── function-calls.md           # 函数调用链
├── data-flow.md               # 数据流图
├── conditional-paths.md       # 条件路径图
└── complete-flow.md           # 完整流程图
```

## 文档模板

### SKILL.md

```markdown
---
name: codemap-{feature}
description: |
  {feature} 功能的代码地图
  入口: {entry_point}
  分析深度: {depth} 层
---

# {Feature} Code Map

## 快速导航

- [架构流程](architecture-flow.md)
- [函数调用](function-calls.md)
- [数据流](data-flow.md)
- [条件路径](conditional-paths.md)
- [完整流程](complete-flow.md)

## 概述

{功能摘要}

## 关键文件

| 文件 | 职责 |
| ---- | ---- |
| ...  | ...  |
```

### architecture-flow.md

```markdown
# Architecture Flow - {Feature}

## 模块关系

\`\`\`mermaid
graph TD
subgraph Entry
A[main.ts]
end

    subgraph Core
        B[service.ts]
        C[handler.ts]
    end

    subgraph Data
        D[repository.ts]
        E[model.ts]
    end

    A --> B
    B --> C
    C --> D
    D --> E

\`\`\`

## 模块说明

### Entry Layer

- **main.ts**: 应用入口

### Core Layer

- **service.ts**: 业务逻辑
- **handler.ts**: 请求处理

### Data Layer

- **repository.ts**: 数据访问
- **model.ts**: 数据模型
```

### function-calls.md

```markdown
# Function Calls - {Feature}

## 调用序列

\`\`\`mermaid
sequenceDiagram
participant C as Client
participant H as Handler
participant S as Service
participant R as Repository
participant DB as Database

    C->>H: request()
    H->>S: process()
    S->>R: query()
    R->>DB: SELECT
    DB-->>R: rows
    R-->>S: entities
    S-->>H: result
    H-->>C: response

\`\`\`

## 函数签名

| 函数            | 参数       | 返回值     |
| --------------- | ---------- | ---------- |
| handler.request | (req, res) | void       |
| service.process | (data: T)  | Promise<R> |
```

### data-flow.md

```markdown
# Data Flow - {Feature}

## 数据流转

\`\`\`mermaid
flowchart LR
subgraph Input
A[HTTP Request]
end

    subgraph Transform
        B[Validation]
        C[Mapping]
    end

    subgraph Output
        D[Response]
    end

    A --> B
    B --> C
    C --> D

\`\`\`

## 数据变换

| 阶段       | 输入           | 输出           |
| ---------- | -------------- | -------------- |
| Validation | RawInput       | ValidatedInput |
| Mapping    | ValidatedInput | Entity         |
```

### conditional-paths.md

```markdown
# Conditional Paths - {Feature}

## 决策树

\`\`\`mermaid
flowchart TD
A[Start] --> B{Auth?}
B -->|Yes| C{Role?}
B -->|No| D[401 Unauthorized]
C -->|Admin| E[Full Access]
C -->|User| F[Limited Access]
C -->|Guest| G[Read Only]
\`\`\`

## 条件说明

| 条件            | True     | False    |
| --------------- | -------- | -------- |
| isAuthenticated | 继续处理 | 返回 401 |
| isAdmin         | 完全权限 | 检查角色 |
```

## 分析策略

### 入口定位

```
1. 关键词搜索
   - 文件名匹配: *{feature}*
   - 函数名匹配: handle{Feature}, {feature}Controller
   - 路由匹配: /{feature}

2. 启发式规则
   - 优先: controller > service > handler
   - 排除: test, mock, stub
```

### 深度控制

```
depth=1: 仅入口文件
depth=2: + 直接调用
depth=3: + 间接调用 (默认)
depth=5: 完整调用链
```

## 降级策略

```
codex-cli 不可用时:
├── 使用 LSP 获取符号信息
├── 使用 Grep 追踪调用
├── 生成简化版流程图
└── 标记 "Limited Analysis"
```

## 使用示例

```
# 基本用法
/memory code-map "authentication"

# 指定入口
/memory code-map "payment" --entry src/services/payment.ts

# 深度分析
/memory code-map "order" --depth 5
```
