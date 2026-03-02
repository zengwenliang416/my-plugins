# Subtask 5 Plan

## Objective
更新 gemini-cli skill 的 references 契约文档，消除角色与输出命名漂移。

## Inputs
- `codex/.agents/skills/tpd-gemini-cli/references/decision-tree.md`
- `codex/.agents/skills/tpd-gemini-cli/references/output-contract.md`
- Subtask 2 的 run script 变更结果

## Outputs
- `codex/.agents/skills/tpd-gemini-cli/references/decision-tree.md`
- `codex/.agents/skills/tpd-gemini-cli/references/output-contract.md`

## Execution Steps
1. 将 role 描述改为兼容 `constraint`（含兼容别名说明）。
2. 将 artifact 示例改为 `gemini-thought.md` 等真实下游消费命名。
3. 保留退出码语义并同步到文档。

## Risks
- 文档与脚本再次不一致。

## Verification
- references 中 role 与 artifact 字段与 run script 逻辑一致。
