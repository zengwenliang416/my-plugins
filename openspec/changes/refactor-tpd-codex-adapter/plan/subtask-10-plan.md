# Subtask 10 Plan

## Objective
为 OpenSpec change 补充最小 delta spec，使 `openspec validate --strict` 通过。

## Inputs
- `openspec/changes/refactor-tpd-codex-adapter/proposal.md`
- `openspec/changes/refactor-tpd-codex-adapter/tasks.md`
- `openspec/AGENTS.md`

## Outputs
- `openspec/changes/refactor-tpd-codex-adapter/specs/tpd-codex-workflow-assets/spec.md`

## Execution Steps
1. 新增 capability delta 文件并使用 `## ADDED Requirements` 头。
2. 定义至少 1 条 Requirement，且包含 `#### Scenario:`。
3. 重新执行 `openspec validate refactor-tpd-codex-adapter --strict --no-interactive`。

## Risks
- 头部格式不符合 OpenSpec 解析规则导致继续失败。

## Verification
- 新 spec delta 文件存在且包含 Requirement + Scenario。
- `openspec validate` 返回通过。
