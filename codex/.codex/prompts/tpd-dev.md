---
description: TPD Dev 阶段（最小任务范围 -> 分析 -> 原型 -> 审计 -> 重构 -> 归档）
argument-hint: "[feature-description] [--proposal-id=<proposal_id>] [--task-type=frontend|backend|fullstack]"
---

你现在处于 `tpd-dev` 模式。

## 目标

从 `tasks.md` 选择最小可验证范围（1-3 tasks）并实现，输出到
`openspec/changes/<proposal_id>/dev/`。

## 快速检查清单

- 必须先确认 `proposal_id`。
- 必须通过 plan manifest 解析所需上下文资产。
- 外部模型原型不能直接落地，必须先重构与副作用审查。
- 禁止 `TaskOutput`，只用阻塞 `Task`。

## 强约束

1. 必须先确认 `proposal_id` 再开发。
2. 仅实现已选 scope（1-3 tasks），不得越界。
3. Dev 阶段需保留审计与修复闭环。
4. 修复循环最多 2 轮，超限需升级给用户。

## 角色与协议

### 可用子代理

- `tpd-codex-core`
- `tpd-gemini-core`

### 消息协议（必须使用）

统一字段：`type`、`from`、`to`、`proposal_id`、`task_id`、
`requires_ack`、`payload`。

支持类型：
- `scope_confirmed`
- `analysis_ready`
- `prototype_ready`
- `audit_blocker`
- `fix_request`
- `fix_done`
- `phase_broadcast`
- `heartbeat`
- `error`

通信规则：
- `audit_blocker` 与 `fix_request` 必须收到 ACK。
- ACK 缺失重试 1 次后，记录通信失败并转人工评审路径。

## Task Result Handling（强制）

- `Task` 调用阻塞并直接返回结果。
- 禁止调用 `TaskOutput`。
- 禁止手动拼接 task id。

## 执行步骤

1. **解析与准备**：解析 `proposal_id`，读取 plan manifest，校验必需资产。
2. **Hard Stop（范围确认）**：从 root `tasks.md` 选 1-3 项闭环任务并询问用户确认。
3. **创建团队与分析阶段**：
   - 执行 `tpd-context-retriever`。
   - 运行 `tpd-codex-core`（`role=implementer mode=analyze`）。
4. **并行原型阶段**：并行运行 `tpd-codex-core` 与 `tpd-gemini-core`
   （`role=implementer mode=prototype`）。
5. **并行审计阶段**：并行运行 `tpd-codex-core` 与 `tpd-gemini-core`
   （`role=auditor`），检查阻塞项。
6. **修复循环**：发现阻塞时发 `fix_request`，最多 2 轮。
7. **重构与副作用审查**：执行 `tpd-code-implementer`，验证边界与约束。
8. **进度与归档**：更新任务进度，视情况执行 `/openspec:archive`。
9. **Hard Stop（是否继续下一阶段）**：询问用户继续/暂停/先审查。

## 必要产物

- `tasks-scope.md`
- `context.md`
- `analysis-codex.md`
- `prototype-codex.diff`
- `prototype-gemini.diff`（frontend/fullstack）
- `changes.md`
- `audit-codex.md`
- `audit-gemini.md`
- `tasks-progress.md`
- `team/mailbox.jsonl`
- `team/phase-events.jsonl`
- `team/heartbeat.jsonl`

## 失败回退

- Team API 失败：降级独立 `Task`，保留同产物合同。
- 单模型失败：继续使用可用模型并记录差距。
- 通信超时持续：停止自动修复循环，升级给用户决策。
