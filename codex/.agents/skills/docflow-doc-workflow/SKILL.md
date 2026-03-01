---
name: docflow-doc-workflow
description: |
  该技能在用户询问 llmdoc 体系或文档维护路径时执行，负责给出流程化引导。
  核心产出：与当前仓库状态匹配的文档工作流建议和下一步操作入口。
  负触发：纯代码实现请求且不涉及文档体系时不触发。
  先确认：llmdoc 是否已初始化、用户目标是阅读、更新还是调研。
allowed-tools:
  - Read
  - Glob
  - AskUserQuestion
---

# /docflow-doc-workflow

## 目标
- 在不直接修改代码的前提下，为用户选择最合适的 docflow 文档路径。

## 输入
- `llmdoc/` 是否存在。
- 用户当前意图（初始化 / 阅读 / 更新 / 调研）。

## 输出
- 推荐入口（prompt 或 skill）。
- 推荐理由与操作顺序。
- 必要的前置条件说明。

## 执行步骤（编号）
1. 检查 `llmdoc/` 目录和 `llmdoc/index.md` 是否存在。
2. 识别用户目标：初始化、阅读、更新、调研中的哪一类。
3. 按目标映射入口：`/prompts:docflow-init-doc`、`docflow-read-doc`、`docflow-update-doc`、`docflow-investigate`。
4. 如果上下文不足，先追问 1 个最小澄清问题再给建议。
5. 输出建议时附带前置条件与推荐顺序，避免跳步执行。

## 决策树（详版）
- 主流程分支见 `references/decision-tree.md`。
- 输出字段契约见 `references/output-contract.md`。

## 渐进披露
1. 最小必读：本文件“执行步骤（编号）”。
2. 分支细节：`references/decision-tree.md`。
3. 输出字段：`references/output-contract.md`。
4. 结构规范：`references/llmdoc-structure.md`。
5. 写作规范：`references/doc-conventions.md`。
6. 自动化入口：`scripts/run-docflow-doc-workflow.ts`。

## 验证
- 推荐入口必须限定在 docflow 官方命令或技能集合内。
- 若判断为“不触发”，需明确转交路径。
