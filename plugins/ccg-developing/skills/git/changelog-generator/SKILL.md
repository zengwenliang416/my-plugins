---
name: changelog-generator
description: |
  【触发条件】当用户需要从 git 提交历史生成 CHANGELOG、发布说明、版本摘要时使用。
  【核心产出】输出：CHANGELOG.md、发布说明、按版本分组的变更摘要。
  【不触发】不用于：Git 提交信息编写（改用 git-commit-helper）。
  【先问什么】若缺少：版本范围、目标格式、是否包含 breaking changes，先提问补齐。
allowed-tools: Bash, Read, Write, Grep, Glob
---

# Changelog Generator - 变更日志生成器

## 功能概述

自动分析 git 提交历史，将技术性的提交信息转换为用户友好的变更日志，支持 Conventional Commits 规范和语义化版本。

## 使用场景

- 发布新版本前生成 CHANGELOG
- 创建 Release Notes
- 周期性项目更新总结

## 可执行脚本

本 Skill 包含以下可执行脚本（位于 `scripts/` 目录）：

| 脚本                    | 用途               | 执行方式                                                 |
| ----------------------- | ------------------ | -------------------------------------------------------- |
| `generate-changelog.sh` | 自动生成 Changelog | `bash scripts/generate-changelog.sh [from-ref] [to-ref]` |
| `validate-commits.sh`   | 验证提交信息规范   | `bash scripts/validate-commits.sh [from-ref] [to-ref]`   |

## 工作流程

### 1. 分析提交历史

```bash
# 获取上一个版本到现在的提交
git log $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~50")..HEAD --pretty=format:"%h|%s|%an|%ad" --date=short

# 或指定范围
git log v1.0.0..v1.1.0 --pretty=format:"%h|%s|%an|%ad" --date=short
```

### 2. 分类提交

根据 Conventional Commits 前缀分类：

| 前缀              | 分类                | 用户表述   |
| ----------------- | ------------------- | ---------- |
| `feat:`           | ✨ Features         | 新功能     |
| `fix:`            | 🐛 Bug Fixes        | 问题修复   |
| `perf:`           | ⚡ Performance      | 性能优化   |
| `docs:`           | 📚 Documentation    | 文档更新   |
| `refactor:`       | ♻️ Refactor         | 代码重构   |
| `test:`           | 🧪 Tests            | 测试相关   |
| `chore:`          | 🔧 Chores           | 构建/工具  |
| `BREAKING CHANGE` | 💥 Breaking Changes | 破坏性变更 |

### 3. 输出格式

```markdown
# Changelog

## [1.2.0] - 2025-01-15

### ✨ 新功能

- 添加用户认证模块 (#123)
- 支持暗黑模式切换

### 🐛 问题修复

- 修复登录页面闪烁问题 (#125)

### 💥 破坏性变更

- 移除废弃的 v1 API 端点
```

## 生成策略

### 面向用户

- 隐藏技术细节（重构、测试、构建）
- 使用业务语言描述功能
- 突出用户可感知的变化

### 面向开发者

- 包含所有技术变更
- 保留提交哈希和 PR 链接
- 详细列出依赖更新

## 模板

参见 `changelog-template.md` 获取完整模板。

## 配置选项

| 选项                | 说明          | 默认值     |
| ------------------- | ------------- | ---------- |
| `--since`           | 起始版本/日期 | 上一个 tag |
| `--until`           | 结束版本/日期 | HEAD       |
| `--format`          | 输出格式      | markdown   |
| `--group-by`        | 分组方式      | type       |
| `--include-authors` | 包含作者      | false      |
