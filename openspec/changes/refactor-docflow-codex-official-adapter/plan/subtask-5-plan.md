# Subtask 5 Plan

## Objective
补齐剩余 references，并将 manifest 切换到官方路径。

## Inputs
- `.codex/skills/docflow-doc-workflow/references/llmdoc-structure.md`
- `.codex/skills/docflow-investigate/references/investigation-guide.md`
- `.codex/docflow/manifest.yaml`

## Outputs
- `.agents/skills/docflow-doc-workflow/references/llmdoc-structure.md`
- `.agents/skills/docflow-investigate/references/investigation-guide.md`
- `.codex/docflow/manifest.yaml`

## Execution Steps
1. 同步 2 个 references 文件到官方 skills 路径。
2. 更新 manifest：skills 指向 `.agents/skills/*`，agents 指向 `.codex/agents/*.toml`。
3. 在 manifest 增加 `codex_config.project_config`。

## Risks
- manifest 路径写错导致 eval 全量失败。

## Verification
- manifest 中 docflow skills/agents/config 路径均可解析到现存文件。
