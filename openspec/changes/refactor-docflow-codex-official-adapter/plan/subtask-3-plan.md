# Subtask 3 Plan

## Objective
同步首批 3 个 docflow skills 到官方 `.agents/skills`。

## Inputs
- `.codex/skills/docflow-commit/SKILL.md`
- `.codex/skills/docflow-doc-workflow/SKILL.md`
- `.codex/skills/docflow-investigate/SKILL.md`

## Outputs
- `.agents/skills/docflow-commit/SKILL.md`
- `.agents/skills/docflow-doc-workflow/SKILL.md`
- `.agents/skills/docflow-investigate/SKILL.md`

## Execution Steps
1. 按原内容同步到 `.agents/skills`。
2. 保持 frontmatter name 与 skill 目录一致。

## Risks
- 复制过程遗漏 frontmatter 导致 eval 失败。

## Verification
- 三个目标文件存在且 `name` 字段分别匹配目录名。
