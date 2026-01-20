# Conventional Commits Reference

Conventional Commits 1.0.0 规范及 Emoji 映射。

---

## 1. 格式规范

### 1.1 提交消息结构

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 1.2 标题行规则

- **长度限制**: ≤72 字符（推荐 ≤50 字符）
- **大小写**: 首字母小写
- **标点**: 末尾不加句号
- **语气**: 祈使语气（Add, Fix, Update）

---

## 2. 类型定义

### 2.1 标准类型

| 类型 | 描述 | SemVer 影响 |
|------|------|-------------|
| `feat` | 新功能 | MINOR |
| `fix` | Bug 修复 | PATCH |
| `docs` | 文档更新 | - |
| `style` | 代码格式（不影响逻辑） | - |
| `refactor` | 代码重构（非 feat/fix） | - |
| `perf` | 性能优化 | PATCH |
| `test` | 测试相关 | - |
| `build` | 构建系统/依赖 | - |
| `ci` | CI/CD 配置 | - |
| `chore` | 其他杂项 | - |
| `revert` | 撤销提交 | - |

### 2.2 Breaking Changes

**标记方式**：

```
feat!: add new API (breaking)
feat(api)!: change response format

# 或在 footer 中
feat: add new API

BREAKING CHANGE: API response format changed
```

**SemVer 影响**: MAJOR

---

## 3. Emoji 映射

### 3.1 类型 Emoji

| 类型 | Emoji | Unicode |
|------|-------|---------|
| `feat` | ✨ | `:sparkles:` |
| `fix` | 🐛 | `:bug:` |
| `docs` | 📝 | `:memo:` |
| `style` | 💄 | `:lipstick:` |
| `refactor` | ♻️ | `:recycle:` |
| `perf` | ⚡️ | `:zap:` |
| `test` | ✅ | `:white_check_mark:` |
| `build` | 📦 | `:package:` |
| `ci` | 👷 | `:construction_worker:` |
| `chore` | 🔧 | `:wrench:` |
| `revert` | ⏪ | `:rewind:` |

### 3.2 其他常用 Emoji

| 场景 | Emoji | 说明 |
|------|-------|------|
| Breaking Change | 💥 | `:boom:` |
| 安全修复 | 🔒 | `:lock:` |
| 紧急修复 | 🚑 | `:ambulance:` |
| WIP | 🚧 | `:construction:` |
| 初始化 | 🎉 | `:tada:` |
| 配置文件 | ⚙️ | `:gear:` |
| 数据库 | 🗃️ | `:card_file_box:` |
| 日志相关 | 🔊 | `:loud_sound:` |
| UI/UX | 🎨 | `:art:` |
| 国际化 | 🌐 | `:globe_with_meridians:` |

---

## 4. Scope 规范

### 4.1 常见 Scope

| Scope | 适用场景 |
|-------|----------|
| `api` | API 相关变更 |
| `auth` | 认证授权 |
| `ui` | 用户界面 |
| `db` | 数据库相关 |
| `config` | 配置相关 |
| `deps` | 依赖更新 |
| `core` | 核心模块 |

### 4.2 Scope 命名规则

- 使用 kebab-case：`user-auth`
- 保持简短：1-2 个单词
- 避免过于具体：用 `api` 而非 `api-v2-users-endpoint`

---

## 5. Body 规范

### 5.1 格式要求

- 空行分隔标题和正文
- 每行 ≤72 字符
- 解释"为什么"而非"是什么"

### 5.2 示例

```
fix(auth): resolve token refresh race condition

The previous implementation could fail when multiple
requests triggered token refresh simultaneously.

This change introduces a mutex lock to ensure only
one refresh operation runs at a time.
```

---

## 6. Footer 规范

### 6.1 关联 Issue

```
Closes #123
Fixes #456
Refs #789
```

### 6.2 Breaking Changes

```
BREAKING CHANGE: API response format changed from
snake_case to camelCase. All clients need to update
their parsing logic.
```

### 6.3 Co-authors

```
Co-authored-by: Name <email@example.com>
```

---

## 7. 完整示例

### 7.1 简单提交

```
feat(auth): add JWT token refresh
```

### 7.2 带 Body

```
fix(api): handle null response from external service

The external payment service occasionally returns null
instead of an error object. Added null check to prevent
runtime crashes.

Fixes #234
```

### 7.3 Breaking Change

```
feat(api)!: change response format to camelCase

Migrate all API responses from snake_case to camelCase
for consistency with frontend conventions.

BREAKING CHANGE: All API response keys are now camelCase.
Clients using snake_case keys need to update.

Closes #567
```

### 7.4 带 Emoji

```
✨ feat(dashboard): add real-time notifications

Implement WebSocket-based notification system for
instant updates on the dashboard.

- Add NotificationService
- Integrate Socket.IO
- Add notification bell component

Closes #890
```
