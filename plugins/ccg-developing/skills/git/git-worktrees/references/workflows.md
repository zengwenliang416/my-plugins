# Git Worktree 工作流详解

## 并行开发流程

```bash
# 1. 在主仓库中
cd ~/projects/my-app

# 2. 创建新功能工作树
git worktree add ../my-app-user-auth -b feature/user-auth main

# 3. 进入工作树开发
cd ../my-app-user-auth
# ... 开发代码 ...
git add . && git commit -m "feat: implement user auth"

# 4. 同时处理紧急修复
cd ~/projects/my-app
git worktree add ../my-app-hotfix -b hotfix/security main

# 5. 修复完成后清理
git worktree remove ../my-app-hotfix
```

## 代码审查流程

```bash
# 创建 PR 审查工作树
git fetch origin pull/123/head:pr-123
git worktree add ../review-pr-123 pr-123

# 审查代码
cd ../review-pr-123
# ... 运行测试、检查代码 ...

# 审查完成后清理
git worktree remove ../review-pr-123
git branch -D pr-123
```

## 目录结构规划

```bash
~/projects/
├── my-app/                 # 主仓库 (main)
├── my-app-feature-a/       # 功能分支 A
├── my-app-feature-b/       # 功能分支 B
└── my-app-hotfix/          # 紧急修复
```

## 命名约定

```bash
# 推荐格式: {项目名}-{分支类型}-{描述}
my-app-feature-login
my-app-hotfix-security
my-app-review-pr123
```

## 安全检查

```bash
# 创建前检查目标目录
ls -la ../new-worktree 2>/dev/null || echo "目录不存在，可以创建"

# 检查分支是否已存在
git branch --list feature/new | grep -q . && echo "分支已存在"

# 列出所有工作树状态
git worktree list --porcelain

# 检查孤立工作树
git worktree list | grep -v "$(pwd)"
```

## 常见问题

```bash
# 错误: 分支已在其他工作树检出
# 解决: 先移除该工作树或使用其他分支
git worktree list  # 查找占用分支的工作树

# 错误: 目标目录已存在
# 解决: 使用其他目录名或先删除目录
rm -rf ../target-dir
```

## 注意事项

1. **分支锁定**: 同一分支不能在多个工作树中检出
2. **共享索引**: 所有工作树共享 `.git` 目录
3. **钩子共享**: Git hooks 在所有工作树中生效
