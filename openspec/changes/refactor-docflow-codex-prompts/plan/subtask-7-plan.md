# Subtask 7 Plan

## Objective
吸收 openai-cookbook 的“可检索文档 + 可重复评估”思路，给 docflow 增加资产清单（manifest）与评估入口（eval harness）。

## Inputs
- `/Users/wenliang_zeng/.codex/openai-cookbook/AGENTS.md`
- `/Users/wenliang_zeng/.codex/openai-cookbook/examples/evals/realtime_evals/run_harness/README.md`
- 当前 `.codex/prompts/`、`.codex/skills/`、`.codex/agents/` 的 docflow 资产

## Outputs
- `.codex/docflow/manifest.yaml`
- `.codex/docflow/evals/README.md`
- `.codex/docflow/evals/cases.yaml`
- `.codex/docflow/evals/check_docflow_assets.py`

## Execution Steps
1. 设计 docflow 资产清单格式，列出 prompts/skills/agents/message_types。
2. 设计可重复评估 case，覆盖 3 个 prompt 主流程。
3. 实现基础静态校验脚本（存在性 + 关键约束词 + 协议完整性）。

## Risks
- 校验规则过严导致误报。
- 未来文案调整可能需要同步更新规则。

## Verification
- 运行 `python3 .codex/docflow/evals/check_docflow_assets.py` 返回通过。
- 输出包含 pass/fail 汇总和失败明细。
