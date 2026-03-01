# Subtask 10 Plan

## Objective
删除 legacy skills 第 2 批（3 个主 SKILL 文件）。

## Inputs
- `.codex/skills/docflow-doc-workflow/SKILL.md`
- `.codex/skills/docflow-investigate/SKILL.md`
- `.codex/skills/docflow-update-doc/SKILL.md`

## Outputs
- 上述 3 个 legacy skill 文件被删除

## Execution Steps
1. 删除 3 个主 SKILL 文件。
2. 保留官方 `.agents/skills` 的等价文件作为唯一来源。
3. 扫描仓库引用是否仍指向 `.codex/skills/docflow-*`。

## Risks
- 误删官方路径会导致 skill 不可发现。

## Verification
- 三个 legacy SKILL 文件不存在。
- `find .agents/skills -maxdepth 2 -name "SKILL.md" | rg docflow-` 返回完整 5 个 skill。
