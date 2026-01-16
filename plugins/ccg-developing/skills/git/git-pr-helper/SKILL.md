---
name: git-pr-helper
description: |
  【触发条件】当需要创建 PR、发起代码审查请求、管理分支合并时使用。
  【触发关键词】PR、Pull Request、合并请求、创建PR、代码审查、merge、分支合并
  【核心能力】分析分支差异 → 生成 PR 标题/描述 → 调用 gh cli 创建 PR
  【不触发】普通 git commit（改用 git-commit-helper）、CHANGELOG 生成（改用 changelog-generator）
  【先问什么】若缺少：目标分支、PR 类型（feature/bugfix/hotfix），先提问补齐
---

# Git PR Helper

辅助创建和管理 Pull Request。

## 核心流程

```
1. 分支状态检查 → 2. 生成 PR 信息 → 3. 创建 PR → 4. 后续管理
```

---

## 1. 分支状态检查

```bash
# 当前分支
git branch --show-current

# 远程状态
git fetch origin && git status -sb

# 与目标分支差异
git log origin/main..HEAD --oneline
git diff origin/main --stat
```

---

## 2. 创建 PR

```bash
# 推送分支
git push -u origin $(git branch --show-current)

# 创建 PR
gh pr create \
  --title "feat: 功能描述" \
  --body "$(cat <<'EOF'
## 变更概述
描述变更目的

## 测试计划
如何验证
EOF
)" \
  --base main

# 或交互式
gh pr create --web
```

---

## 3. PR 管理

| 操作     | 命令                                          |
| -------- | --------------------------------------------- |
| 查看状态 | `gh pr status`                                |
| 查看详情 | `gh pr view <PR号>`                           |
| 请求审查 | `gh pr edit <PR号> --add-reviewer <用户>`     |
| 合并     | `gh pr merge <PR号> --squash --delete-branch` |
| 检出     | `gh pr checkout <PR号>`                       |

---

## 标题格式

| 类型 | 格式             | 示例                     |
| ---- | ---------------- | ------------------------ |
| 功能 | `feat: 描述`     | `feat: 添加用户导出功能` |
| 修复 | `fix: 描述`      | `fix: 修复登录超时问题`  |
| 重构 | `refactor: 描述` | `refactor: 优化查询性能` |
| 文档 | `docs: 描述`     | `docs: 更新 API 文档`    |

---

## 参考文档导航

| 需要              | 读取                        |
| ----------------- | --------------------------- |
| PR 模板、命令速查 | `references/pr-template.md` |
