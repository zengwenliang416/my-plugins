# UI-Design Plugin

始终使用中文（简体）回答。

## 可用命令
- `/ui-design`: 端到端 UI/UX 设计与实现流程。

## 工作流阶段
1. Init：解析参数并初始化 `openspec/changes/<run_id>/`。
2. Scenario Confirm：通过 `AskUserQuestion` 确认 `scenario` 与 `tech_stack`。
3. Reference Analysis Team：并行分析视觉、配色、组件并汇总。
4. Requirements：生成 `requirements.md`，`optimize` 场景额外做 `code-analysis.md`。
5. Style Recommendation：生成三套风格候选。
6. Variant Selection：用户确认最终变体。
7. Design Pipeline Team：设计生成 -> UX 校验 -> 修复回环 -> 代码生成 -> 质量校验。
8. Delivery：输出结果与可恢复命令。

## Agent Team（合并后）
- `ui-design:analysis-core`
  - `mode=reference` + `perspective=visual|color|component`
  - `mode=requirements`
  - `mode=existing-code`
- `ui-design:design-core`
  - `mode=style`
  - `mode=variant`
- `ui-design:generation-core`
  - `mode=prototype`
  - `mode=refactor`
- `ui-design:validation-core`
  - `mode=ux`
  - `mode=quality`

## 子代理通信约定
- 全部消息使用统一 envelope：`type/from/to/run_id/task_id/requires_ack/payload`。
- `requires_ack=true` 的定向消息必须确认。
- 关键事件必须记录到 `${RUN_DIR}/team/mailbox.jsonl`。
- 等待超过 60 秒时，写入 `${RUN_DIR}/team/heartbeat.jsonl`。

## 技能调用约定
- 子代理按需调用 `ui-design:gemini-cli`：
  - 参考分析（analysis-core）
  - 风格/变体生成（design-core）
  - 代码原型生成（generation-core）
- 非必须模型步骤优先使用本地分析（Read / auggie / LSP）。

## 质量门禁
- UX pass rate >= 80%
- High-priority UX issues = 0
- 每个变体最多 2 轮修复
- Quality score >= 7.5/10

## 输出目录
- `ref-analysis-{visual,color,component}.md`
- `design-reference-analysis.md`
- `requirements.md`
- `style-recommendations.md`
- `design-{A,B,C}.md`
- `ux-check-{A,B,C}.md`
- `code/gemini-raw/`
- `code/<tech_stack>/`
- `quality-report.md`
- `team/{phase-events.jsonl,heartbeat.jsonl,mailbox.jsonl}`
