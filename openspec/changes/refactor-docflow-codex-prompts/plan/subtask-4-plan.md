# Subtask 4 Plan

## Objective
在仓库内新增 docflow 的 Codex skills 目录与内容，覆盖 commit/doc-workflow/investigate/read-doc/update-doc。

## Inputs
- `plugins/docflow/skills/commit/SKILL.md`
- `plugins/docflow/skills/doc-workflow/SKILL.md`
- `plugins/docflow/skills/investigate/SKILL.md`
- `plugins/docflow/skills/read-doc/SKILL.md`
- `plugins/docflow/skills/update-doc/SKILL.md`

## Outputs
- `.codex/skills/docflow-commit/SKILL.md`
- `.codex/skills/docflow-doc-workflow/SKILL.md`
- `.codex/skills/docflow-investigate/SKILL.md`
- `.codex/skills/docflow-read-doc/SKILL.md`
- `.codex/skills/docflow-update-doc/SKILL.md`

## Execution Steps
1. 保留原技能职责与流程，改名为 `docflow-*` 以避免命名冲突。
2. 将命令引用升级为 `/prompts:docflow-*` 命名。
3. 保留文档优先与最小必要工具约束。

## Risks
- 与现有全局技能同名冲突。
- 命令引用仍指向旧 `/docflow:*` 导致歧义。

## Verification
- 5 个 skill 文件均可读且 frontmatter 完整。
- 文内关键入口已使用 `/prompts:docflow-*`。
