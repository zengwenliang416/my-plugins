# Subtask 23 Plan

## Objective
删除 TPD legacy markdown agents（3 文件），仅保留官方 TOML roles。

## Inputs
- `.codex/agents/tpd-context-explorer.md`
- `.codex/agents/tpd-codex-core.md`
- `.codex/agents/tpd-gemini-core.md`

## Outputs
- 3 个 legacy agent 文件被删除

## Execution Steps
1. 确认官方 role 文件 `.codex/agents/tpd-*.toml` 已存在。
2. 删除 3 个 `.md` agent 副本。
3. 快速扫描确保 `manifest` 与 `config.toml` 未引用 `.md` agents。

## Risks
- 删除错误路径影响非 TPD 资产。

## Verification
- `find .codex/agents -name "tpd-*.md"` 返回空。
- `python3 .codex/tpd/evals/check_tpd_assets.py` 通过。
