# Subtask 6 Plan

## Objective
升级 docflow eval harness 与文档说明，校验官方 role/skills 结构。

## Inputs
- `.codex/docflow/evals/check_docflow_assets.py`
- `.codex/docflow/evals/README.md`
- `llmdoc/guides/how-to-use-docflow-in-codex.md`

## Outputs
- `.codex/docflow/evals/check_docflow_assets.py`
- `.codex/docflow/evals/README.md`
- `llmdoc/guides/how-to-use-docflow-in-codex.md`

## Execution Steps
1. 校验脚本增加 `codex_config` 注册、agent toml 必填字段与模型 profile 检查。
2. README 更新校验项说明为官方目录结构。
3. llmdoc guide 更新 source-of-truth 路径。

## Risks
- 新校验过严导致误报。

## Verification
- 脚本可运行并输出结构化 PASS/FAIL。
- 文档中的路径与 manifest 保持一致。
