# Subtask 6 Plan

## Objective
迁移桥接到 Plan 的 3 个 skills：handoff-generator、requirement-parser、architecture-analyzer。

## Inputs
- `plugins/tpd/skills/handoff-generator/SKILL.md`
- `plugins/tpd/skills/requirement-parser/SKILL.md`
- `plugins/tpd/skills/architecture-analyzer/SKILL.md`

## Outputs
- `.codex/skills/tpd-handoff-generator/SKILL.md`
- `.codex/skills/tpd-requirement-parser/SKILL.md`
- `.codex/skills/tpd-architecture-analyzer/SKILL.md`

## Execution Steps
1. 复制并保留原技能步骤与输入输出契约。
2. 更新 frontmatter `name` 为 `tpd-*`。
3. 统一技能内 `tpd:` 引用为 `tpd-`。

## Risks
- handoff 相关路径或模板引用语义丢失。

## Verification
- 三个目标 SKILL 文件存在且 name 正确。
- `tpd-requirement-parser` 与 `tpd-architecture-analyzer` 的 `run_dir` 参数保留。
