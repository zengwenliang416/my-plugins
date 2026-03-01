# Subtask 2 Plan - TPD Skills Batch B

## Objective
对以下 TPD skills 完成 best-practice 改造并对齐脚本契约：
`tpd-handoff-generator`、`tpd-plan-context-retriever`、
`tpd-plan-synthesizer`、`tpd-requirement-parser`、`tpd-risk-assessor`、
`tpd-task-decomposer`、`tpd-thought-synthesizer`。

## Inputs
- 现有 `codex/.agents/skills/tpd-*` 目录。
- TPD 现有产物命名与运行目录约定。

## Outputs
- 每个 skill 的 `SKILL.md`（简化主流程 + 渐进披露）。
- 每个 skill 的 `references/decision-tree.md`、`references/output-contract.md`。
- 每个 skill 的 `scripts/run-<skill>.ts`。

## Execution Steps
1. 对齐 SKILL.md 的编号执行步骤与引用路径。
2. 在 decision-tree 中明确阻断条件与分支。
3. 在 output-contract 中定义输入、输出、状态信号。
4. 编写 TS 预检脚本，输出结构化 JSON 与明确退出码。
5. 进行最小命令行烟测并记录可追溯结果。

## Risks
- 不同阶段产物命名不一致引发误判。
- 决策树缺少兜底路径导致执行不稳定。

## Verification
- 所有脚本扩展名为 `.ts`。
- 缺失输入时脚本返回非 0 并输出可读错误。
- 满足输入时脚本输出 JSON 且包含 skill 标识与状态字段。
