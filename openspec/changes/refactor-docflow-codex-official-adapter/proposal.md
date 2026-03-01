# Change: Refactor Docflow to Official Codex CLI Multi-Agent Layout

## Why

当前 docflow 主要仍使用 `.codex/agents/*.md` 与 `.codex/skills/*` 的旧形态。
用户已确认要对齐 Codex CLI 官方多智能体方案，需要统一到
`[agents] + role TOML + .agents/skills` 的结构。

## What Changes

- 在 `.codex/config.toml` 注册 docflow 官方 role。
- 新增 `.codex/agents/docflow-*.toml` 角色配置。
- 将 docflow skills 同步到官方 `.agents/skills/docflow-*`。
- 删除 legacy 复制资产：`.codex/agents/docflow-*.md` 与 `.codex/skills/docflow-*`。
- 更新 `.codex/docflow/manifest.yaml` 与 eval harness，校验官方路径与模型配置。
- 更新 docflow 使用文档中的 Source of Truth 路径说明。

## Impact

- Affected specs: `docflow-codex-workflow-assets`
- Affected code:
  - `.codex/config.toml`
  - `.codex/agents/docflow-*.toml`
  - `.agents/skills/docflow-*/`
  - `.codex/agents/docflow-*.md`（removed）
  - `.codex/skills/docflow-*`（removed）
  - `.codex/docflow/*`
  - `llmdoc/guides/how-to-use-docflow-in-codex.md`
