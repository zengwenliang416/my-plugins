# TPD 工作流规则

## 多阶段工作流数据连续性

当执行多阶段工作流（thinking → plan → dev）时，**必须确保阶段间数据连续性**：

1. **每个阶段必须检查前一阶段的产物**
2. **复制相关产物**并加前缀（如 `thinking-synthesis.md`、`plan-constraints.md`）
3. **已有数据时跳过冗余操作**
4. **只提出新问题**，不重复已回答的问题

## 数据流模式

```
THINKING → handoff.json, synthesis.md, clarifications.md, boundaries.json
    ↓ (PLAN 必须读取这些)
PLAN → architecture.md, constraints.md, pbt.md, risks.md, context.md, tasks.md
    ↓ (DEV 必须读取这些)
DEV → 使用以上所有产物进行实现
```

## 任务拆分规则

当一个任务修改/生成 **超过 3 个文件**时，必须拆分为子任务：

- 每个子任务最多 3 个文件
- 每个子任务必须包含 `[TEST]` 节和测试要求
- 明确的成功标准

## 写入范围限制

- **thinking 阶段**: 仅写入 `openspec/changes/${PROPOSAL_ID}/artifacts/thinking/`
- **plan 阶段**: 仅写入 `openspec/changes/${PROPOSAL_ID}/artifacts/plan/`
- **dev 阶段**: 可修改项目代码，但严格限制在 `tasks-scope.md` 范围内

## 代码主权

外部模型（Codex/Gemini）生成的代码仅作为逻辑参考（Prototype），最终交付代码**必须重构**以确保无冗余，达到企业级标准。

## 并行约束

| 阶段     | 最大并行智能体                            |
| -------- | ----------------------------------------- |
| thinking | 4 (boundary-explorer) + 2 (constraint)    |
| plan     | 2 (context + requirement) + 2 (architect) |
| dev      | 2 (implementer) + 2 (auditor)             |
