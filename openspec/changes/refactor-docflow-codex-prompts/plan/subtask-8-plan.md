# Subtask 8 Plan

## Objective
把新增优化能力同步到用户目录 `~/.codex` 并补充适配文档可执行命令。

## Inputs
- `.codex/docflow/**`
- `plugins/docflow/CODEX-ADAPTER.md`

## Outputs
- `~/.codex/docflow/manifest.yaml`
- `~/.codex/docflow/evals/*`
- 更新后的 `plugins/docflow/CODEX-ADAPTER.md`

## Execution Steps
1. 在适配文档新增“质量门禁与评估”章节。
2. 同步 docflow 清单与评估文件到 `~/.codex/docflow/`。
3. 通过 `diff` 和脚本执行验证一致性。

## Risks
- 用户目录已有同名文件被覆盖。

## Verification
- `diff` 为空。
- 脚本在仓库与用户目录都可运行并通过。
