# Change: Hard Cutover to OpenSpec Artifact Governance for All Plugins

## Why

`plugins` 当前运行产物历史上分散在 `.claude/*/runs/*` 与多种临时目录策略，导致路径不统一、阶段产物复制冗余、清理与追溯困难。为了降低长期维护成本并统一治理，需要将所有插件强制切换到 OpenSpec change 工作区（spec/change-only）模式。

## What Changes

- 建立 OpenSpec 统一工作区协议：以 `openspec/changes/<change-id>/` 作为唯一工作区根。
- 对 `plugins/tpd` 先完成试点重构：去除 thinking→plan→dev 的跨阶段复制，改为 manifest 引用。
- 将所有插件命令中的运行目录写入逻辑切换到 OpenSpec change 根路径（不使用独立 `.runtime` 或 `artifacts` 层）。
- 删除旧 `.claude/*/runs/*` 运行时写入与读取回退逻辑（无双读兼容）。
- 增加强切换门禁：若阶段前置产物缺失则直接失败并提示。
- 增加生命周期治理：历史 `.claude/*/runs/*` 存量一次性归档/清理策略。

## Impact

- Affected specs:
  - `artifact-governance` (new capability delta)
  - `workflow-lifecycle` (new capability delta)
- Affected code (primary):
  - `plugins/tpd/commands/{thinking,plan,dev}.md`
  - `plugins/*/commands/*.md`（涉及 RUN_DIR/.claude 路径的插件）
  - `llmdoc/architecture/workflow-orchestration.md`
  - `llmdoc/reference/coding-conventions.md`
- **BREAKING**:
  - 切换后不再支持历史 `.claude/*/runs/*` 作为运行时输入。
  - 缺失 OpenSpec 阶段产物将直接中断执行。
