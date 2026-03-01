## 1. Planning and Scaffolding

- [x] 1.1 创建 OpenSpec 变更与分批子任务计划（每批最多 3 文件）

## 2. Skill Authoring Standardization

- [x] 2.1 重构全部 TPD skills 的 SKILL.md（前言/步骤/决策树/渐进披露）
- [x] 2.2 重构全部 Docflow skills 的 SKILL.md（前言/步骤/决策树/渐进披露）

## 3. Deterministic TypeScript Scripts

- [x] 3.1 为 TPD skills 补齐 `scripts/*.ts`
- [x] 3.2 为 Docflow skills 补齐 `scripts/*.ts`

## 4. Progressive Disclosure Resources

- [x] 4.1 为 TPD skills 补齐 `references/*`
- [x] 4.2 为 Docflow skills 补齐 `references/*`

## 5. Validation

- [x] 5.1 新增并运行 skills best-practice 静态校验
- [x] 5.2 回归通过 `python3 .codex/tpd/evals/check_tpd_assets.py`（在 `codex/` 根执行）
- [x] 5.3 回归通过 `python3 .codex/docflow/evals/check_docflow_assets.py`（在 `codex/` 根执行）
- [ ] 5.4 Update project documentation using docflow-recorder
