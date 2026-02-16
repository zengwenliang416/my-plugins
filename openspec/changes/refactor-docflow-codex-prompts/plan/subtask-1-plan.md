# Subtask 1 Plan

## Objective
在仓库内新增 Codex prompts，落地 `/prompts:docflow-init-doc`、`/prompts:docflow-with-scout`、`/prompts:docflow-what` 三个入口。

## Inputs
- `plugins/docflow/commands/init-doc.md`
- `plugins/docflow/commands/with-scout.md`
- `plugins/docflow/commands/what.md`
- `plugins/docflow/agents/*.md`

## Outputs
- `.codex/prompts/docflow-init-doc.md`
- `.codex/prompts/docflow-with-scout.md`
- `.codex/prompts/docflow-what.md`

## Execution Steps
1. 提取原命令的阶段步骤、消息协议和关键约束。
2. 生成对应 Codex prompt 文本，保持行为等价。
3. 明确子代理优先、不可用时降级到单代理。

## Risks
- Codex 环境的子代理能力在不同版本上存在差异。
- 旧命令语义迁移时可能遗漏约束。

## Verification
- 检查三个 prompt 文件存在且命名正确。
- 文件内容包含文档优先、结构化消息、2 轮封顶约束。
