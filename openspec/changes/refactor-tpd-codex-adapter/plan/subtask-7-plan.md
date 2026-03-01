# Subtask 7 Plan

## Objective
迁移 Plan 中段 3 个 skills：plan-context-retriever、task-decomposer、risk-assessor。

## Inputs
- `plugins/tpd/skills/plan-context-retriever/SKILL.md`
- `plugins/tpd/skills/task-decomposer/SKILL.md`
- `plugins/tpd/skills/risk-assessor/SKILL.md`

## Outputs
- `.codex/skills/tpd-plan-context-retriever/SKILL.md`
- `.codex/skills/tpd-task-decomposer/SKILL.md`
- `.codex/skills/tpd-risk-assessor/SKILL.md`

## Execution Steps
1. 复制并改写 `name` 为 `tpd-*`。
2. 保留参数定义、风险评估和任务分解逻辑描述。
3. 替换技能内旧 `tpd:` 调用标记。

## Risks
- task_type 参数或输出文件约束缺失。

## Verification
- 三个目标 SKILL 文件存在且 name 正确。
- `tpd-task-decomposer` 保留 `task_type` 参数。
