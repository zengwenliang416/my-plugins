---
description: TPD Thinking 阶段（复杂度路由 -> 边界探索 -> 约束分析 -> 综合 -> 交接）
argument-hint: "[--depth=auto|light|deep|ultra] [--parallel] [--verbose] <problem description>"
---

你现在处于 `tpd-thinking` 模式。

## 目标

在 `openspec/changes/<proposal_id>/thinking/` 下产出约束集与交接资产，
为 Plan 阶段提供可消费输入。

## 快速检查清单

- 先读 `llmdoc/index.md` 与相关文档，再进入代码调研。
- 严格写入 `openspec/changes/<proposal_id>/thinking/`。
- 保留 Team 消息协议与 ACK 语义。
- 禁止 `TaskOutput`，只用阻塞 `Task` 直接取结果。

## 强约束

1. Thinking 资产必须写入 `openspec/changes/<proposal_id>/thinking/`。
2. 必须在 change root 写 `proposal.md`（若不存在）。
3. 不修改业务源码。
4. 按 context boundary 拆分调研。
5. 产物命名必须兼容下游 Plan 阶段。

## 角色与协议

### 可用子代理

- `tpd-context-explorer`
- `tpd-codex-core`
- `tpd-gemini-core`

### 消息协议（必须使用）

所有消息至少包含：`type`、`from`、`to`、`proposal_id`、`task_id`、
`requires_ack`、`payload`。

支持类型：
- `boundary_ready`
- `constraint_ready`
- `constraint_question`
- `constraint_answer`
- `phase_broadcast`
- `heartbeat`
- `error`

ACK 规则：
- 定向消息且 `requires_ack=true` 必须收到 ACK。
- 若一次重试后仍无 ACK，记录超时并带 fallback 注记继续。

## Task Result Handling（强制）

- 每个 `Task` 调用是阻塞式，结果直接在调用返回中。
- 禁止调用 `TaskOutput`（工具不存在）。
- 禁止手动拼接 task id（如 `agent-name@worktree-id`）。

## 执行步骤

1. **初始化**：解析参数与 `proposal_id`，建立 `thinking/meta/team` 目录。
2. **复杂度路由**：执行 `tpd-complexity-analyzer`，确定 `depth`。
3. **Hard Stop（深度确认）**：当 `depth=auto` 且评分中等时，必须询问用户。
4. **并行边界探索**：创建 team，并发运行 `tpd-context-explorer`。
5. **并行约束分析**：`tpd-codex-core` 与 `tpd-gemini-core` 并行，互发问题并 ACK。
6. **综合收敛**：执行 `tpd-thought-synthesizer`。
7. **Hard Stop（未决问题）**：若存在 unresolved questions，必须询问用户后补充。
8. **结论与交接**：执行 `tpd-conclusion-generator`、`tpd-handoff-generator`。
9. **生成 proposal**：若 root 下无 `proposal.md`，按模板生成。
10. **收尾**：写 manifest、更新状态并关闭团队。

## 必要产物

- `input.md`
- `complexity-analysis.md`
- `explore-*.json`
- `codex-thought.md`（deep/ultra）
- `gemini-thought.md`（deep/ultra）
- `synthesis.md`
- `conclusion.md`
- `handoff.md`
- `handoff.json`
- `meta/artifact-manifest.json`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`
- `team/mailbox.jsonl`
- `openspec/changes/<proposal_id>/proposal.md`

## 失败回退

- Team API 失败：降级到单 `Task`，但产物合同不变。
- 单模型失败：继续使用可用模型，并在 `synthesis.md` 记录缺口。
- handoff 失败：立即终止并返回可执行错误。
