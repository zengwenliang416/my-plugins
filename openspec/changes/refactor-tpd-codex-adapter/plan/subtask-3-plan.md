# Subtask 3 Plan

## Objective
补齐 TPD eval harness 文档与脚本，并迁移 `tpd-context-explorer` agent。

## Inputs
- `plugins/tpd/agents/context-explorer.md`
- `.codex/docflow/evals/check_docflow_assets.py`
- `.codex/tpd/manifest.yaml`

## Outputs
- `.codex/tpd/evals/check_tpd_assets.py`
- `.codex/tpd/evals/README.md`
- `.codex/agents/tpd-context-explorer.md`

## Execution Steps
1. 复用 docflow 静态校验脚本结构，改写为 TPD 资产校验。
2. 编写 eval README，定义运行方式与通过条件。
3. 迁移 context-explorer agent，并统一 `tpd-` 命名。

## Risks
- 校验规则过严导致误报。
- agent 名称或消息类型与 manifest 不一致。

## Verification
- `python3 -m py_compile .codex/tpd/evals/check_tpd_assets.py` 通过。
- `python3 .codex/tpd/evals/check_tpd_assets.py` 至少可执行并输出结构化结果。
- `tpd-context-explorer` frontmatter 名称正确。
