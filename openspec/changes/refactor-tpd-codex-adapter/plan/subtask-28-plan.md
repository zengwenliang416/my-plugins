# Subtask 28 Plan

## Objective
删除 TPD legacy skills 第 5 批（2 文件）并清理空目录。

## Inputs
- `.codex/skills/tpd-task-decomposer/SKILL.md`
- `.codex/skills/tpd-thought-synthesizer/SKILL.md`

## Outputs
- 2 个 legacy skill 文件被删除
- `.codex/skills/tpd-*` 空目录被清理

## Execution Steps
1. 删除剩余 2 个 legacy skill 文件。
2. 仅清理 `.codex/skills/` 下空的 `tpd-*` 目录。
3. 验证 `.codex/skills` 不再存在 `tpd-*` 目录。

## Risks
- 目录清理范围过宽误删非目标目录。

## Verification
- `find .codex/skills -maxdepth 1 -name "tpd-*"` 返回空。
- 官方 `.agents/skills/tpd-*` 保持完整。
