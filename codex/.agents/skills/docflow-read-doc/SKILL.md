---
name: docflow-read-doc
description: |
  该技能在用户希望快速理解项目或阅读现有 llmdoc 时执行，负责结构化文档综述。
  核心产出：项目目标、架构、流程与关键参考文档的精炼摘要。
  负触发：llmdoc 尚未初始化且用户要求立即编码时不触发。
  先确认：关注业务域、摘要深度（概览 / 深入）。
context: fork
allowed-tools:
  - Read
  - Glob
  - Grep
---

# /docflow-read-doc

## 目标
- 让用户在最短路径内掌握项目上下文与检索入口。

## 输入
- `llmdoc/index.md`。
- `llmdoc/overview/`、`llmdoc/architecture/`、`llmdoc/guides/`、`llmdoc/reference/`。
- 用户关注主题与深度偏好。

## 输出
- 分层摘要（项目目标 / 架构 / 工作流 / 参考）。
- 推荐继续阅读路径。

## 执行步骤（编号）
1. 检查 `llmdoc/` 是否存在；不存在时返回初始化建议。
2. 先读取 `llmdoc/index.md`，建立文档导航基线。
3. 读取 `llmdoc/overview/` 全部文件，提炼业务与目标。
4. 按用户关注主题扫描 architecture/guides/reference。
5. 生成摘要时区分“已确认事实”和“建议后续阅读”。

## 决策树（详版）
- 主流程分支见 `references/decision-tree.md`。
- 输出字段契约见 `references/output-contract.md`。

## 渐进披露
1. 最小必读：本文件“执行步骤（编号）”。
2. 分支细节：`references/decision-tree.md`。
3. 输出字段：`references/output-contract.md`。
4. 自动化入口：`scripts/run-docflow-read-doc.ts`。

## 验证
- 摘要必须覆盖目标、架构、流程、参考四个维度。
- 输出中必须包含至少 3 个后续可读文档路径。
