## 1. Planning and Scaffolding

- [x] 1.1 创建 docflow 官方化迁移 OpenSpec 变更与分批子任务计划（每批最多 3 文件）

## 2. Official Role Config Migration

- [x] 2.1 在 `.codex/config.toml` 注册 docflow roles
- [x] 2.2 创建 4 个 docflow role TOML 配置并统一模型为 `gpt-5.3-codex` + `xhigh`

## 3. Official Skills Path Migration

- [x] 3.1 同步 docflow skills 到 `.agents/skills/docflow-*`
- [x] 3.2 同步 docflow skills 依赖的 references 目录

## 4. Docflow Manifest and Eval Alignment

- [x] 4.1 更新 `.codex/docflow/manifest.yaml` 指向官方 skills/agent/config 路径
- [x] 4.2 更新 `check_docflow_assets.py` 校验官方角色注册与模型 profile
- [x] 4.3 更新 eval README 与 docflow 使用指南的 source-of-truth 描述

## 5. Validation

- [x] 5.1 运行并通过 `python3 .codex/docflow/evals/check_docflow_assets.py`
- [x] 5.2 回归通过 `python3 .codex/tpd/evals/check_tpd_assets.py`
- [x] 5.3 运行 `openspec validate refactor-docflow-codex-official-adapter --strict --no-interactive`
- [ ] 5.4 Update project documentation using docflow-recorder

## 6. Legacy Cleanup

- [x] 6.1 删除 `.codex/agents/docflow-*.md` legacy agent copies
- [x] 6.2 删除 `.codex/skills/docflow-*` legacy skill copies（含 references）
- [x] 6.3 清理 `.codex/skills` 下空的 `docflow-*` 目录并确认官方路径可用
