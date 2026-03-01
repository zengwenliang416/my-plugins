# Subtask 16 Plan

## Objective
迁移官方 skills 第 5 批：code-implementer、codex-cli、gemini-cli。

## Inputs
- `.codex/skills/tpd-code-implementer/SKILL.md`
- `.codex/skills/tpd-codex-cli/SKILL.md`
- `.codex/skills/tpd-gemini-cli/SKILL.md`

## Outputs
- `.agents/skills/tpd-code-implementer/SKILL.md`
- `.agents/skills/tpd-codex-cli/SKILL.md`
- `.agents/skills/tpd-gemini-cli/SKILL.md`

## Execution Steps
1. 创建三个目标目录。
2. 复制三份 SKILL 文件。
3. 校验关键脚本引用仍存在（invoke-codex.ts / invoke-gemini.ts）。

## Risks
- CLI skill 脚本引用被破坏。

## Verification
- 三个目标文件存在。
- CLI skill 文件包含 `invoke-codex.ts` 与 `invoke-gemini.ts`。
