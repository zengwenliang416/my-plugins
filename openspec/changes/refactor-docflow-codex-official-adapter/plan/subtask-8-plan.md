# Subtask 8 Plan

## Objective
删除 legacy docflow markdown agents 第 1 批（3 文件），避免与官方 TOML roles 并存。

## Inputs
- `.codex/agents/docflow-investigator.md`
- `.codex/agents/docflow-scout.md`
- `.codex/agents/docflow-worker.md`

## Outputs
- 上述 3 个 legacy agent 文件被删除

## Execution Steps
1. 确认官方替代文件 `.codex/agents/docflow-*.toml` 已存在。
2. 删除 3 个 legacy markdown agents。
3. 快速扫描确保 manifest/eval 未引用 `.md` agent 路径。

## Risks
- 删除错误文件会影响其他工作流。

## Verification
- `find .codex/agents -name "docflow-*.md"` 不再包含这 3 个文件。
- `python3 .codex/docflow/evals/check_docflow_assets.py` 继续通过。
