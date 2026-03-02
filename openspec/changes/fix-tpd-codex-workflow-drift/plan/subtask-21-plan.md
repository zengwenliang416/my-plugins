# Subtask 21 Plan

## Objective
把模式默认值固化到命令层：`thinking=ultra`、`plan=fullstack`，并明确“模式不通过参数控制”。

## Inputs
- `plugins/tpd/commands/thinking.md`
- `plugins/tpd/commands/plan.md`

## Outputs
- thinking 命令明确默认 depth=ultra 且不走参数切换
- plan 命令明确默认 task_type=fullstack 且不走参数切换

## Execution Steps
1. 更新 Parameter Policy，写明模式不由参数控制。
2. 将 thinking 的深度路由文案改为“诊断记录 + 固定 ultra 默认”。
3. 将 plan 的 task_type 文案改为“固定 fullstack 默认”。
4. 保留 OpenSpec 最小产物与 Hard Stop 逻辑。

## Risks
- 文案更新不完整导致仍残留“可通过参数选择模式”的暗示。
- 固定默认后与 fallback 描述冲突。

## Verification
- 两个命令的 argument-hint 不包含 mode 参数。
- 文档中明确出现默认 `ultra` 与默认 `fullstack`。
- `TaskOutput` 禁用和 Team 规则仍存在。
