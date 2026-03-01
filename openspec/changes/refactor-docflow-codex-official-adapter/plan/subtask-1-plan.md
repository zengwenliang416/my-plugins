# Subtask 1 Plan

## Objective
建立 docflow 官方 role 注册入口，并创建首批 2 个 role TOML。

## Inputs
- `.codex/config.toml`
- `.codex/agents/docflow-investigator.md`
- `.codex/agents/docflow-scout.md`

## Outputs
- `.codex/config.toml`
- `.codex/agents/docflow-investigator.toml`
- `.codex/agents/docflow-scout.toml`

## Execution Steps
1. 在 `.codex/config.toml` 增加 docflow role 段落。
2. 基于现有 md agent 语义生成 investigator/scout TOML。
3. 固定模型 profile：`gpt-5.3-codex` + `xhigh`。

## Risks
- role name 与 config key 不一致导致无法调用。

## Verification
- `.codex/config.toml` 出现 `[agents.docflow_investigator]`、`[agents.docflow_scout]`。
- 两个 TOML 文件包含 `model`、`model_reasoning_effort`、`sandbox_mode`、`developer_instructions`。
