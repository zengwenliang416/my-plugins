# Subtask 14 Plan

## Objective
迁移官方 skills 第 3 批：architecture-analyzer、plan-context-retriever、task-decomposer。

## Inputs
- `.codex/skills/tpd-architecture-analyzer/SKILL.md`
- `.codex/skills/tpd-plan-context-retriever/SKILL.md`
- `.codex/skills/tpd-task-decomposer/SKILL.md`

## Outputs
- `.agents/skills/tpd-architecture-analyzer/SKILL.md`
- `.agents/skills/tpd-plan-context-retriever/SKILL.md`
- `.agents/skills/tpd-task-decomposer/SKILL.md`

## Execution Steps
1. 创建三组 skills 目录。
2. 复制 SKILL 文件。
3. 运行路径存在性检查。

## Risks
- task-decomposer 目录拼写出错。

## Verification
- 三个目标文件存在且可读。
