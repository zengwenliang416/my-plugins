# Subtask 12 Plan

## Objective
重构收敛与交付类 skills（risk-assessor / plan-synthesizer / handoff-generator），强化输出契约与校验。

## Inputs
- `plugins/tpd/skills/risk-assessor/SKILL.md`
- `plugins/tpd/skills/plan-synthesizer/SKILL.md`
- `plugins/tpd/skills/handoff-generator/SKILL.md`

## Outputs
- 风险、计划、交接三个关键产物技能说明统一
- 产物缺失时的错误语义更明确

## Execution Steps
1. 统一 frontmatter 与章节结构。
2. 明确每个技能的必需输入、输出与失败策略。
3. 对齐下游命令对 artifacts 的依赖关系。

## Risks
- handoff manifest 规则遗漏导致 plan 阶段消费失败。
- risk 输出字段不完整影响计划决策质量。

## Verification
- 三个技能都保留原有输出文件名。
- 每个技能包含可执行验证条款。
- 与 commands 的调用参数保持一致。
