# Subtask 11 Plan

## Objective
重构 Plan 核心分解链路 skills（requirement-parser / architecture-analyzer / task-decomposer），统一决策与验证语义。

## Inputs
- `plugins/tpd/skills/requirement-parser/SKILL.md`
- `plugins/tpd/skills/architecture-analyzer/SKILL.md`
- `plugins/tpd/skills/task-decomposer/SKILL.md`

## Outputs
- 三个技能的前后置依赖更明确
- 缺失输入时阻断策略和可恢复策略统一

## Execution Steps
1. 按同一模板重写三个技能文档。
2. 保留既有产物命名（requirements/architecture/constraints/tasks/pbt）。
3. 增加 task_type 分支和冲突记录规则。

## Risks
- task_type 分支规则不一致导致后续 plan-synthesizer 失败。
- requirements/architecture 产物规范不完整。

## Verification
- 三个技能的 Inputs/Outputs 与现有命令引用一致。
- 明确标注了阻断条件与验证检查点。
- `task_type` 默认值和分支行为已写明。
