# Subtask 9 Plan

## Objective
迁移外部模型封装 skills：codex-cli 与 gemini-cli，并执行全量静态校验。

## Inputs
- `plugins/tpd/skills/codex-cli/SKILL.md`
- `plugins/tpd/skills/gemini-cli/SKILL.md`
- `.codex/tpd/manifest.yaml`
- `.codex/tpd/evals/check_tpd_assets.py`

## Outputs
- `.codex/skills/tpd-codex-cli/SKILL.md`
- `.codex/skills/tpd-gemini-cli/SKILL.md`

## Execution Steps
1. 复制两份 SKILL 文件并前缀化 name。
2. 保留脚本入口、角色定义与 sandbox 约束。
3. 执行全量 eval 校验，确认 manifest/协议/命名一致。

## Risks
- 脚本路径引用变更导致说明失真。
- 全量校验因前序缺项失败。

## Verification
- 两个目标 SKILL 文件存在且 name 正确。
- 两个 SKILL 都保留 `invoke-codex.ts` / `invoke-gemini.ts` 关键词。
- `python3 .codex/tpd/evals/check_tpd_assets.py` 通过。
