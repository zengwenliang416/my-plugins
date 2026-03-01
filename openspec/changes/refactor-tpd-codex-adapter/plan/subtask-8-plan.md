# Subtask 8 Plan

## Objective
迁移 Plan 收敛与 Dev 执行相关 3 个 skills：plan-synthesizer、context-retriever、code-implementer。

## Inputs
- `plugins/tpd/skills/plan-synthesizer/SKILL.md`
- `plugins/tpd/skills/context-retriever/SKILL.md`
- `plugins/tpd/skills/code-implementer/SKILL.md`

## Outputs
- `.codex/skills/tpd-plan-synthesizer/SKILL.md`
- `.codex/skills/tpd-context-retriever/SKILL.md`
- `.codex/skills/tpd-code-implementer/SKILL.md`

## Execution Steps
1. 复制 3 个 SKILL 文件并改写 `name` 前缀。
2. 保留 Dev 阶段的副作用审查与重构约束。
3. 替换技能内部 `tpd:` 调用标记。

## Risks
- code-implementer 中对模型技能调用名称未同步。

## Verification
- 三个目标 SKILL 文件存在且 name 正确。
- `tpd-code-implementer` 内已出现 `tpd-codex-cli` / `tpd-gemini-cli`。
