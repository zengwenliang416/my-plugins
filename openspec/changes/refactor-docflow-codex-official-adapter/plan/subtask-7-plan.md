# Subtask 7 Plan

## Objective
执行回归验证并更新 OpenSpec 任务状态。

## Inputs
- `.codex/docflow/evals/check_docflow_assets.py`
- `.codex/tpd/evals/check_tpd_assets.py`
- `openspec/changes/refactor-docflow-codex-official-adapter/tasks.md`

## Outputs
- 通过的命令输出
- 更新后的 `tasks.md`

## Execution Steps
1. 运行 docflow eval。
2. 运行 tpd eval 确保无回归。
3. 运行 openspec strict validate。
4. 将已完成项在 tasks.md 勾选。

## Risks
- 旧资产兼容路径引发误判。

## Verification
- 三个校验命令全部成功。
- tasks 勾选状态与实际完成度一致。
