# Subtask 24 Plan

## Objective
删除 TPD legacy skills 第 1 批（3 文件）。

## Inputs
- `.codex/skills/tpd-architecture-analyzer/SKILL.md`
- `.codex/skills/tpd-code-implementer/SKILL.md`
- `.codex/skills/tpd-codex-cli/SKILL.md`

## Outputs
- 3 个 legacy skill 文件被删除

## Execution Steps
1. 删除上述 3 个 `.codex/skills` 下文件。
2. 确认 `.agents/skills` 对应文件存在。

## Risks
- 官方目录缺失会导致功能回退失败。

## Verification
- 3 个 legacy 文件不存在。
- `.agents/skills` 对应 3 个 `SKILL.md` 存在。
