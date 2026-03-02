# Subtask 8 Plan

## Objective
对齐初始化命令与插件总说明，并统一 `context-explorer` 代理提示词结构，确保 Team 术语与约束一致。

## Inputs
- `plugins/tpd/commands/init.md`
- `plugins/tpd/CLAUDE.md`
- `plugins/tpd/agents/context-explorer.md`

## Outputs
- 更新后的 init 命令流程（更明确的检查/Hard Stop/输出）
- 更新后的 TPD 插件级规则说明（Agent Team 语义与兼容注记）
- 结构化的 context-explorer 代理规范

## Execution Steps
1. 重写 `init.md`：保留现有能力，补齐 readiness 报告字段和失败处理。
2. 更新 `CLAUDE.md`：将 Task-only 表述改为 Agent 优先，并保留兼容 fallback。
3. 标准化 `context-explorer.md` 的输入、输出、步骤、通信与验证条款。

## Risks
- 插件级规则与命令文档不一致。
- 代理输入输出契约描述变动造成上下游引用偏差。

## Verification
- 三个文件中的 Team 协作术语一致。
- `CLAUDE.md` 明确 no nested teams 与 `TaskOutput` 禁用。
- `context-explorer` 输出契约仍为 `explore-*.json` / `context.md`。
