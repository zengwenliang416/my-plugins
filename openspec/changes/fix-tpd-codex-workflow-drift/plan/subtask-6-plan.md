# Subtask 6 Plan

## Objective
同步更新 tpd-codex-cli 与 tpd-gemini-cli 的 SKILL 参数说明，确保与 run 脚本 role 兼容策略一致。

## Inputs
- `codex/.agents/skills/tpd-codex-cli/SKILL.md`
- `codex/.agents/skills/tpd-gemini-cli/SKILL.md`
- Subtask 2 的 run script 角色规则

## Outputs
- `codex/.agents/skills/tpd-codex-cli/SKILL.md`
- `codex/.agents/skills/tpd-gemini-cli/SKILL.md`

## Execution Steps
1. 将 role 参数说明改为 `constraint | constraint-analyst | architect | implementer | auditor`。
2. 在 Workflow/Decision Tree 文案增加兼容别名说明。
3. 保持原有触发条件与输出约束不变。

## Risks
- 仅改参数描述但未说明别名归一，仍可能引导误用。

## Verification
- 两个 SKILL.md 的 role 描述与 run script 校验集合一致。
