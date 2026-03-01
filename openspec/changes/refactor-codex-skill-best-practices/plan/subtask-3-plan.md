# Subtask 3 Plan - Docflow Skills and Validation Harness

## Objective
重构 Docflow skills 并新增可重复执行的 best-practice 校验脚本。
目标 skills：`docflow-commit`、`docflow-doc-workflow`、
`docflow-investigate`、`docflow-read-doc`、`docflow-update-doc`。

## Inputs
- 现有 `codex/.agents/skills/docflow-*`。
- 现有质量门禁脚本：`codex/.codex/docflow/evals/*`。

## Outputs
- 每个 docflow skill 的 `SKILL.md` + `references/*` + `scripts/*.ts`。
- 新增 `codex/.codex/skills/evals/check_skill_best_practices.py`。
- 新增 `codex/.codex/skills/evals/README.md`。

## Execution Steps
1. 将 docflow SKILL.md 统一为编号流程、决策树引用与渐进披露。
2. 为每个 docflow skill 增加 TypeScript 运行脚本。
3. 定义通用静态校验：frontmatter、目录结构、脚本后缀、状态信号。
4. 执行脚本并修复不通过项。
5. 与 TPD/Docflow 既有门禁脚本做回归对齐。

## Risks
- 新校验规则过严导致误报。
- 文档描述和脚本行为偏离。

## Verification
- `python3 codex/.codex/skills/evals/check_skill_best_practices.py` PASS。
- `python3 .codex/tpd/evals/check_tpd_assets.py`（在 `codex/` 根）PASS。
- `python3 .codex/docflow/evals/check_docflow_assets.py`（在 `codex/` 根）PASS。
