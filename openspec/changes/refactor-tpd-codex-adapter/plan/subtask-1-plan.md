# Subtask 1 Plan

## Objective
迁移 TPD 三个核心阶段命令为 Codex prompts：`tpd-thinking`、`tpd-plan`、`tpd-dev`。

## Inputs
- `plugins/tpd/commands/thinking.md`
- `plugins/tpd/commands/plan.md`
- `plugins/tpd/commands/dev.md`

## Outputs
- `.codex/prompts/tpd-thinking.md`
- `.codex/prompts/tpd-plan.md`
- `.codex/prompts/tpd-dev.md`

## Execution Steps
1. 提取原命令中的 Purpose、Required Constraints、Message Protocol、Task Result Handling 与 Hard Stop。
2. 转写为 Codex prompt 语义，统一使用 `tpd-*` 命名。
3. 保留阶段产物清单、并行协作约束与 fallback 策略。

## Risks
- 迁移时遗漏协议字段或 Hard Stop 条件。
- `tpd:` 前缀未统一替换为 `tpd-` 造成调用歧义。

## Verification
- 三个 prompt 文件存在且可读。
- 每个 prompt 均包含消息协议与 `TaskOutput` 禁用约束。
- 每个 prompt 均保留至少一个 Hard Stop 条件描述。
