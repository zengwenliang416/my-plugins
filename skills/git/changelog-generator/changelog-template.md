# Changelog 模板

## 标准格式

```markdown
# Changelog

所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- 新增功能描述

### Changed

- 变更功能描述

### Deprecated

- 即将废弃的功能

### Removed

- 已移除的功能

### Fixed

- 修复的问题

### Security

- 安全相关修复

## [1.0.0] - 2025-01-15

### Added

- 初始发布
- 用户认证模块
- 数据导出功能

### Fixed

- 修复登录页面样式问题 (#123)

[Unreleased]: https://github.com/user/repo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

## 面向用户版本

```markdown
# 更新日志

## v1.2.0 (2025-01-15)

### ✨ 新功能

**暗黑模式支持**

- 自动跟随系统主题
- 可手动切换明暗模式
- 所有页面适配完成

**数据导出增强**

- 新增 Excel 格式导出
- 支持自定义导出字段
- 批量导出优化

### 🐛 问题修复

- 修复移动端菜单无法展开的问题
- 修复大文件上传超时问题
- 修复日期选择器时区问题

### ⚡ 性能优化

- 首页加载速度提升 40%
- 列表滚动更流畅

---

## v1.1.0 (2025-01-01)

...
```

## Release Notes 模板

```markdown
# Release Notes - v1.2.0

发布日期: 2025-01-15

## 概述

本版本主要新增暗黑模式支持，并修复了若干影响用户体验的问题。

## 升级指南

### 破坏性变更

⚠️ 本版本包含以下破坏性变更：

1. **API 端点变更**
   - `/api/v1/users` → `/api/v2/users`
   - 迁移方法: 更新 API 调用路径

2. **配置项重命名**
   - `old_config` → `new_config`
   - 迁移方法: 更新配置文件

### 升级步骤

1. 备份数据库
2. 更新依赖: `npm install`
3. 运行迁移: `npm run migrate`
4. 重启服务

## 详细变更

### 新功能

- feat(theme): 新增暗黑模式支持 (#234)
- feat(export): 支持 Excel 格式导出 (#235)

### 修复

- fix(mobile): 修复菜单展开问题 (#230)
- fix(upload): 修复大文件超时 (#231)

### 其他

- docs: 更新 API 文档
- chore: 升级依赖版本

## 贡献者

感谢以下贡献者参与本版本开发:

- @contributor1
- @contributor2

## 下一版本预告

v1.3.0 计划新增:

- 多语言支持
- 通知中心
```
