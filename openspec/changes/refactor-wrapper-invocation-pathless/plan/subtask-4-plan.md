# Subtask 4 Plan

## Objective
做全量校验并回填 OpenSpec 任务状态。

## Inputs
- 已修改文件

## Outputs
- 校验日志与完成状态

## Execution Steps
1. 检索残留旧路径。
2. 运行 `./scripts/validate-skills.sh`。
3. 更新 `tasks.md` 勾选。

## Risks
- 校验只覆盖部分目录。

## Verification
- 校验通过，且任务全部完成。
