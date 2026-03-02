# Subtask 17 Plan

## Objective
进一步收敛 plan 相关 skills 的参数面：优先自动推导，不要求用户提供额外参数。

## Inputs
- `plugins/tpd/skills/architecture-analyzer/SKILL.md`
- `plugins/tpd/skills/task-decomposer/SKILL.md`
- `plugins/tpd/skills/plan-context-retriever/SKILL.md`

## Outputs
- 三个 skills 仅保留最小必需参数（`run_dir`）
- `task_type/proposal_id` 改为自动推导策略

## Execution Steps
1. 更新 frontmatter arguments，移除可推导参数。
2. 在正文补充 Parameter Policy：默认自动推导。
3. 保持既有输出文件契约不变。

## Risks
- 自动推导策略说明不清，导致调用方理解偏差。

## Verification
- 三个文件参数定义均收敛。
- 输出文件名与命令调用契约不变。
