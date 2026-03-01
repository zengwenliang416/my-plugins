# Subtask 5 Plan

## Objective
迁移 Thinking 阶段 3 个 skills：complexity-analyzer、thought-synthesizer、conclusion-generator。

## Inputs
- `plugins/tpd/skills/complexity-analyzer/SKILL.md`
- `plugins/tpd/skills/thought-synthesizer/SKILL.md`
- `plugins/tpd/skills/conclusion-generator/SKILL.md`

## Outputs
- `.codex/skills/tpd-complexity-analyzer/SKILL.md`
- `.codex/skills/tpd-thought-synthesizer/SKILL.md`
- `.codex/skills/tpd-conclusion-generator/SKILL.md`

## Execution Steps
1. 复制原 SKILL 文本并保留流程语义。
2. frontmatter `name` 增加 `tpd-` 前缀。
3. 将技能内部 `tpd:` 调用风格替换为 `tpd-` 风格。

## Risks
- name 未统一前缀导致 manifest 校验失败。
- 技能内链未替换导致后续调用歧义。

## Verification
- 三个目标 SKILL 文件存在。
- 三个 frontmatter `name` 与目标目录一致。
