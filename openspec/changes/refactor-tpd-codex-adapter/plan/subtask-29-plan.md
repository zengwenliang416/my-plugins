# Subtask 29 Plan

## Objective
更新 TPD OpenSpec 文档以声明官方路径唯一事实源并记录 legacy 清理。

## Inputs
- `openspec/changes/refactor-tpd-codex-adapter/proposal.md`
- `openspec/changes/refactor-tpd-codex-adapter/tasks.md`
- `openspec/changes/refactor-tpd-codex-adapter/specs/tpd-codex-workflow-assets/spec.md`

## Outputs
- 更新后的 `proposal.md`
- 更新后的 `tasks.md`
- 更新后的 `spec.md`

## Execution Steps
1. proposal 中补充删除 legacy `.md` agents 与 `.codex/skills/tpd-*`。
2. tasks 新增 Legacy Cleanup 分组并记录完成状态。
3. spec 将路径约束改为 `.codex/agents/tpd-*.toml` + `.agents/skills/tpd-*`，并新增“无 legacy 副本”场景。

## Risks
- 文档描述与当前文件系统状态不一致。

## Verification
- OpenSpec 文档引用的路径全部存在或已标记 removed。
- `openspec validate refactor-tpd-codex-adapter --strict --no-interactive` 通过。
