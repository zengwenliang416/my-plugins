# 智能工具策略

## 概述

本文档定义了在调用组合工具前的上下文注入顺序与冲突处理方式，确保工具链执行的一致性和可靠性。

## 工具调用优先级

### 第一优先级：深度分析工具

- **sequential-thinking**: 任何需要深度思考的场景必须最先调用
- 输出：关键疑问列表、风险点、技术选型建议

### 第二优先级：内部代码分析

- **auggie-mcp**: 语义代码检索（"这个功能在哪？"类问题）
- **Claude Code LSP**: 符号级精准操作（**强制用于代码修改前**）
  - 修改前：`documentSymbol` 了解文件结构
  - 跳转：`goToDefinition` 查看定义位置
  - 重构前：`findReferences` 确认影响范围
  - 调用链：`incomingCalls` / `outgoingCalls`
  - 类型：`hover` 获取类型/文档信息
- **强制规则**：改动任何公共符号前必须先用 LSP 查引用

### 第三优先级：文档与信息收集

- **context7**: 第三方库官方文档（准确性最高）
- **exa** (skill): 代码示例、最佳实践、最新信息
- **ddg-search**: 通用网络搜索（降级选择）

### 第四优先级：AI 协作

- **codex** (skill): 复杂编码任务的需求分析、原型生成、代码审查
- **gemini** (skill): 前端 UI/CSS 原型设计

## 上下文注入顺序

```
1. sequential-thinking 输出 → 识别关键疑问
       ↓
2. auggie-mcp/LSP 检索 → 语义代码分析
       ↓
3. context7/exa(skill) 结果 → 外部文档/示例
       ↓
4. codex/gemini(skill) 协作 → 方案设计/代码原型
       ↓
5. [重要] 模型返回后 → 重新评估是否需要触发其他 skill
       ↓
6. TodoWrite 任务规划 → 执行计划
```

## 模型返回后的 Skill 触发

**关键机制**：hooks 仅在 UserPromptSubmit 时触发，Codex/Gemini 返回后需要**主动评估**：

1. 收到 Codex 返回 → 评估是否需要 Gemini（前端原型）或 exa（搜索文档）
2. 收到 Gemini 返回 → 评估是否需要 Codex（后端逻辑）或 exa
3. 收到 exa 返回 → 评估是否需要其他 skill 补充

**强制规则**：每次收到后台任务返回后，必须检查是否需要触发其他 skill

## 冲突处理规则

### 信息冲突

| 冲突类型               | 处理方式                                       |
| ---------------------- | ---------------------------------------------- |
| 内部代码 vs 外部文档   | 以内部代码实现为准，文档作为参考               |
| 多个外部来源冲突       | 优先采用官方文档(context7)，其次验证日期取最新 |
| codex 建议 vs 既有模式 | 保持项目一致性，除非有充分理由变更             |

### 工具失败处理

1. **重试策略**: 单次重试，退避 2 秒
2. **降级链路**:
   - auggie-mcp → Claude Code LSP（符号操作）
   - LSP → 本地工具（Glob/Grep/Read）
   - context7 → ddg-search(site:官方域名)
   - exa skill → ddg-search
3. **最终降级**: 保守离线答案 + 标注不确定性

## 并发控制

### 严格串行（MCP 服务）

- 每轮最多调用 1 个 MCP 服务
- 多服务需求时拆分为多轮对话
- 执行顺序：sequential-thinking → auggie-mcp → LSP → context7 → skills(codex/gemini/exa) → TodoWrite

### 可并行（仅限 Claude Code 本地工具）

- 多个独立的 Glob/Grep/Read/LSP 查询
- 不涉及外部服务的本地文件操作

> **注意**：此处"并行"仅指 Claude Code 内置工具，MCP 服务（auggie-mcp、context7 等）必须串行调用。

## 上下文大小限制

| 工具                 | 建议限制         | 最大限制          |
| -------------------- | ---------------- | ----------------- |
| context7             | tokens ≤ 5000    | tokens ≤ 10000    |
| exa get_code_context | tokensNum = 5000 | tokensNum ≤ 50000 |

## 结果验证

每次工具调用后必须验证：

1. 结果是否回答了预设疑问
2. 信息是否足够支撑下一步决策
3. 是否需要补充查询

## 日志记录

所有工具调用必须记录到 `operations-log.md`：

```markdown
## [时间戳] 工具调用

- 工具: <工具名称>
- 触发原因: <为什么需要调用>
- 参数: <关键参数>
- 结果: <命中数/主要发现>
- 状态: <成功|重试|降级>
```
