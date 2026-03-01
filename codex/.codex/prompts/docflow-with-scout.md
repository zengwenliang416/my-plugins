---
description: 先调研再执行的 docflow 主流程（investigate -> synthesize -> execute）
argument-hint: "<复杂目标或任务描述>"
---

你现在处于 `docflow-with-scout` 模式。

## 目标

对复杂任务执行证据驱动流程：先调查、交叉验证、再执行，并保留可追踪的结构化结论。

## 快速检查清单

- 先文档后代码（`llmdoc/index.md` + `overview/*`）
- 调查结论必须带证据
- 修复回路最多 2 轮
- 阻塞问题必须升级给用户

## 强约束

1. **文档优先（强制）**：
   - 先检查 `llmdoc/`。
   - 若存在，先读 `llmdoc/index.md` + `llmdoc/overview/*.md` + 至少 3 个相关文档。
2. 优先使用子代理（docflow-investigator/docflow-worker）并以结构化消息协作。
3. 调查与修复回路最多 2 轮；超过 2 轮必须升级给用户。
4. 不可静默忽略冲突或证据缺口。

## 消息协议（必须使用）

- `INVESTIGATION_READY`
- `INVESTIGATION_REVIEW_REQUEST`
- `INVESTIGATION_REVIEW_RESULT`
- `EXECUTION_PLAN_SHARED`
- `WORKER_PROGRESS`
- `WORKER_BLOCKED`
- `EXECUTION_RESULT`
- `EXECUTION_FIX_REQUEST`
- `EXECUTION_FIX_APPLIED`

所有消息使用 JSON 结构，至少包含 `type` 字段与任务上下文字段。

## 执行步骤

1. **Deconstruct Goal**：把 `$ARGUMENTS` 拆成可独立调研的问题列表。
2. **Parallel Investigation**：
   - 若可用子代理，按问题并行调 `docflow-investigator`。
   - 若不可用子代理，单代理模拟并保持同等输出结构。
3. **Cross Validation**：互审关键结论，标记 `confirm|challenge`。
4. **Synthesis**：合并证据，形成统一系统视图与执行假设。
5. **Execution Plan**：先给出可执行步骤，再交给 `docflow-worker` 执行（或单代理执行）。
6. **Fix Loop**：若存在阻塞问题，最多 2 轮定向修复。
7. **Final Report**：输出调查路径、证据、改动结果、剩余风险。

## 最终输出

- **Investigation Summary**（问题 -> 结论 -> 证据）
- **Execution Summary**（目标 -> 步骤 -> 结果）
- **Artifacts**（关键文件或命令）
- **Risks / Escalations**（如有）

优先将每项结论写成可检索的短句，避免长段落。

如果 `$ARGUMENTS` 为空，先要求用户提供明确任务目标。
