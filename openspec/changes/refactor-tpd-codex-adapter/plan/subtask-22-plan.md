# Subtask 22 Plan

## Objective
把模型统一策略固化到 TPD 评估与任务清单：`gpt-5.3-codex` + `xhigh`。

## Inputs
- `.codex/tpd/evals/check_tpd_assets.py`
- `.codex/tpd/evals/README.md`
- `openspec/changes/refactor-tpd-codex-adapter/tasks.md`

## Outputs
- `.codex/tpd/evals/check_tpd_assets.py`
- `.codex/tpd/evals/README.md`
- `openspec/changes/refactor-tpd-codex-adapter/tasks.md`

## Execution Steps
1. 在校验脚本中增加 model/model_reasoning_effort 精确值校验。
2. 在 eval README 增加目标模型配置说明。
3. 在 tasks 清单增加并勾选模型统一任务。

## Risks
- 校验脚本规则过严导致与后续模型切换冲突。

## Verification
- `python3 .codex/tpd/evals/check_tpd_assets.py` PASS。
- tasks 清单新增并勾选模型统一项。
