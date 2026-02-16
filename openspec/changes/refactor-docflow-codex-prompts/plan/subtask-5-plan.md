# Subtask 5 Plan

## Objective
在仓库内新增 docflow 的 Codex agents 规范文件，并扩展适配文档包含 Skills/Agents 映射。

## Inputs
- `plugins/docflow/agents/investigator.md`
- `plugins/docflow/agents/scout.md`
- `plugins/docflow/agents/recorder.md`
- `plugins/docflow/agents/worker.md`
- `plugins/docflow/CODEX-ADAPTER.md`

## Outputs
- `.codex/agents/docflow-investigator.md`
- `.codex/agents/docflow-scout.md`
- `.codex/agents/docflow-recorder.md`
- `.codex/agents/docflow-worker.md`
- 更新 `plugins/docflow/CODEX-ADAPTER.md`

## Execution Steps
1. 迁移 agent 的职责、输入输出格式、消息协议。
2. 在适配文档补充 Skills/Agents 路由映射。
3. 保留 2 轮修复上限与升级规则。

## Risks
- Codex 版本对 agents 的加载约定可能不同。

## Verification
- 4 个 agent 文件存在且包含输入输出契约。
- 适配文档包含 commands/skills/agents 三层映射。
