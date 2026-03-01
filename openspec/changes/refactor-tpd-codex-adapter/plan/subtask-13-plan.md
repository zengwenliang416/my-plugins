# Subtask 13 Plan

## Objective
迁移官方 skills 第 2 批：conclusion-generator、handoff-generator、requirement-parser。

## Inputs
- `.codex/skills/tpd-conclusion-generator/SKILL.md`
- `.codex/skills/tpd-handoff-generator/SKILL.md`
- `.codex/skills/tpd-requirement-parser/SKILL.md`

## Outputs
- `.agents/skills/tpd-conclusion-generator/SKILL.md`
- `.agents/skills/tpd-handoff-generator/SKILL.md`
- `.agents/skills/tpd-requirement-parser/SKILL.md`

## Execution Steps
1. 创建对应 `.agents/skills` 目录。
2. 复制三份 SKILL 文件。
3. 校验三个目录中均存在 `SKILL.md`。

## Risks
- 目录名与 skill 名不一致。

## Verification
- 三个目标文件存在且可读。
