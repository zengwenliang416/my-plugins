# Subtask 10 Plan

## Objective
重构 Thinking 阶段相关 3 个 skills（complexity-analyzer / thought-synthesizer / conclusion-generator），统一 frontmatter 与执行约束。

## Inputs
- `plugins/tpd/skills/complexity-analyzer/SKILL.md`
- `plugins/tpd/skills/thought-synthesizer/SKILL.md`
- `plugins/tpd/skills/conclusion-generator/SKILL.md`

## Outputs
- 三个技能采用一致的 Trigger/Output/Skip/Ask/Resource Usage 风格描述
- 输入缺失阻断条件、输出校验规则更清晰

## Execution Steps
1. 更新 frontmatter description 为结构化触发说明。
2. 统一章节：Purpose / Inputs / Outputs / Execution Flow / Verification。
3. 补充缺失输入的阻断与降级策略，减少歧义。

## Risks
- 误改输出文件名导致命令层找不到产物。
- depth 场景（light/deep/ultra）约束表述不完整。

## Verification
- 三个技能输出契约保持不变。
- 每个技能都明确“何时跳过/何时阻断”。
- 文档中不存在冲突字段或重复规则。
