# Subtask 16 Plan

## Objective
同步更新 `tpd:init` 与插件总说明，明确“OpenSpec 串联时真正必须的文件/参数”，减少默认复杂度。

## Inputs
- `plugins/tpd/commands/init.md`
- `plugins/tpd/CLAUDE.md`

## Outputs
- `init` 命令参数提示最小化
- `CLAUDE.md` 中 Key Artifacts 改为 Must/Optional 分层
- 明确 OpenSpec 硬要求：`proposal.md` + `tasks.md` + `specs/`

## Execution Steps
1. 收敛 `init` 参数和步骤，保留必要 readiness 与 Hard Stop。
2. 在 `CLAUDE.md` 引入最小 OpenSpec 产物视图。
3. 保持 Team 规则不变，仅减少中间产物“必须”语义。

## Risks
- 文档和命令最小约束描述不一致。

## Verification
- `CLAUDE.md` 可直接看出 must-have 与 optional。
- `init` 不再默认要求额外参数。
