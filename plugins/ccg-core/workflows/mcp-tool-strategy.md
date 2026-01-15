# MCP 工具策略

## 概述

本文档明确每类 MCP 服务的触发条件、失败补救措施与记录要求，确保工具使用的规范性和可追溯性。

## MCP 服务清单

| 服务                | 用途             | 优先级 | 外部依赖 |
| ------------------- | ---------------- | ------ | -------- |
| auggie-mcp          | 语义代码检索     | P0     | 无       |
| context7            | 第三方库官方文档 | P0     | 网络     |
| ddg-search          | 通用网络搜索     | P1     | 网络     |
| sequential-thinking | 深度问题分析     | P0     | 无       |

> **注意**: Codex、Gemini、Exa 已迁移为 Skills，由 hooks 自动触发

### LSP 工具使用指南

| 操作         | LSP 方法               | 用途                       |
| ------------ | ---------------------- | -------------------------- |
| 跳转到定义   | `goToDefinition`       | 查找符号定义位置           |
| 查找所有引用 | `findReferences`       | 查找符号所有使用处         |
| 悬停信息     | `hover`                | 获取类型/文档信息          |
| 文档符号     | `documentSymbol`       | 获取文件中所有符号         |
| 工作区符号   | `workspaceSymbol`      | 跨文件搜索符号             |
| 查找实现     | `goToImplementation`   | 查找接口/抽象方法实现      |
| 调用层级     | `prepareCallHierarchy` | 获取调用层级项             |
| 入向调用     | `incomingCalls`        | 查找调用当前函数的所有调用 |
| 出向调用     | `outgoingCalls`        | 查找当前函数调用的所有函数 |

## 各服务详细策略

### auggie-mcp

#### 触发条件

- 代码库语义搜索（优先于 grep/关键词搜索）
- 上下文收集（Phase 1 强制使用）
- 理解代码结构和依赖关系

#### 核心方法

| 方法                 | 用途         | 关键参数            |
| -------------------- | ------------ | ------------------- |
| `codebase-retrieval` | 语义代码检索 | information_request |

#### 使用示例

```bash
mcp__auggie-mcp__codebase-retrieval(
  information_request="Where is user authentication implemented?"
)
```

#### 记录要求

```markdown
【auggie-mcp 调用】
查询: <information_request>
结果: <返回的代码片段摘要>
```

---

### context7

#### 触发条件

- 引入新依赖前评估适配性
- 实现特定功能时查询 API 用法
- 升级依赖版本时对比变更
- 遇到库使用问题时查阅文档

#### 强制流程

1. **必须先调用** `resolve-library-id`（除非用户明确提供 `/org/project` 格式）
2. 再调用 `get-library-docs` 获取文档

#### 参数限制

| 参数   | 建议值 | 说明                 |
| ------ | ------ | -------------------- |
| tokens | ≤ 5000 | 控制返回内容量       |
| topic  | 指定   | 聚焦特定主题         |
| page   | 1      | 分页，需要更多时递增 |

#### 失败处理

- **库 ID 解析失败**: 尝试不同的库名称变体
- **文档获取失败**: 降级到 `ddg-search(site:官方域名)`
- **内容不足**: 调整 topic 或增加 page

#### 记录要求

```markdown
【context7 调用】
库: <库名称>
库ID: <context7 ID>
主题: <topic>
结果: <获取成功/失败原因>
```

---

### ddg-search

#### 触发条件

- 最新信息、官方公告、breaking changes
- 技术博客、社区讨论
- 作为其他搜索工具的降级选择

#### 两种方法

| 方法            | 用途         |
| --------------- | ------------ |
| `search`        | 网络搜索     |
| `fetch_content` | 获取网页内容 |

#### 查询优化

- 关键词 ≤ 12 个
- 使用限定词: `site:`, `after:`, `filetype:`
- 优先官方域名

#### 失败处理

- **无结果**: 简化查询或移除限定词
- **内容获取失败**: 尝试其他搜索结果

#### 记录要求

```markdown
【ddg-search 调用】
方法: <search|fetch_content>
查询/URL: <内容>
结果: <命中数/获取状态>
```

---

### sequential-thinking

#### 触发条件（必须）

- 任何需要深度思考的场景
- 复杂需求分析
- 技术方案设计
- 风险识别
- 问题诊断

#### 参数规范

```bash
mcp__sequential-thinking__sequentialthinking(
  thought="<分析内容>",
  thoughtNumber=1,        # 数字类型，无引号
  totalThoughts=3,        # 数字类型，无引号
  nextThoughtNeeded=true, # 布尔类型，无引号
  stage="Problem Definition"
)
```

#### 常见错误

- 使用下划线命名 (`thought_number`) 而非驼峰 (`thoughtNumber`)
- 数字/布尔值使用字符串类型 (`"1"` 应为 `1`)

#### 记录要求

```markdown
【sequential-thinking 调用】
阶段: <stage>
思考: <第N步/共M步>
输出: <关键结论摘要>
```

---

## Agent Skills（非 MCP）

以下工具已迁移为 Claude Code Skills，由 hooks 自动触发：

| Skill      | 用途                   | 触发场景                   |
| ---------- | ---------------------- | -------------------------- |
| codex-cli  | 后端逻辑/调试/代码审查 | 需要深度代码分析时         |
| gemini-cli | 前端 UI/CSS/原型       | 需要 UI 设计或前端原型时   |
| exa        | AI 搜索/文档/示例      | 需要搜索最新文档或示例代码 |

> **注意**：Skills 由 hooks 自动识别触发条件，无需手动判断

---

## 通用失败处理策略

### 重试规则

| 错误类型 | 重试次数 | 退避时间 |
| -------- | -------- | -------- |
| 429 限流 | 1 次     | 20 秒    |
| 5xx 错误 | 1 次     | 2 秒     |
| 超时     | 1 次     | 2 秒     |
| 其他错误 | 0 次     | -        |

### 降级链路

```
auggie-mcp → Claude Code LSP 工具（符号操作）
LSP → Claude Code 本地工具（Glob/Grep/Read）
context7 → ddg-search(site:官方域名)
exa skill → ddg-search
最终 → 保守离线答案 + 标注不确定性
```

## 调用简报格式

每次 MCP 调用后，必须输出调用简报：

```markdown
【MCP调用简报】
服务: <服务名>
触发: <触发原因>
参数: <关键参数摘要>
结果: <命中数/主要来源>
状态: <成功|重试|降级>
```

## 禁用场景

- 网络受限且未明确授权
- 查询包含敏感代码/密钥
- 本地工具可充分完成任务

## 并发控制

- **严格串行**: 禁止同轮并发调用多个 MCP 服务
- **意图分解**: 多服务需求时拆分为多轮对话
- **明确预期**: 每次调用前说明预期产出和后续步骤
