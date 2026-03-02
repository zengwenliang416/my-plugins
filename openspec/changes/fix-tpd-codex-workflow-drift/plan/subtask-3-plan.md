# Subtask 3 Plan

## Objective
补齐 codex bundle 中缺失的 invoke 脚本，恢复 CLI 调用落地点。

## Inputs
- `plugins/tpd/skills/codex-cli/scripts/invoke-codex.ts`
- `plugins/tpd/skills/gemini-cli/scripts/invoke-gemini.ts`
- `codex/.agents/skills/tpd-codex-cli/scripts/`
- `codex/.agents/skills/tpd-gemini-cli/scripts/`

## Outputs
- `codex/.agents/skills/tpd-codex-cli/scripts/invoke-codex.ts`
- `codex/.agents/skills/tpd-gemini-cli/scripts/invoke-gemini.ts`

## Execution Steps
1. 复制并适配 invoke 脚本到 codex bundle 对应目录。
2. 保持 read-only sandbox / headless 参数策略。
3. 校验帮助信息与必填参数行为。

## Risks
- 直接复制后路径引用不一致。
- CLI 参数漂移导致 gemini/codex 子命令失败。

## Verification
- 两个脚本文件存在且可被 `npx tsx ... --help` 调起。
- `run-tpd-*-cli.ts` 输出的 command 与实际文件路径一致。
