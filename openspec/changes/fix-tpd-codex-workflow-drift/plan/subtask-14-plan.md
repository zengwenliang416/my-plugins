# Subtask 14 Plan

## Objective
重构 `codex-cli` 与 `gemini-cli` 两个模型调用技能，降低提示词冗余并统一调用契约。

## Inputs
- `plugins/tpd/skills/codex-cli/SKILL.md`
- `plugins/tpd/skills/gemini-cli/SKILL.md`

## Outputs
- 两个技能统一为轻量执行手册（参数校验 -> 组装 prompt -> 调脚本 -> 回传输出）
- 保留 role/mode/focus/run_dir 参数契约与输出归属规则

## Execution Steps
1. 精简冗长内联 Prompt Templates，改为引用 role 参考模板。
2. 明确调用脚本、沙箱策略、返回责任边界。
3. 统一 Required/Forbidden 规则并补齐失败处理。

## Risks
- 过度精简导致调用方缺少足够指令。
- role 映射不一致造成产物文件错位。

## Verification
- 两个技能都保留原参数集合与调用脚本入口。
- 文档明确“输出由调用方落盘”。
- 禁止行为（空 prompt、吞输出、越权落地）已列出。
