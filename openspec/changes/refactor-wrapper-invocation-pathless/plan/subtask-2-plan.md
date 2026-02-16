# Subtask 2 Plan

## Objective
迁移脚本 resolver 为 env/PATH-only。

## Inputs
- 子任务 1 清单
- 现有脚本模板

## Outputs
- 更新后的 wrapper 脚本（无 `~/.claude/bin` 回退）

## Execution Steps
1. 保留 `CODEAGENT_WRAPPER` 优先。
2. 删除 `.claude/bin` 路径探测代码。
3. 保留命令参数与错误处理逻辑。

## Risks
- 引入不必要行为变更。

## Verification
- 脚本语法正确且保留原有调用参数。
