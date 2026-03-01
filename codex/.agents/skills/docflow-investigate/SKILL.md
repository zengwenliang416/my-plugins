---
name: docflow-investigate
description: |
  该技能在用户要求解释实现、定位代码或分析系统行为时执行，负责文档优先调研。
  核心产出：结构化调查结论、证据路径和直接回答（不落盘）。
  负触发：用户已明确要求直接改代码执行时不触发。
  先确认：调查范围、问题维度、是否需要外部信息。
context: fork
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - WebSearch
  - WebFetch
---

# /docflow-investigate

## 目标
- 在文档优先前提下快速形成可追溯的调查结论。

## 输入
- 用户问题与范围。
- llmdoc 文档上下文。
- 代码检索结果与必要外部证据。

## 输出
- 代码定位清单。
- 事实结论与模块关系。
- 对用户问题的直接回答。

## 执行步骤（编号）
1. 判断请求是否属于“调查”而非“立即修改”。
2. 先读 `llmdoc/index.md`、`llmdoc/overview/` 与相关文档。
3. 仅在文档不足时进入代码检索（Glob/Grep/Read）。
4. 对每条结论附证据路径，避免无来源推断。
5. 按固定结构输出：代码段、结论、关系、结果。
6. 若需外部信息，先声明边界再调用 WebSearch/WebFetch。

## 决策树（详版）
- 主流程分支见 `references/decision-tree.md`。
- 输出字段契约见 `references/output-contract.md`。

## 渐进披露
1. 最小必读：本文件“执行步骤（编号）”。
2. 调研分支：`references/decision-tree.md`。
3. 输出结构：`references/output-contract.md`。
4. 调查实践：`references/investigation-guide.md`。
5. 自动化入口：`scripts/run-docflow-investigate.ts`。

## 验证
- 不写入文件，直接回复用户。
- 每个关键结论至少附一个可定位证据路径。
