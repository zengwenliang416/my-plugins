# Subtask 25 Plan

## Objective
删除 TPD legacy skills 第 2 批（3 文件）。

## Inputs
- `.codex/skills/tpd-complexity-analyzer/SKILL.md`
- `.codex/skills/tpd-conclusion-generator/SKILL.md`
- `.codex/skills/tpd-context-retriever/SKILL.md`

## Outputs
- 3 个 legacy skill 文件被删除

## Execution Steps
1. 删除上述 3 个 legacy skill。
2. 对照官方 `.agents/skills` 验证同名文件可用。

## Risks
- 批次删除后遗留半迁移状态。

## Verification
- 3 个 legacy 文件不存在。
- 对应官方 skill 文件存在。
