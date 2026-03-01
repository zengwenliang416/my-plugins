# Subtask 12 Plan

## Objective
更新 OpenSpec 变更文档，显式声明 legacy 清理已纳入官方化范围。

## Inputs
- `openspec/changes/refactor-docflow-codex-official-adapter/proposal.md`
- `openspec/changes/refactor-docflow-codex-official-adapter/tasks.md`
- `openspec/changes/refactor-docflow-codex-official-adapter/specs/docflow-codex-workflow-assets/spec.md`

## Outputs
- 更新后的 `proposal.md`
- 更新后的 `tasks.md`
- 更新后的 `spec.md`

## Execution Steps
1. 在 proposal 的 What Changes 中补充“删除 legacy copies”。
2. 在 tasks 新增 cleanup 分组并勾选完成状态。
3. 在 spec 新增“无 legacy 重复资产”要求与场景。

## Risks
- 文档与实际删除结果不一致。

## Verification
- `openspec validate refactor-docflow-codex-official-adapter --strict --no-interactive` 通过。
- tasks 勾选状态与已执行动作一致。
