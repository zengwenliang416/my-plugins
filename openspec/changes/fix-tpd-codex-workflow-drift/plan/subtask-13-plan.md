# Subtask 13 Plan

## Objective
重构执行上下文与落地实现类 skills（context-retriever / plan-context-retriever / code-implementer），提升证据链与安全落地规则清晰度。

## Inputs
- `plugins/tpd/skills/context-retriever/SKILL.md`
- `plugins/tpd/skills/plan-context-retriever/SKILL.md`
- `plugins/tpd/skills/code-implementer/SKILL.md`

## Outputs
- 两个 context 技能统一 evidence-first 描述
- code-implementer 明确“原型 diff -> 审核 -> 落地”边界

## Execution Steps
1. 统一三个技能的 frontmatter 与流程章节。
2. 对 context 技能补齐输入来源和缺失处理。
3. 对 code-implementer 强化安全门禁、变更摘要与验证要求。

## Risks
- context 输出不稳定导致 dev 阶段失去可追溯性。
- code-implementer 边界不清导致直接应用外部输出。

## Verification
- context 类技能都要求可追溯文件/符号证据。
- code-implementer 明确禁止越权改动并要求生成 `changes.md`。
- 三个技能参数与命令调用保持一致。
