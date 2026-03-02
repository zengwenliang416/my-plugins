# Change: Fix TPD Codex Bundle Workflow Drift

## Why

`codex/.codex/prompts/tpd-*` 与 `plugins/tpd/commands/*` 出现执行语义漂移，
并且 `tpd-codex-cli`/`tpd-gemini-cli` 在 codex bundle 中缺少可执行调用脚本，
导致 TPD 在 Codex 用户级安装后表现不稳定或停留在元数据层。

## What Changes

- 对齐 `codex/.codex/prompts/tpd-thinking|tpd-plan|tpd-dev.md` 与 `plugins/tpd/commands/*` 的关键执行细节。
- 修复 `tpd-codex-cli` 与 `tpd-gemini-cli` 的角色与产物命名契约（补齐 `constraint` 路由）。
- 补齐 `codex/.agents/skills/tpd-*-cli/scripts/invoke-*.ts` 可执行脚本。
- 更新相关 references 输出契约，避免文档与实现再漂移。

## Impact

- Affected code:
  - `codex/.codex/prompts/tpd-*.md`
  - `codex/.agents/skills/tpd-codex-cli/*`
  - `codex/.agents/skills/tpd-gemini-cli/*`
- Affected behavior:
  - `/prompts:tpd-thinking|tpd-plan|tpd-dev` 执行稳定性
  - `tpd-codex-cli` / `tpd-gemini-cli` 调用闭环
