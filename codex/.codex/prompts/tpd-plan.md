---
description: TPD Plan 阶段（上下文 -> 架构并行 -> 歧义消解 -> 任务分解 -> 风险 -> 最终计划）
argument-hint: "[proposal_id] [--task-type=frontend|backend|fullstack] [--loop]"
---

你现在处于 `tpd-plan` 模式。

## 目标

把 OpenSpec proposal 转换为零决策可执行计划，输出到
`openspec/changes/<proposal_id>/plan/`。

## 快速检查清单

- 先读 `llmdoc/index.md` 与相关文档。
- 本阶段禁止写业务实现代码。
- 严格保留 `specs/` 与 `tasks.md` 的 OpenSpec 兼容格式。
- 禁止 `TaskOutput`，只用阻塞 `Task`。

## 强约束

1. 不实现代码，只生成计划资产。
2. 优先通过 manifest 解析已存在资产路径。
3. 输出必须兼容 Dev 阶段消费合同。
4. 必须在 change root 生成 OpenSpec 所需 `tasks.md` 与 `specs/*/spec.md`。

## 角色与协议

### 可用子代理

- `tpd-context-explorer`
- `tpd-codex-core`
- `tpd-gemini-core`

### 消息协议（必须使用）

统一字段：`type`、`from`、`to`、`proposal_id`、`task_id`、
`requires_ack`、`payload`。

支持类型：
- `context_ready`
- `arch_ready`
- `arch_question`
- `arch_answer`
- `risk_alert`
- `phase_broadcast`
- `heartbeat`
- `error`

通信规则：
- 架构代理至少完成一次定向问答（`arch_question`/`arch_answer`）。
- 需要 ACK 的定向消息重试 1 次，仍失败则记录到决策日志并进入 fallback。

## Task Result Handling（强制）

- `Task` 调用阻塞并直接返回结果。
- 禁止调用 `TaskOutput`。
- 禁止手动构造 task id。

## 执行步骤

1. **初始化**：解析 `proposal_id`，建立 `plan/meta/team` 目录和 tracking 文件。
2. **构建团队与上下文检索**：
   - 执行 `tpd-requirement-parser`。
   - 运行 `tpd-context-explorer`（`mode=plan-context`）。
3. **并行架构规划**：`tpd-codex-core` 与 `tpd-gemini-core` 并行（`role=architect`）。
4. **Hard Stop（歧义消解）**：若存在架构冲突/歧义，必须逐项询问用户。
5. **顺序综合管道**：执行 `tpd-architecture-analyzer` -> `tpd-task-decomposer`
   -> `tpd-risk-assessor` -> `tpd-plan-synthesizer`。
6. **生成 OpenSpec 兼容资产**：在 change root 写 `tasks.md` 与 `specs/*/spec.md`
   （每个 Requirement 至少一个 `#### Scenario:`）。
7. **严格校验**：运行 `openspec validate <proposal_id> --type change --strict --no-interactive`。
8. **收尾**：写 `meta/artifact-manifest.json` 并关闭团队。

## 必要产物

- `requirements.md`
- `context.md`
- `codex-plan.md`
- `gemini-plan.md`
- `architecture.md`
- `constraints.md`
- `tasks.md`
- `risks.md`
- `pbt.md`
- `plan.md`
- `decision-log.md`
- `timeline.md`
- `meta/artifact-manifest.json`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`
- `team/mailbox.jsonl`
- `openspec/changes/<proposal_id>/tasks.md`
- `openspec/changes/<proposal_id>/specs/*/spec.md`

## 失败回退

- Team API 失败：降级到独立 `Task`，维持同产物合同。
- 单模型失败：继续使用另一模型，记录缺失视角。
- 严格校验连续失败：停止并返回错误与文件路径。
