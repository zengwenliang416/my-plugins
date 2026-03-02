# Subtask 19 Plan

## Objective
收敛模型调用技能参数暴露面，保留最小必需输入并明确其余由调用链内部决定。

## Inputs
- `plugins/tpd/skills/codex-cli/SKILL.md`
- `plugins/tpd/skills/gemini-cli/SKILL.md`

## Outputs
- 仅保留 `role` 和 `prompt` 为显式必需参数
- 其余运行上下文通过调用方与目录自动注入

## Execution Steps
1. 精简 arguments 字段。
2. 更新 Parameter Policy 与失败策略。
3. 保持脚本入口与“输出由调用方落盘”规则。

## Risks
- 参数收敛后与旧调用描述不一致。

## Verification
- 两个技能都保留脚本入口与角色映射。
- 参数定义显著减少且不影响调用契约。
