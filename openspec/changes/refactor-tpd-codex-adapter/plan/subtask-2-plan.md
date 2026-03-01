# Subtask 2 Plan

## Objective
迁移 `tpd-init` prompt，并建立 `.codex/tpd/manifest.yaml` 与基础测试用例。

## Inputs
- `plugins/tpd/commands/init.md`
- `.codex/docflow/manifest.yaml`
- `.codex/docflow/evals/cases.yaml`

## Outputs
- `.codex/prompts/tpd-init.md`
- `.codex/tpd/manifest.yaml`
- `.codex/tpd/evals/cases.yaml`

## Execution Steps
1. 抽取 init 阶段的环境检测、MCP 校验与 Hard Stop 约束。
2. 基于 docflow manifest 结构建立 TPD entries 与 message_contracts。
3. 设计 4 个 prompt 的静态 case，覆盖关键标记词与协议元素。

## Risks
- manifest 键名与实际文件/name 不一致。
- cases 覆盖不完整导致后续校验脚本漏检。

## Verification
- 3 个文件存在且 JSON/YAML 可解析。
- manifest 包含 4 prompts、3 agents、14 skills 的条目键。
- cases 至少覆盖 `tpd-init`、`tpd-thinking`、`tpd-plan`、`tpd-dev`。
