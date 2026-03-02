# Subtask 1 Plan

## Objective
恢复 codex bundle 中 TPD 三阶段 prompts 的执行细节，避免仅保留摘要导致流程跑偏。

## Inputs
- `plugins/tpd/commands/thinking.md`
- `plugins/tpd/commands/plan.md`
- `plugins/tpd/commands/dev.md`
- `codex/.codex/prompts/tpd-thinking.md`
- `codex/.codex/prompts/tpd-plan.md`
- `codex/.codex/prompts/tpd-dev.md`

## Outputs
- `codex/.codex/prompts/tpd-thinking.md`
- `codex/.codex/prompts/tpd-plan.md`
- `codex/.codex/prompts/tpd-dev.md`

## Execution Steps
1. 逐段对比原始 command 与 codex prompt，定位缺失的 Step/Hard Stop/Fallback 细节。
2. 将关键执行步骤（初始化、team 生命周期、阻塞点、收尾校验）补回 codex prompts。
3. 保留 codex 入口语义，不破坏已存在的消息协议与产物合同。

## Risks
- 直接覆盖可能丢失 codex 环境下新增约束。
- 文案修复后若与 eval 关键字不一致会触发静态门禁失败。

## Verification
- 三个 prompt 均包含 Task 阻塞处理、Hard Stop、Fallback 段落。
- 与 plugins/tpd 对比时，不再缺失 Step 0 初始化与关键执行细节。
