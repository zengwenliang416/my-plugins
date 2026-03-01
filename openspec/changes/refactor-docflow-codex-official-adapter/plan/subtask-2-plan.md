# Subtask 2 Plan

## Objective
创建余下 2 个 docflow role TOML（recorder/worker）。

## Inputs
- `.codex/agents/docflow-recorder.md`
- `.codex/agents/docflow-worker.md`

## Outputs
- `.codex/agents/docflow-recorder.toml`
- `.codex/agents/docflow-worker.toml`

## Execution Steps
1. 迁移 recorder/worker 核心职责与消息契约为 TOML developer_instructions。
2. 固定模型 profile：`gpt-5.3-codex` + `xhigh`。

## Risks
- 指令压缩过度导致行为约束丢失。

## Verification
- 两个 TOML 文件存在且字段完整。
- developer_instructions 中保留关键消息类型。
