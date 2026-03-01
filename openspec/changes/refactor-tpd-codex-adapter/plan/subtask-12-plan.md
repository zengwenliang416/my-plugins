# Subtask 12 Plan

## Objective
补齐第三个官方 agent role 配置，并开始迁移官方 Skills 目录。

## Inputs
- `plugins/tpd/agents/gemini-core.md`
- `.codex/skills/tpd-complexity-analyzer/SKILL.md`
- `.codex/skills/tpd-thought-synthesizer/SKILL.md`

## Outputs
- `.codex/agents/tpd-gemini-core.toml`
- `.agents/skills/tpd-complexity-analyzer/SKILL.md`
- `.agents/skills/tpd-thought-synthesizer/SKILL.md`

## Execution Steps
1. 创建 `tpd_gemini_core` 的官方 role config。
2. 建立 `.agents/skills/` 并迁移两个 TPD skills。
3. 检查 role 在 `.codex/config.toml` 已注册，且 skill 文件可读。

## Risks
- 官方 skills 目录路径错误导致 Codex 无法发现。

## Verification
- 三个目标文件存在。
- `.codex/config.toml` 包含 `tpd_gemini_core` 注册项。
