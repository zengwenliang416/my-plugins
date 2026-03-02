# Subtask 2 Plan

## Objective
修复 tpd codex/gemini run 脚本的角色映射与产物命名，确保 `constraint` 路由可执行。

## Inputs
- `codex/.agents/skills/tpd-codex-cli/scripts/run-tpd-codex-cli.ts`
- `codex/.agents/skills/tpd-gemini-cli/scripts/run-tpd-gemini-cli.ts`
- `codex/.codex/agents/tpd-codex-core.toml`
- `codex/.codex/agents/tpd-gemini-core.toml`

## Outputs
- `codex/.agents/skills/tpd-codex-cli/scripts/run-tpd-codex-cli.ts`
- `codex/.agents/skills/tpd-gemini-cli/scripts/run-tpd-gemini-cli.ts`

## Execution Steps
1. 扩展 role gate：支持 `constraint`（兼容 `constraint-analyst`）。
2. 统一 artifact 输出：`constraint -> *-thought.md`，implementer 保持 analyze/prototype 分支。
3. 更新 `command_args` 的 workdir 字段命名与脚本约定一致。

## Risks
- 角色别名处理不当可能影响既有调用方。
- 产物命名修复不全会导致下游 synthesize 找不到输入。

## Verification
- `--role constraint` 与 `--role constraint-analyst` 都能通过参数校验。
- 输出 JSON 中 artifact 路径符合 core agent 合同。
