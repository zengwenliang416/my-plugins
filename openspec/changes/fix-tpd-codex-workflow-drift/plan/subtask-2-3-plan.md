# Subtask 2-3 Plan

## Objective
修复 `tpd-codex-cli` / `tpd-gemini-cli` 技能执行链，完成 run 脚本角色与产物契约对齐，并补齐 invoke 脚本，确保 `constraint` 与 `constraint-analyst` 兼容、`*-thought.md` 产物命名一致。

## Inputs
- `plugins/tpd/skills/codex-cli/scripts/invoke-codex.ts`
- `plugins/tpd/skills/gemini-cli/scripts/invoke-gemini.ts`
- `codex/.codex/agents/tpd-codex-core.toml`
- `codex/.codex/agents/tpd-gemini-core.toml`
- `codex/.agents/skills/tpd-codex-cli/scripts/run-tpd-codex-cli.ts`
- `codex/.agents/skills/tpd-gemini-cli/scripts/run-tpd-gemini-cli.ts`

## Outputs
- `codex/.agents/skills/tpd-codex-cli/scripts/run-tpd-codex-cli.ts`
- `codex/.agents/skills/tpd-gemini-cli/scripts/run-tpd-gemini-cli.ts`
- `codex/.agents/skills/tpd-codex-cli/scripts/invoke-codex.ts`
- `codex/.agents/skills/tpd-gemini-cli/scripts/invoke-gemini.ts`

## Execution Steps
1. 对齐 run 脚本 role 校验：接受 `constraint`，并将 `constraint-analyst` 兼容映射为 `constraint`。
2. 修正 artifact 命名：`constraint -> <model>-thought.md`，其余角色保持与 core agent 合同一致。
3. 校正 `command_args` 字段：传递 `workdir` 给 invoke 脚本（保留 `run_dir` 于 inputs 用于追踪）。
4. 基于 plugins 对应实现补齐 codex/gemini invoke 脚本到 codex bundle 路径。
5. 保持 codex read-only sandbox、gemini headless 参数行为不变。

## Risks
- role 别名处理不一致可能导致调用链断裂。
- artifact 命名漏改会导致下游 synthesize 阶段找不到输入。
- run/invoke 参数字段不一致可能导致 CLI 在 cwd 处理上异常。

## Verification
- `run-tpd-codex-cli.ts` 与 `run-tpd-gemini-cli.ts` 输出中的 `command` 指向实际存在的脚本路径。
- `--role constraint` 可通过参数校验并输出 `*-thought.md`。
- `--role constraint-analyst` 仍可通过兼容映射并输出 `*-thought.md`。
- invoke 脚本 `--help` 可正常显示，且支持 `--workdir` 参数。
