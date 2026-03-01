# Subtask 4 Plan

## Objective
同步剩余 2 个 docflow skills，并迁移 doc-workflow 的一个 reference 文件。

## Inputs
- `.codex/skills/docflow-read-doc/SKILL.md`
- `.codex/skills/docflow-update-doc/SKILL.md`
- `.codex/skills/docflow-doc-workflow/references/doc-conventions.md`

## Outputs
- `.agents/skills/docflow-read-doc/SKILL.md`
- `.agents/skills/docflow-update-doc/SKILL.md`
- `.agents/skills/docflow-doc-workflow/references/doc-conventions.md`

## Execution Steps
1. 同步 2 个 SKILL 文件到官方路径。
2. 同步 doc-workflow 引用文档一份，避免相对路径失效。

## Risks
- references 未同步完全造成运行时读取失败。

## Verification
- 3 个目标文件存在且内容与源文件一致。
