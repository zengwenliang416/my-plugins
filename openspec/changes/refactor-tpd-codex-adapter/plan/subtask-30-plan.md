# Subtask 30 Plan

## Objective
执行 TPD 官方化收尾回归校验并更新任务状态。

## Inputs
- `.codex/tpd/evals/check_tpd_assets.py`
- `.codex/docflow/evals/check_docflow_assets.py`
- `openspec/changes/refactor-tpd-codex-adapter/tasks.md`

## Outputs
- 通过的校验结果
- 更新后的 `tasks.md`

## Execution Steps
1. 运行 TPD eval，确保官方路径切换后 PASS。
2. 运行 docflow eval，确保共享 config 不受影响。
3. 运行 openspec strict validate。
4. 在 `tasks.md` 勾选已完成项。

## Risks
- 清理 legacy 后旧规范断言未同步导致 validate 失败。

## Verification
- 三个校验命令全部成功。
- tasks 勾选状态与实际动作一致。
