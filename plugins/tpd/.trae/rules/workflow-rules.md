# TPD 工作流规则

## 多阶段工作流数据连续性

当执行多阶段工作流（thinking → plan → dev）时，**必须确保阶段间数据连续性**：

1. **每个阶段必须检查前一阶段的产物**
2. **通过 `artifact-manifest.json` 解析上游产物路径**（禁止跨阶段复制）
3. **已有数据时跳过冗余检索，仅做增量处理**
4. **只提出新问题**，不重复已回答的问题

## 数据流模式

```
THINKING/meta/artifact-manifest.json
    ↓ (PLAN 通过 manifest 解析 handoff/synthesis/boundaries/clarifications)
PLAN/meta/artifact-manifest.json
    ↓ (DEV 通过 manifest 解析 architecture/constraints/pbt/risks/context)
DEV → 按解析后的路径消费产物（NO copy）
```

## Hard Cutover 运行策略

1. **禁止运行时读写 `.claude/*/runs/*`**（仅允许 OpenSpec artifacts 路径）
2. **禁止阶段间复制产物文件**（如 `thinking-*`、`plan-*` 前缀快照）
3. **缺失必需 manifest/产物时必须 fail-fast**，并给出明确修复建议
4. **lineage 必须可追溯**：阶段交接需能说明产物来源与依赖

## 任务拆分规则

当一个任务修改/生成 **超过 3 个文件**时，必须拆分为子任务：

- 每个子任务最多 3 个文件
- 每个子任务必须包含 `[TEST]` 节和测试要求
- 明确的成功标准

## 写入范围限制

- **thinking 阶段**: 仅写入 `openspec/changes/${PROPOSAL_ID}/thinking/`
- **plan 阶段**: 仅写入 `openspec/changes/${PROPOSAL_ID}/plan/`
- **dev 阶段**: 可修改项目代码，但严格限制在 `tasks-scope.md` 范围内

## 代码主权

外部模型（Codex/Gemini）生成的代码仅作为逻辑参考（Prototype），最终交付代码**必须重构**以确保无冗余，达到企业级标准。

## 双核心调用规则（Trae）

在 Trae 配置中，Codex/Gemini 已收敛为两个核心智能体（`@codex`、`@gemini`），调用时必须遵循：

1. **必须显式传 `role`**：`constraint | architect | implementer | auditor`
2. **`implementer` 必须带 `mode`**：`analyze | prototype`
3. **`auditor` 建议带 `focus`**：
   - `@codex(role=auditor)` → `focus=security,performance`
   - `@gemini(role=auditor)` → `focus=ux,accessibility`
4. **禁止使用旧 agent ID**：`@codex-constraint`、`@gemini-architect`、`@codex-auditor` 等已废弃

## 检索规则（Trae 原生）

在 `.trae` 工作流中，上下文检索统一走 Trae 原生工具链：

1. **先 SearchCodebase，后 Read**：禁止跳过 SearchCodebase 直接凭经验给结论
2. **证据必须可回溯**：`context.md`/`explore-*.json` 至少包含文件路径与关键符号说明
3. **外部资料必须验证**：涉及新技术时，必须 Web Search + Read 固化来源

## 阶段调用速查（何时调用）

| 阶段步骤 | 推荐调用 |
| -------- | -------- |
| thinking Step 2 | `@boundary-explorer`（最多 4） |
| thinking Step 3 | `@codex(role=constraint)` + `@gemini(role=constraint)` |
| plan Step 2 | `@context-analyzer` + `/requirement-parser` |
| plan Step 3 | `@codex(role=architect)` + `@gemini(role=architect)` |
| dev Step 2 | `@codex(role=implementer,mode=analyze)` + `/context-retriever` |
| dev Step 3 | `@codex(role=implementer,mode=prototype)` + `@gemini(role=implementer,mode=prototype)` |
| dev Step 5 | `@codex(role=auditor)` + `@gemini(role=auditor)` |

## 并行约束

| 阶段（关键并行步骤） | 最大并行智能体 |
| -------------------- | -------------- |
| thinking（Step 2 + Step 3） | 4（`boundary-explorer`） + 2（`@codex/@gemini role=constraint`） |
| plan（Step 2 + Step 3） | 2（`context-analyzer + requirement-parser`） + 2（`@codex/@gemini role=architect`） |
| dev（Step 2 + Step 3 + Step 5） | 2（`context-retriever + @codex role=implementer mode=analyze`） + 2（`@codex/@gemini role=implementer mode=prototype`） + 2（`@codex/@gemini role=auditor`） |
