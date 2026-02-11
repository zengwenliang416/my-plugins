## Context

仓库内插件命令对运行目录的处理不一致：历史上存在 `.claude/*/runs/*` 及多种运行目录策略。现状缺少统一治理边界，跨阶段依赖通过复制文件实现，造成重复产物与治理成本上升。

## Goals / Non-Goals

- Goals:
  - 全插件统一到 OpenSpec 产物路径。
  - 阶段间依赖通过 manifest/lineage 引用，不通过复制。
  - 建立可验证的生命周期治理（保留、归档、清理）。
- Non-Goals:
  - 不提供旧路径双读兼容。
  - 不重构插件业务语义。

## Decisions

- Decision: 使用 OpenSpec change 根目录作为单一事实源。
  - Path: `openspec/changes/<change-id>/`
  - Rationale: 直接绑定 spec/change 生命周期，避免额外运行时目录层级。

- Decision: 每阶段必须写 `artifact-manifest.json`。
  - 字段最小集合：`workflow`, `run_id`, `phase`, `generated_at`, `artifacts[]`, `status`, `depends_on[]`。
  - Rationale: 让下游阶段按索引读取，不再猜测文件命名。

- Decision: 引入 `lineage.json`，记录跨阶段来源。
  - Rationale: 支撑可审计、可定位、可回放。

- Decision: Hard Cutover（强切换）。
  - 切换后禁止 `.claude/*/runs/*`、`.runtime/*`、`openspec/changes/*/artifacts/*` 运行时路径。
  - Rationale: 消除长期双轨维护成本。

- Decision: 失败策略为 fail-fast。
  - 若上游 manifest 或必需产物缺失，立即中断并输出明确修复建议。

## Plugin Migration Order

1. TPD（试点）：`thinking.md`, `plan.md`, `dev.md`
2. High Value：`commit`, `brainstorm`, `ui-design`
3. Risky Paths：`code-review`, `bug-investigation`（含绝对路径）
4. Remaining：`plan-execute`, `security-audit`, `database-design`, `tdd`, `feature-impl`, `refactor`, `refactor-team`, `context-memory`, `docflow`

## Risks / Trade-offs

- 历史 run 无法直接恢复执行（Breaking）。
- 短期改造量较大，需要严格按批次推进与回归。
- OpenSpec path 需要在所有命令中保持一致，需加 lint/CI 约束。

## Migration Plan

1. 定义并落地 capability spec delta（artifact-governance / workflow-lifecycle）。
2. 重构 TPD 产物流：删除 cp 复制，改 manifest 引用，新增 lineage。
3. 批量替换其他插件的 RUN_DIR 写入到 OpenSpec。
4. 清理历史 `.claude/*/runs/*` 存量并生成审计报告。
5. 更新 llmdoc 架构与规范文档。

## Rollback

- 代码级回滚到 cutover 前提交。
- 不保留运行时双读。
- OpenSpec 新产物保留用于排障。

## Open Questions

- 是否将 `change-id` 与非 TPD 插件运行绑定为固定 change（例如 `plugin-runtime-ops`）或按 run 动态生成？
- 是否需要新增统一命令来初始化任意插件的 OpenSpec run 上下文（替代每个命令各自实现）？
