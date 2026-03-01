# Subtask 11 Plan

## Objective
删除 legacy skills references 第 3 批（3 文件）并清理空目录。

## Inputs
- `.codex/skills/docflow-doc-workflow/references/doc-conventions.md`
- `.codex/skills/docflow-doc-workflow/references/llmdoc-structure.md`
- `.codex/skills/docflow-investigate/references/investigation-guide.md`

## Outputs
- 上述 3 个 reference 文件被删除
- 对应空目录从 `.codex/skills/` 清理

## Execution Steps
1. 删除 3 个 legacy reference 文件。
2. 删除因迁移产生的空目录（仅限 `.codex/skills/docflow-*`）。
3. 确认官方 references 路径 `.agents/skills/**/references/*` 保持可读。

## Risks
- 目录清理范围过大导致误删。

## Verification
- `.codex/skills/` 下不再有 `docflow-*` 目录。
- `.agents/skills/docflow-doc-workflow/references/*` 与 `.agents/skills/docflow-investigate/references/*` 存在。
