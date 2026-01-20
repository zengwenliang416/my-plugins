# Changelog Format Reference

基于 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 规范。

---

## 1. 文件结构

### 1.1 基本结构

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-15

### Added
- Feature A
- Feature B

### Fixed
- Bug fix C

## [1.0.0] - 2026-01-01

### Added
- Initial release

[Unreleased]: https://github.com/user/repo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

---

## 2. 变更类型

### 2.1 类型定义（按优先级排序）

| 类型 | 描述 | 对应 Conventional Commit |
|------|------|--------------------------|
| `Changed` | 现有功能的变更 | `refactor`, `perf`, `style` |
| `Added` | 新增功能 | `feat` |
| `Deprecated` | 即将移除的功能 | - |
| `Removed` | 已移除的功能 | `feat` (删除) |
| `Fixed` | Bug 修复 | `fix` |
| `Security` | 安全漏洞修复 | `fix` (安全相关) |

### 2.2 类型映射

| Conventional Commit | Changelog 类型 |
|---------------------|----------------|
| `feat` | `Added` |
| `fix` | `Fixed` |
| `fix` (security) | `Security` |
| `refactor` | `Changed` |
| `perf` | `Changed` |
| `style` | `Changed` |
| `docs` | - (通常不记录) |
| `test` | - (通常不记录) |
| `ci` | - (通常不记录) |
| `chore` | - (通常不记录) |
| `revert` | `Removed` |
| `BREAKING CHANGE` | `Changed` (带前缀) |

---

## 3. 条目格式

### 3.1 基本格式

```markdown
- Add user authentication with JWT tokens
```

### 3.2 带引用

```markdown
- Add user authentication with JWT tokens ([#123](link))
```

### 3.3 Breaking Changes

```markdown
- **Breaking:** Change API response format from snake_case to camelCase
```

### 3.4 祈使语气动词

| 类型 | 推荐动词 |
|------|----------|
| Added | Add, Introduce, Implement |
| Changed | Change, Update, Refactor, Improve, Optimize |
| Deprecated | Deprecate, Mark as deprecated |
| Removed | Remove, Delete, Drop |
| Fixed | Fix, Resolve, Correct |
| Security | Fix security issue, Patch vulnerability |

---

## 4. 版本号规范

### 4.1 Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: 不兼容的 API 变更
MINOR: 向后兼容的功能新增
PATCH: 向后兼容的 Bug 修复
```

### 4.2 日期格式

```
YYYY-MM-DD (ISO 8601)

正确: 2026-01-15
错误: 01/15/2026, Jan 15 2026
```

---

## 5. 版本链接

### 5.1 GitHub 格式

```markdown
[Unreleased]: https://github.com/user/repo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

### 5.2 GitLab 格式

```markdown
[Unreleased]: https://gitlab.com/user/repo/-/compare/v1.1.0...HEAD
[1.1.0]: https://gitlab.com/user/repo/-/compare/v1.0.0...v1.1.0
[1.0.0]: https://gitlab.com/user/repo/-/releases/v1.0.0
```

---

## 6. 更新流程

### 6.1 添加到 Unreleased

```markdown
## [Unreleased]

### Added

- Add new feature X  <!-- 新增条目 -->

### Fixed

- Fix existing bug Y
```

### 6.2 发布新版本

**Before:**
```markdown
## [Unreleased]

### Added
- Add feature X

## [1.0.0] - 2026-01-01
```

**After:**
```markdown
## [Unreleased]

## [1.1.0] - 2026-01-15

### Added
- Add feature X

## [1.0.0] - 2026-01-01
```

---

## 7. 批量模式

### 7.1 多提交汇总

当一次 changelog 更新包含多个提交时：

```markdown
### Added

- Add Todo type definitions (types)
- Add localStorage persistence utilities (storage)
- Add Todo state management hooks (hooks)
- Add Todo UI components (components)
- Add app entry and main interface (app)
```

### 7.2 按作用域分组

```markdown
### Added

**Core:**
- Add authentication service
- Add token management

**UI:**
- Add login form component
- Add dashboard layout
```

---

## 8. 最佳实践

### 8.1 应该记录

- 所有用户可感知的变更
- API 变更（新增、修改、删除）
- 配置变更
- 重要的性能改进
- 安全修复

### 8.2 不应记录

- 内部重构（除非影响 API）
- 代码格式化
- 测试变更
- CI/CD 变更
- 依赖更新（除非有安全影响）

### 8.3 书写规范

- 使用祈使语气
- 面向用户而非开发者
- 简洁但信息完整
- 重要变更放在前面
- Breaking Changes 必须突出显示
