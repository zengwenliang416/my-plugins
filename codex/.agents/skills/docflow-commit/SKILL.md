---
name: docflow-commit
description: |
  该技能在用户明确提出提交代码时执行，负责整理变更并生成提交动作建议。
  核心产出：提交前检查结论、候选 commit message、用户确认后的提交执行结果。
  负触发：仅询问概念、工作区无变更、或用户明确要求暂不提交时不触发。
  先确认：暂存策略、提交信息是否改写、是否立即执行 `git commit`。
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# /docflow-commit

## 目标
- 在提交前给出可执行、可确认的提交决策，避免误提交。

## 输入
- Git 工作区状态（staged/unstaged）。
- 用户对提交范围和提交时机的偏好。

## 输出
- 候选提交信息。
- 提交动作决策（继续 / 需确认 / 终止）。
- 简要执行结果说明。

## 执行步骤（编号）
1. 读取当前分支、文件状态、staged 与 unstaged 统计。
2. 若无任何代码变更，直接返回“不触发”并结束。
3. 若只有 unstaged 变更，先询问暂存策略（全部 / 指定 / 取消）。
4. 解析已暂存 diff，归纳本次变更的意图与影响面。
5. 生成候选 commit message，并附 1 句变更动机。
6. 询问用户是否确认提交；确认后执行提交并回传结果。

## 决策树（详版）
- 主流程分支见 `references/decision-tree.md`。
- 输出字段契约见 `references/output-contract.md`。

## 渐进披露
1. 最小必读：本文件“执行步骤（编号）”。
2. 分支细节：`references/decision-tree.md`。
3. 输出字段：`references/output-contract.md`。
4. 自动化入口：`scripts/run-docflow-commit.ts`。

## 验证
- 输出需显式给出当前状态：`success` 或 `blocked`。
- 所有执行结果均需包含下一步建议。
