# Subtask 27 Plan

## Objective
删除 TPD legacy skills 第 4 批（3 文件）。

## Inputs
- `.codex/skills/tpd-plan-synthesizer/SKILL.md`
- `.codex/skills/tpd-requirement-parser/SKILL.md`
- `.codex/skills/tpd-risk-assessor/SKILL.md`

## Outputs
- 3 个 legacy skill 文件被删除

## Execution Steps
1. 删除上述 3 个 legacy skills。
2. 验证官方 `.agents/skills` 对应文件可读。

## Risks
- 删除后脚本仍引用 legacy 路径。

## Verification
- 3 个 legacy 文件不存在。
- 对应官方 skill 文件存在。
