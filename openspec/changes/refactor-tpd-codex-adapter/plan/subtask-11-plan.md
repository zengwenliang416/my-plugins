# Subtask 11 Plan

## Objective
按 Codex CLI 官方多智能体配置方式，创建 `config.toml` 和两份 agent role 配置。

## Inputs
- https://developers.openai.com/codex/cli/configuration/
- https://developers.openai.com/codex/multi-agent
- `plugins/tpd/agents/context-explorer.md`
- `plugins/tpd/agents/codex-core.md`

## Outputs
- `.codex/config.toml`
- `.codex/agents/tpd-context-explorer.toml`
- `.codex/agents/tpd-codex-core.toml`

## Execution Steps
1. 在 `.codex/config.toml` 添加 `[agents]` 与 role 注册表。
2. 为 `tpd_context_explorer` 和 `tpd_codex_core` 写官方 agent config。
3. 用 `python3` 解析 TOML，验证语法可读。

## Risks
- TOML key 与配置字段名错误导致 Codex 无法识别角色。

## Verification
- 三个文件存在。
- `python3` 能成功解析 `.codex/config.toml` 与新增 agent toml。
