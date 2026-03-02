# Subtask 23 Plan

## Objective
把架构/任务分解技能与命令层默认模式对齐：默认 `task_type=fullstack`，不依赖参数开关。

## Inputs
- `plugins/tpd/skills/architecture-analyzer/SKILL.md`
- `plugins/tpd/skills/task-decomposer/SKILL.md`

## Outputs
- 两个技能的 Parameter Policy 明确默认 fullstack
- 分支策略从“自由推导”收敛为“fullstack 默认 + 缺口降级”

## Execution Steps
1. 更新两个技能 Parameter Policy 文案。
2. 调整 Execution Flow 的分支说明，强调 fullstack 默认。
3. 保持输出文件契约不变。

## Risks
- 与单模型可用场景冲突。

## Verification
- 两个技能文档都明确默认 fullstack。
- 缺失单侧模型产物时有 fallback 说明。
