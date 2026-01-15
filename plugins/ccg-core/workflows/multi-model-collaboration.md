# 多模型协作策略 (CCG Workflow)

Claude 作为**主控模型（Orchestrator）**，通过 `codeagent-wrapper` 统一调度 Codex 和 Gemini。

## 核心原则

1. **代码主权**：外部模型输出为"脏原型"，必须经 Claude 重构后交付
2. **统一执行**：通过 `~/.claude/bin/codeagent-wrapper` 调用外部模型
3. **角色注入**：从 `prompts/codex/` 或 `prompts/gemini/` 读取角色提示词
4. **Hard Stop**：关键节点需用户确认后才能继续

## 资源矩阵

| 模型   | 角色      | 优势场景                     | 限制         |
| ------ | --------- | ---------------------------- | ------------ |
| Claude | 主控/实施 | 代码重构、最终交付、复杂决策 | -            |
| Auggie | 语义检索  | 代码库语义搜索、上下文收集   | 仅检索       |
| Codex  | 后端专家  | 后端逻辑、调试、代码审查     | 只读沙箱     |
| Gemini | 前端专家  | UI/前端、快速原型            | 上下文 < 32k |

## 角色提示词库

### Codex 角色 (`prompts/codex/`)

| 角色      | 用途             | 适用命令                     |
| --------- | ---------------- | ---------------------------- |
| architect | API/后端架构设计 | /ccg:code, /ccg:backend      |
| analyzer  | 代码分析         | /ccg:analyze, /ccg:dev       |
| debugger  | 问题调试         | /ccg:bugfix, /ccg:debug      |
| optimizer | 性能优化         | /ccg:optimize, /ccg:refactor |
| reviewer  | 代码审查         | /ccg:review, /ccg:dev        |
| tester    | 测试生成         | /ccg:test                    |

### Gemini 角色 (`prompts/gemini/`)

| 角色      | 用途         | 适用命令                 |
| --------- | ------------ | ------------------------ |
| frontend  | UI/组件开发  | /ccg:frontend, /ccg:code |
| analyzer  | 前端架构分析 | /ccg:analyze             |
| debugger  | 前端问题调试 | /ccg:debug               |
| optimizer | 前端性能优化 | /ccg:optimize            |
| reviewer  | 前端代码审查 | /ccg:review              |
| tester    | 组件测试生成 | /ccg:test                |

## 路由决策

```
任务类型          → 路由模型    → 角色
───────────────────────────────────────────
后端/API/数据库   → Codex      → architect
前端/UI/CSS       → Gemini     → frontend
调试/错误分析     → Codex      → debugger
代码分析          → 双模型     → analyzer
代码审查/安全     → 双模型     → reviewer
性能优化          → 双模型     → optimizer
测试生成          → 智能路由   → tester
```

## 6 阶段工作流

```
Phase 0: 提示词增强 ─────────────────────────────────
  ├─ 分析用户原始需求
  ├─ 补充技术上下文和约束条件
  └─ 生成增强后的结构化提示词

Phase 1: 上下文检索 ─────────────────────────────────
  ├─ Auggie: 语义搜索 (mcp__auggie-mcp__codebase-retrieval)
  └─ LSP: 符号检索 (documentSymbol, goToDefinition, findReferences)

Phase 2: 多模型分析 ⏸️ Hard Stop ────────────────────
  ├─ Codex: 后端视角分析 (--role analyzer)
  ├─ Gemini: 前端视角分析 (--role analyzer)
  ├─ 交叉验证，消除盲区
  └─ 等待用户确认方向

Phase 3: 原型生成 ───────────────────────────────────
  ├─ 按路由规则分发任务
  ├─ 注入对应角色提示词
  └─ 输出格式: unified diff patch

Phase 4: 代码实施 ───────────────────────────────────
  ├─ Claude 接收原型（脏原型）
  ├─ 重构：精简、去冗余、符合项目规范
  ├─ 使用 Edit/Write 工具实施改动
  └─ 不直接 apply patch，先理解再实施

Phase 5: 双模型审查 ⏸️ Hard Stop ────────────────────
  ├─ Codex: 后端视角审查 (--role reviewer)
  ├─ Gemini: 前端视角审查 (--role reviewer)
  └─ 等待用户确认

Phase 6: 修正与交付 ─────────────────────────────────
  ├─ 根据审查反馈修正代码
  ├─ 运行验证（测试/构建）
  └─ 交付最终代码
```

## 执行示例

### 调用 Codex

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role architect \
  --prompt "Design a REST API for user authentication with JWT" \
  --session "$SESSION_ID" \
  --sandbox read-only \
  --output-format "unified-diff"
```

### 调用 Gemini

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role frontend \
  --prompt "Create a responsive navigation component" \
  --session "$SESSION_ID" \
  --output-format "unified-diff"
```

### 并行调用

```bash
# 后台执行，并行分析
~/.claude/bin/codeagent-wrapper codex --role analyzer --prompt "$PROMPT" &
~/.claude/bin/codeagent-wrapper gemini --role analyzer --prompt "$PROMPT" &
wait
```

## 会话管理

- 每次调用保存 `SESSION_ID`
- 后续调用传入 `SESSION_ID` 继续会话
- 多轮对话保持上下文连续

## 关键约束

| 约束       | 说明                                   |
| ---------- | -------------------------------------- |
| 只读沙箱   | Codex 必须 `--sandbox read-only`       |
| 后台执行   | `run_in_background=true`，禁止擅自终止 |
| 输出格式   | 统一使用 unified diff patch            |
| 最小作用域 | 改动严格限于需求范围，不做附带修改     |
| 非必要不写 | 注释/文档仅在必要时添加                |
| Hard Stop  | Phase 2/5 必须等待用户确认             |

## CCG 命令体系

详见 `commands/ccg/` 目录：

| 命令类别 | 命令                                                  |
| -------- | ----------------------------------------------------- |
| 规划     | /ccg:plan, /ccg:think                                 |
| 开发     | /ccg:dev, /ccg:code, /ccg:backend, /ccg:frontend      |
| 分析     | /ccg:analyze, /ccg:review                             |
| 问题解决 | /ccg:bugfix, /ccg:debug                               |
| 代码质量 | /ccg:test, /ccg:refactor, /ccg:optimize, /ccg:enhance |
| Git 操作 | /ccg:commit, /ccg:pr, /ccg:clean-branches             |
| 工具     | /ccg:init, /ccg:help                                  |

## 与其他工作流协同

| 工作流                     | 关系                   |
| -------------------------- | ---------------------- |
| context-search-strategy.md | Phase 1 的搜索策略     |
| mcp-tool-strategy.md       | 所有工具调用遵循此规范 |
