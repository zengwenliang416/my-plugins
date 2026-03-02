# Subtask 18 Plan

## Objective
收敛 dev/plan 下游技能参数，减少需要显式传参的入口。

## Inputs
- `plugins/tpd/skills/plan-synthesizer/SKILL.md`
- `plugins/tpd/skills/context-retriever/SKILL.md`
- `plugins/tpd/skills/code-implementer/SKILL.md`

## Outputs
- skills 参数默认仅需 `run_dir`
- 其余上下文由工件/目录自动推导

## Execution Steps
1. 精简 arguments 字段。
2. 增补 Parameter Policy 说明自动推导策略。
3. 保持输出契约与命令调用兼容。

## Risks
- 自动推导描述不充分导致执行分支不明确。

## Verification
- 三个技能参数数量下降。
- 输出文件约定保持不变。
