# Subtask 17 Plan

## Objective
将 TPD 清单与校验脚本切换到官方目录结构（`.agents/skills` + `.codex/config.toml` + agent toml）。

## Inputs
- `.codex/config.toml`
- `.codex/agents/tpd-*.toml`
- `.agents/skills/tpd-*/SKILL.md`
- `.codex/tpd/manifest.yaml`
- `.codex/tpd/evals/check_tpd_assets.py`
- `.codex/tpd/evals/README.md`

## Outputs
- `.codex/tpd/manifest.yaml`
- `.codex/tpd/evals/check_tpd_assets.py`
- `.codex/tpd/evals/README.md`

## Execution Steps
1. 将 manifest 的 skills 路径更新为 `.agents/skills`。
2. 将 agents 路径更新为 `.codex/agents/*.toml` 并新增 `codex_config` 条目。
3. 更新校验脚本以校验官方路径、`config.toml` role 注册、agent toml 基本字段。

## Risks
- 校验脚本仍按旧 markdown-agent 逻辑检查导致误报。

## Verification
- `python3 .codex/tpd/evals/check_tpd_assets.py` 返回 PASS。
- 校验结果包含 `checks_failed = 0`。
