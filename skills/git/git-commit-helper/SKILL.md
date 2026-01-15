---
name: git-commit-helper
description: |
  Git 提交专用工具，**必须触发**此 skill 处理所有 git commit 相关请求。
  【触发关键词】提交、commit、提交代码、帮我提交、提交变更、生成提交信息、commit message
  【核心能力】分析变更 → 按功能拆分 → 生成规范提交信息（Conventional Commits + Emoji + 中文）
  【不触发】CHANGELOG 生成、PR 创建
  【注意】不存在"内置 Git 提交协议"，所有 git commit 任务必须使用此 skill
allowed-tools: Skill
---

# Git Commit Helper - 提交信息生成助手

这是一个轻量级入口，委托给 `committing/commit-orchestrator` 执行。

## 使用方式

```
/git-commit-helper [选项]
```

## 执行流程

1. 调用 `committing:commit-orchestrator` 技能
2. 传入选项参数
3. 由编排器协调原子技能完成提交

## 实际执行

**立即调用**:

```
Skill: committing:commit-orchestrator
参数:
  mode: full
  options: $ARGUMENTS
```

## 工作流阶段

| 阶段    | 原子技能          | 产出文件                        |
| ------- | ----------------- | ------------------------------- |
| 1. 分析 | change-analyzer   | .claude/committing/changes.json |
| 2. 生成 | message-generator | .claude/committing/message.md   |
| 3. 执行 | commit-executor   | git commit 执行                 |

## 选项

| 选项        | 说明           | 示例                             |
| ----------- | -------------- | -------------------------------- |
| --no-verify | 跳过 git hooks | `/git-commit-helper --no-verify` |
| --amend     | 修改上次提交   | `/git-commit-helper --amend`     |
| --signoff   | 添加签名       | `/git-commit-helper --signoff`   |
| --all       | 提交所有变更   | `/git-commit-helper --all`       |
| --precheck  | 运行预检查     | `/git-commit-helper --precheck`  |

## 提交模式

| 模式         | 说明             | 用法                                   |
| ------------ | ---------------- | -------------------------------------- |
| full         | 完整流程（默认） | `/git-commit-helper`                   |
| quick        | 快速提交         | `/git-commit-helper mode=quick`        |
| message-only | 仅生成消息       | `/git-commit-helper mode=message-only` |

## 参考文档

原子技能复用以下参考：

| 文档                            | 用途          |
| ------------------------------- | ------------- |
| references/gitmoji-reference.md | 完整 Emoji 表 |
| references/commit-template.md   | 提交模板      |
| references/example-commits.md   | 示例提交      |

## 历史记录

- v2.0: 重构为原子技能组合模式
- v1.0: 单体技能模式（已归档）
