---
name: docflow-update-doc
description: |
  该技能在代码或需求变更后需要同步 llmdoc 时执行，负责增量更新与索引对齐。
  核心产出：受影响文档清单、更新结果、索引一致性检查结论。
  负触发：没有有效变更输入且文档已最新时不触发。
  先确认：变更范围、目标模块、更新模式（增量 / 全量）。
context: fork
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
  - Task
---

# /docflow-update-doc

## 目标
- 以最小改动同步 llmdoc，确保内容与代码状态一致。

## 输入
- 变更描述（来自 `$ARGUMENTS` 或 git diff）。
- 当前 llmdoc 结构与索引。

## 输出
- 更新文档清单（新增 / 修改 / 删除）。
- 索引同步结果。
- 风险与后续建议。

## 执行步骤（编号）
1. 收集变更上下文：优先 `$ARGUMENTS`，否则读取最近 diff。
2. 映射受影响概念到 llmdoc 文档位置。
3. 对每个受影响文档执行最小更新，避免无关重写。
4. 更新后统一校验 `llmdoc/index.md` 与目录一致性。
5. 输出更新摘要与未覆盖风险。
6. 结尾保留 TODO：Update project documentation using docflow-recorder。

## 决策树（详版）
- 主流程分支见 `references/decision-tree.md`。
- 输出字段契约见 `references/output-contract.md`。

## 渐进披露
1. 最小必读：本文件“执行步骤（编号）”。
2. 分支细节：`references/decision-tree.md`。
3. 输出字段：`references/output-contract.md`。
4. 自动化入口：`scripts/run-docflow-update-doc.ts`。

## 验证
- 更新说明需明确“依据了哪些变更证据”。
- 若无法更新，应输出阻塞原因与人工处理建议。
