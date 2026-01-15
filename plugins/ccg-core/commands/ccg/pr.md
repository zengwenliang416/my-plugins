---
argument-hint: [--draft] [--base=<branch>] [--reviewer=<user>]
allowed-tools: Bash(git:*), Bash(gh:*), Read, Grep, Glob
description: Pull Request 创建 - 自动生成 PR 描述
---

# /ccg:pr - Pull Request 创建

## 上下文预获取

- 当前分支: !`git branch --show-current 2>/dev/null || echo "N/A (非 git 仓库)"`
- 基准分支: !`git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}' || echo "main"`
- 分支差异: !`git log main..HEAD --oneline 2>/dev/null | head -10 || echo "N/A"`
- 变更统计: !`git diff main...HEAD --stat 2>/dev/null | tail -5 || echo "N/A"`
- 远程状态: !`git status -sb 2>/dev/null | head -1 || echo "N/A (非 git 仓库)"`

## 参数解析

- **草稿模式**: `--draft` 创建草稿 PR
- **目标分支**: `--base` 指定目标分支（默认 main）
- **审查者**: `--reviewer` 指定审查者

---

分析分支变更，自动生成结构化的 PR 描述。

## 工作流程

### Phase 1: 分支分析

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
```

### Phase 2: PR 描述生成

生成结构化描述：

- 变更概述
- 详细改动列表
- 测试说明
- 相关 Issue

### Phase 3: 用户确认

**⏸️ Hard Stop**: 展示 PR 描述，等待确认或修改

### Phase 4: 创建 PR

```bash
gh pr create --title "<title>" --body "<body>"
```

## 使用示例

```
/ccg:pr

/ccg:pr --draft 创建草稿 PR

/ccg:pr --base develop 指定目标分支
```

## PR 模板

```markdown
## Summary

简要描述本次变更的目的和主要改动。

## Changes

- [ ] 改动点 1
- [ ] 改动点 2
- [ ] 改动点 3

## Test Plan

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试场景

## Related Issues

Closes #xxx

## Screenshots (if applicable)

[截图说明 UI 变更]
```

## 检查清单

创建 PR 前确认：

- [ ] 代码已审查（/ccg:review）
- [ ] 测试通过
- [ ] 无冲突
- [ ] 分支已推送
