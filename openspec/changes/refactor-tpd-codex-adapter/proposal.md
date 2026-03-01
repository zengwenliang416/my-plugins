# Change: Refactor TPD to Codex CLI Workflow Assets

## Why

`plugins/tpd` 目前仍是 Claude 插件形态，缺少与仓库现有 `.codex` 体系一致的
Codex CLI 入口与资产组织，导致 TPD 在 Codex 侧不可直接复用。

## What Changes

- 新增 TPD 的 Codex prompts（`tpd-init`、`tpd-thinking`、`tpd-plan`、`tpd-dev`）。
- 新增 TPD 的官方 Codex agents role 配置（`tpd-context-explorer`、`tpd-codex-core`、`tpd-gemini-core`）。
- 新增 TPD 的官方 skills（14 个 `tpd-*` 前缀技能，位于 `.agents/skills/`）。
- 清理 legacy 复制资产：`.codex/agents/tpd-*.md` 与 `.codex/skills/tpd-*`。
- 新增 `.codex/tpd/manifest.yaml` 与 eval harness（`cases.yaml`、`check_tpd_assets.py`、`README.md`）。
- 保留 TPD 三阶段消息协议、TaskResultHandling 约束与硬停点语义。

## Impact

- Affected specs: 暂无新增 capability spec，仅新增 Codex 侧工作流资产。
- Affected code:
  - `.codex/prompts/*`
  - `.codex/agents/*.toml`
  - `.agents/skills/tpd-*/`
  - `.codex/agents/tpd-*.md`（removed）
  - `.codex/skills/tpd-*`（removed）
  - `.codex/tpd/*`
