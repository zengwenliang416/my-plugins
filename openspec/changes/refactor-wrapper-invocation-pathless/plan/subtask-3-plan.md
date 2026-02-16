# Subtask 3 Plan

## Objective
迁移活跃文档和配方中的旧绝对路径调用。

## Inputs
- 子任务 1 清单中的文档文件

## Outputs
- 更新后的 docs/recipes 示例命令

## Execution Steps
1. 将 `~/.claude/bin/codeagent-wrapper` 替换为 pathless 调用或脚本入口。
2. 保持示例语义不变。
3. 避免改动历史记录文件。

## Risks
- 文档遗漏导致用户继续复制旧路径。

## Verification
- 活跃文档检索无旧路径残留。
