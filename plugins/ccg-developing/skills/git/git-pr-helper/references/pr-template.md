# PR 模板与示例

## 标准 PR 描述模板

```markdown
## 变更概述

<!-- 简要描述本次变更的目的和内容 -->

## 变更类型

- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 重构 (refactor)
- [ ] 文档更新 (docs)
- [ ] 测试 (test)
- [ ] 其他

## 变更详情

<!-- 列出主要变更点 -->

## 测试计划

<!-- 描述如何验证这些变更 -->

## 相关 Issue

<!-- 关联的 Issue，如 Closes #123 -->
```

---

## 标题格式

| 类型 | 格式                 | 示例                           |
| ---- | -------------------- | ------------------------------ |
| 功能 | `feat: 简要描述`     | `feat: 添加用户导出功能`       |
| 修复 | `fix: 简要描述`      | `fix: 修复登录超时问题`        |
| 重构 | `refactor: 简要描述` | `refactor: 优化数据库查询性能` |
| 文档 | `docs: 简要描述`     | `docs: 更新 API 文档`          |
| 测试 | `test: 简要描述`     | `test: 添加用户模块单测`       |
| 构建 | `build: 简要描述`    | `build: 升级依赖版本`          |
| CI   | `ci: 简要描述`       | `ci: 添加自动化部署流程`       |

---

## PR 拆分原则

| 情况           | 建议              |
| -------------- | ----------------- |
| 变更文件 > 10  | 考虑拆分为多个 PR |
| 包含不相关变更 | 分离为独立 PR     |
| 大功能         | 按模块分阶段提交  |

---

## 审查前检查清单

- [ ] 代码已通过本地测试
- [ ] 提交信息符合 Conventional Commits 规范
- [ ] 无敏感信息泄露（密钥、密码等）
- [ ] 变更范围清晰可审
- [ ] 必要时更新了文档

---

## gh cli 命令速查

```bash
# PR 创建
gh pr create --title "标题" --body "描述" --base main

# 交互式创建
gh pr create --web

# PR 列表
gh pr list

# 查看 PR 详情
gh pr view <PR号>

# 检出他人 PR
gh pr checkout <PR号>

# 请求审查
gh pr edit <PR号> --add-reviewer <用户名>

# 合并（squash + 删除分支）
gh pr merge <PR号> --squash --delete-branch

# 添加评论
gh pr comment <PR号> --body "评论内容"

# 关闭/重新打开
gh pr close <PR号>
gh pr reopen <PR号>
```
