# Subtask 18 Plan

## Objective
将 TPD 官方 agent TOML 的模型配置统一为 `gpt-5.3-codex` + `xhigh`。

## Inputs
- `.codex/agents/tpd-context-explorer.toml`
- `.codex/agents/tpd-codex-core.toml`
- `.codex/agents/tpd-gemini-core.toml`

## Outputs
- `.codex/agents/tpd-context-explorer.toml`
- `.codex/agents/tpd-codex-core.toml`
- `.codex/agents/tpd-gemini-core.toml`

## Execution Steps
1. 将 `model = "gpt-5"` 改为 `model = "gpt-5.3-codex"`。
2. 将 `model_reasoning_effort = "high"` 改为 `model_reasoning_effort = "xhigh"`。
3. 用 `rg` 校验三文件字段一致。

## Risks
- 字段名误改导致 Codex 无法识别 role config。

## Verification
- 三个 TOML 文件都出现 `model = "gpt-5.3-codex"`。
- 三个 TOML 文件都出现 `model_reasoning_effort = "xhigh"`。
