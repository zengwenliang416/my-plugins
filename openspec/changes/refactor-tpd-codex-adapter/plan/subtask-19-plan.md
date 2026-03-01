# Subtask 19 Plan

## Objective
将 TPD markdown agents 的 model 字段统一为 `gpt-5.3-codex`。

## Inputs
- `.codex/agents/tpd-context-explorer.md`
- `.codex/agents/tpd-codex-core.md`
- `.codex/agents/tpd-gemini-core.md`

## Outputs
- `.codex/agents/tpd-context-explorer.md`
- `.codex/agents/tpd-codex-core.md`
- `.codex/agents/tpd-gemini-core.md`

## Execution Steps
1. 将 frontmatter `model: opus` 统一替换为 `model: gpt-5.3-codex`。
2. 保持其余字段与正文不变。
3. 用 `rg` 校验三文件 model 字段一致。

## Risks
- frontmatter 结构被破坏导致解析失败。

## Verification
- 三个 markdown agent 文件都包含 `model: gpt-5.3-codex`。
