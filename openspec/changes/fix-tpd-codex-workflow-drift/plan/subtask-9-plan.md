# Subtask 9 Plan

## Objective
统一 `codex-core` 与 `gemini-core` 两个核心代理的结构化提示词，提升稳定性并减少冗余说明。

## Inputs
- `plugins/tpd/agents/codex-core.md`
- `plugins/tpd/agents/gemini-core.md`

## Outputs
- 结构一致的双核心代理定义（Inputs/Outputs/Execution Rules/Steps/Verification）
- 明确的 ACK、失败与无嵌套 team 约束

## Execution Steps
1. 提炼公共结构并应用到两个 agent 文件。
2. 保留 role->artifact 映射，补齐失败处理和写盘校验规则。
3. 精简竞争性文案，保留必要质量标准。

## Risks
- 角色输出映射错误导致产物路径错配。
- 双代理约束不对齐导致命令层协作不稳定。

## Verification
- 两个 agent 的段落结构一致。
- 每个 role 都有唯一输出文件映射。
- 都包含 ACK 规则、写盘校验与 no nested teams 约束。
