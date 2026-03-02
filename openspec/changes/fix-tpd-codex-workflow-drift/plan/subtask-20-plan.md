# Subtask 20 Plan

## Objective
收敛 remaining plan/thinking 汇总技能的参数与中间产物语义，确保与 OpenSpec 串联的最小必需约束一致。

## Inputs
- `plugins/tpd/skills/requirement-parser/SKILL.md`
- `plugins/tpd/skills/risk-assessor/SKILL.md`
- `plugins/tpd/skills/handoff-generator/SKILL.md`
- OpenSpec 最小约束来源：`openspec/changes/refactor-plugin-artifact-directory/specs/plugin-artifact-storage/spec.md`

## Outputs
- 三个技能统一最小参数策略（优先 `run_dir`，可推导上下文不强制显式传参）
- 明确 Required/Optional 输入语义，避免把诊断性中间产物设为硬必需
- 保持输出文件契约不变：`requirements.md`、`risks.md`、`handoff.json`

## Execution Steps
1. 更新三个技能 frontmatter arguments，去掉可由目录上下文推导的参数要求。
2. 增补 `Parameter Policy`，说明自动推导策略与兼容调用方式。
3. 保持输出文件名与路径契约不变，仅收敛“必须传参/必须产物”语义。
4. 校验与命令调用链一致，避免破坏 `tpd:thinking` 与 `tpd:plan`。

## Risks
- 对 `proposal_id` 的推导描述不清导致 handoff 生成歧义。
- 过度放宽输入要求，降低失败早发现能力。
- 与现有命令调用文本契约不一致。

## Testing Requirements
- 结构测试：frontmatter 解析通过（name/description/arguments 合法）。
- 契约测试：`requirements.md`、`risks.md`、`handoff.json` 仍在输出契约中。
- 回归测试：`python3 codex/.codex/tpd/evals/check_tpd_assets.py` 必须 PASS。
- 门禁测试：`python3 codex/.codex/docflow/evals/check_docflow_assets.py` 必须 PASS。

## Success Criteria
- 三个技能均仅保留最小必要参数定义。
- 三个技能文档包含 Parameter Policy 且明确可推导上下文。
- 两个 eval 检查均通过。
- 无新增 OpenSpec 严格校验相关风险描述冲突。
