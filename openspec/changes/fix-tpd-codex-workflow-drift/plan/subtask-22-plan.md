# Subtask 22 Plan

## Objective
在 dev 命令与插件总说明中固化默认模式：`task_type=fullstack`、`修复循环上限=2`，并强调不通过参数切换模式。

## Inputs
- `plugins/tpd/commands/dev.md`
- `plugins/tpd/CLAUDE.md`

## Outputs
- dev 命令写明默认 fullstack + max 2
- CLAUDE 总规约写明全局默认模式：ultra / fullstack / 2

## Execution Steps
1. 更新 `dev.md` Parameter Policy 与步骤中的默认模式描述。
2. 更新 `CLAUDE.md` 的 Parameter Policy 为明确默认值。
3. 保持 OpenSpec Must-Haves 与 Team Rules 不变。

## Risks
- 默认值在命令与总规约之间不一致。
- 文字修改误伤已有硬约束。

## Verification
- `dev.md` 明确默认 fullstack 与 max 2。
- `CLAUDE.md` 明确三项默认值。
- 不出现“通过参数切换模式”的描述。
