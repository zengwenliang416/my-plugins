## Context

- 仓库已存在 docflow 的 Codex 迁移样板（`.codex/prompts`、`.codex/agents`、`.codex/skills`、`.codex/docflow/manifest.yaml`）。
- `plugins/tpd` 已完成命令/代理/技能合并，但尚未在 `.codex` 目录形成可直接调用的 Codex 侧资产。
- 项目规则要求多文件改动按子任务拆分，且每个子任务先写计划文档。

## Goals / Non-Goals

- Goals:
  - 将 `plugins/tpd` 映射为 `.codex` 下可检索、可校验的 TPD 资产。
  - 保留 Thinking/Plan/Dev 的核心协议与约束。
  - 复用 docflow 的 manifest + eval 校验模式。
- Non-Goals:
  - 不修改 `plugins/tpd` 原始实现。
  - 不自动更新 llmdoc 文档内容。
  - 不同步到 `~/.codex` 用户目录。

## Decisions

- Decision: 采用 Option A，完全遵循 docflow 迁移结构。
- Decision: 技能仅迁移 `SKILL.md`，不复制大规模 references/assets/scripts，避免超出本次迁移范围。
- Decision: 使用 `.codex/tpd/evals/check_tpd_assets.py` 做静态门禁，校验文件存在、命名一致、协议完整与关键约束词。

## Risks / Trade-offs

- 风险：不复制 references/assets 可能降低部分技能的本地独立性。
  - 缓解：在技能文本中保留原路径提示，后续若需要可做第二阶段资源下沉。
- 风险：TPD 文档与当前实现已有漂移（10 agents vs 3 agents）。
  - 缓解：以 `plugins/tpd` 当前代码为单一事实源。

## Migration Plan

1. 创建 OpenSpec change 与分批 `subtask-*-plan.md`。
2. 先迁移 prompts + manifest/cases。
3. 再迁移 agents + eval harness。
4. 最后分批迁移 14 个 skills。
5. 运行统一静态检查并整理交付说明。

## Open Questions

- 是否需要在后续阶段把 `.codex/tpd/*` 同步到 `~/.codex/tpd/*`。
