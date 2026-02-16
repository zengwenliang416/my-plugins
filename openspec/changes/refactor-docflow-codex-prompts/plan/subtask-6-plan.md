# Subtask 6 Plan

## Objective
将 docflow 的 prompts/skills/agents 全量同步到 `~/.codex` 对应目录并完成一致性校验。

## Inputs
- `.codex/prompts/docflow-*.md`
- `.codex/skills/docflow-*/SKILL.md`
- `.codex/agents/docflow-*.md`

## Outputs
- `~/.codex/prompts/docflow-*.md`
- `~/.codex/skills/docflow-*/SKILL.md`
- `~/.codex/agents/docflow-*.md`

## Execution Steps
1. 创建目标目录（不存在则创建）。
2. 复制文件到用户目录。
3. 使用 `diff` 校验仓库版本与用户目录一致。

## Risks
- 覆盖用户已自定义的同名文件。

## Verification
- `ls ~/.codex/{prompts,skills,agents}` 能看到 docflow 资产。
- 所有 `diff` 结果为空。
