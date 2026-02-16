# Subtask 1 Plan

## Objective
盘点所有活跃代码/文档中的旧 wrapper 路径与 resolver 硬编码点。

## Inputs
- 全仓库 `rg` 检索结果
- 各插件 `scripts/invoke-*.ts`

## Outputs
- 需要修改的脚本和文档清单

## Execution Steps
1. 搜索 `~/.claude/bin/codeagent-wrapper`。
2. 搜索 resolver 中 `.claude/bin` 硬编码。
3. 过滤历史工件（openspec thinking/archive）并确定活跃范围。

## Risks
- 误改历史工件导致噪音 diff。

## Verification
- 形成明确、可执行的修改清单。
