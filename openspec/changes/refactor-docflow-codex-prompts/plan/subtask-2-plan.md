# Subtask 2 Plan

## Objective
将 `plugins/docflow/CLAUDE.md` 的关键规则适配到 Codex 语义，并提供映射说明文档。

## Inputs
- `plugins/docflow/CLAUDE.md`
- 新增的 `.codex/prompts/docflow-*.md`

## Outputs
- 更新后的 `plugins/docflow/CLAUDE.md`
- `plugins/docflow/CODEX-ADAPTER.md`

## Execution Steps
1. 提取 CLAUDE 规则中的强约束条目。
2. 在 CLAUDE 文档中增加 Codex 入口与适配说明。
3. 编写映射文档，记录旧入口与新入口、规则对齐点。

## Risks
- 同时支持 Claude 与 Codex 时文档表述容易混淆。

## Verification
- `plugins/docflow/CLAUDE.md` 中出现 `/prompts:docflow-*` 入口说明。
- 映射文档包含命令映射、规则映射、验证建议。
