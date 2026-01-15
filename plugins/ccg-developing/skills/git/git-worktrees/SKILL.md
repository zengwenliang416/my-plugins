---
name: git-worktrees
description: |
  【触发条件】当用户需要并行开发多个功能分支、隔离实验性修改、同时在多分支工作时使用。
  【核心产出】输出：Git worktree 创建/管理命令、分支隔离方案。
  【不触发】不用于：常规 Git 操作（直接使用 git 命令）、提交信息生成（改用 git-commit-helper）。
  【先问什么】若缺少：分支名称、工作目录位置，先提问补齐。
allowed-tools: Bash, Read, Write
---

# Git Worktrees - 工作树管理

使用 Git Worktrees 创建隔离的工作目录，支持同时在多个分支上工作，无需 stash 或切换。

## 核心概念

```
主仓库 (main)
    ├── .git/           # 共享的 Git 数据
    ├── worktrees/
    │   ├── feature-a/  # 独立工作目录
    │   └── hotfix/     # 独立工作目录
    └── src/            # 主工作目录
```

| 场景     | 传统方式         | Worktree 方式 |
| -------- | ---------------- | ------------- |
| 切换分支 | stash → checkout | 直接进入目录  |
| 并行开发 | 多次克隆         | 共享 .git     |
| 紧急修复 | 中断当前工作     | 并行处理      |

---

## 快速脚本

**先运行 `--help`**：

```bash
./scripts/worktree-manager.sh help
```

| 命令    | 功能                  | 示例                                                      |
| ------- | --------------------- | --------------------------------------------------------- |
| create  | 创建新分支 worktree   | `./scripts/worktree-manager.sh create feature/login main` |
| review  | 创建 PR 审查 worktree | `./scripts/worktree-manager.sh review 123`                |
| list    | 列出所有 worktrees    | `./scripts/worktree-manager.sh list`                      |
| remove  | 移除 worktree         | `./scripts/worktree-manager.sh remove ../path`            |
| cleanup | 清理孤立 worktrees    | `./scripts/worktree-manager.sh cleanup`                   |

---

## 手动命令

```bash
# 创建（基于现有分支）
git worktree add ../feature-login feature/login

# 创建（新建分支）
git worktree add -b feature/new-api ../new-api main

# 列出
git worktree list

# 移除
git worktree remove ../feature-login

# 清理无效
git worktree prune
```

---

## 快速参考

| 操作 | 命令                               |
| ---- | ---------------------------------- |
| 创建 | `git worktree add <path> <branch>` |
| 列出 | `git worktree list`                |
| 移除 | `git worktree remove <path>`       |
| 清理 | `git worktree prune`               |
| 锁定 | `git worktree lock <path>`         |
| 解锁 | `git worktree unlock <path>`       |

---

## 参考文档导航

| 需要         | 读取                      |
| ------------ | ------------------------- |
| 详细工作流程 | `references/workflows.md` |
