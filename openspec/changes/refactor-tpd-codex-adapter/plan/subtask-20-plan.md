# Subtask 20 Plan

## Objective
将 docflow markdown agents 的 model 字段（第 1 批 3 文件）统一为 `gpt-5.3-codex`。

## Inputs
- `.codex/agents/docflow-investigator.md`
- `.codex/agents/docflow-scout.md`
- `.codex/agents/docflow-worker.md`

## Outputs
- `.codex/agents/docflow-investigator.md`
- `.codex/agents/docflow-scout.md`
- `.codex/agents/docflow-worker.md`

## Execution Steps
1. 替换 frontmatter model 行为 `model: gpt-5.3-codex`。
2. 保持其余 agent 指令不变。

## Risks
- 不同文件 model 原值不一致，替换漏掉个别场景。

## Verification
- 三个文件均包含 `model: gpt-5.3-codex`。
