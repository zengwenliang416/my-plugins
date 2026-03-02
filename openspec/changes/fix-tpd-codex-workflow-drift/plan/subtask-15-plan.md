# Subtask 15 Plan

## Objective
按 OpenSpec 严格校验最小要求，收敛 TPD 三个核心命令的“必需参数/必需中间产物”定义，去掉不必要参数依赖。

## Inputs
- `plugins/tpd/commands/thinking.md`
- `plugins/tpd/commands/plan.md`
- `plugins/tpd/commands/dev.md`
- OpenSpec 约束依据：`openspec/changes/refactor-plugin-artifact-directory/specs/plugin-artifact-storage/spec.md`

## Outputs
- 三个命令文件中的 `argument-hint` 最小化
- `Required Artifacts` 改为最小必需集合，扩展产物改为 Optional
- 明确 OpenSpec chain 的硬约束来源

## Execution Steps
1. 将命令参数提示改为最小输入（以 problem/proposal/scope 为主）。
2. 仅保留 OpenSpec 严格校验或下游阶段消费所需产物为 Required。
3. 将日志/诊断/双模型分析等重产物移入 Optional。
4. 保持 Team 协作语义和 Hard Stop 节点不变。

## Risks
- 过度精简导致下游步骤描述不完整。
- Required/Optional 划分不当影响串联体验。

## Verification
- 三个命令 `argument-hint` 不再暴露多余参数。
- Required 中至少包含 OpenSpec 根产物硬约束。
- `openspec validate --strict` 的最小约束在文档中可见。
