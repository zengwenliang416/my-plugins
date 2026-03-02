# Subtask 7 Plan

## Objective
将 `thinking/plan/dev` 三个命令升级为官方 Agent Team 语义（Agent 优先），统一消息协议、ACK 规则、Hard Stop 描述与失败降级路径。

## Inputs
- `plugins/tpd/commands/thinking.md`
- `plugins/tpd/commands/plan.md`
- `plugins/tpd/commands/dev.md`

## Outputs
- 已重构的三个命令文件（frontmatter + 执行步骤）
- 兼容说明：保留 TeamCreate/TeamDelete/SendMessage，以 Agent 调度替换 Task 术语

## Execution Steps
1. 统一 frontmatter：补齐 `Agent` 到 `allowed-tools`，去除过时 Task-only 叙述。
2. 将各步骤中的 teammate 启动示例改为 `Agent(...)`，并显式要求阻塞式结果处理。
3. 统一 Task Result Handling 为 Agent 结果处理规范，明确禁止 `TaskOutput`。
4. 标准化 Hard Stop、ACK 超时、fallback policy 与并行描述。
5. 保持所有 OpenSpec 产物路径与文件名不变。

## Risks
- 术语迁移不完整导致文档内 Agent/Task 混用。
- 不小心改动产物契约，影响下游阶段消费。
- 示例语法偏差导致执行时无法正确触发 team 协作。

## Verification
- 三个命令均包含 `Agent` 调度示例与统一结果处理规则。
- 三个命令均保留既有产物清单与 Hard Stop 节点。
- 不再出现 `TaskOutput` 相关调用建议。
- `rg` 校验：commands 中 `Task(` 不应再出现。
