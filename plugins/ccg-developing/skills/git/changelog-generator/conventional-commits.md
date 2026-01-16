# Conventional Commits 规范

## 提交格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Type 类型

| Type       | 说明     | 示例                    |
| ---------- | -------- | ----------------------- |
| `feat`     | 新功能   | feat: 添加用户登录功能  |
| `fix`      | Bug 修复 | fix: 修复密码重置失败   |
| `docs`     | 文档变更 | docs: 更新 API 文档     |
| `style`    | 代码格式 | style: 格式化代码       |
| `refactor` | 重构     | refactor: 提取公共方法  |
| `perf`     | 性能优化 | perf: 优化查询性能      |
| `test`     | 测试相关 | test: 添加单元测试      |
| `build`    | 构建系统 | build: 升级 webpack     |
| `ci`       | CI 配置  | ci: 添加 GitHub Actions |
| `chore`    | 杂项     | chore: 更新依赖         |
| `revert`   | 回滚     | revert: 回滚 feat(user) |

## Scope 范围

范围是可选的，用于说明影响的模块：

```
feat(auth): 添加 OAuth 登录
fix(payment): 修复支付超时
docs(api): 更新接口文档
```

常见 scope：

- `auth` - 认证相关
- `user` - 用户模块
- `api` - 接口相关
- `ui` - 界面相关
- `db` - 数据库相关
- `config` - 配置相关

## 破坏性变更

在 type/scope 后添加 `!` 或在 footer 中使用 `BREAKING CHANGE:`

```
feat!: 移除已废弃的 API 端点

BREAKING CHANGE: /api/v1/users 已移除，请使用 /api/v2/users
```

```
feat(api)!: 更改用户接口返回格式

BREAKING CHANGE: 用户接口返回格式从数组改为对象
迁移方法: 更新客户端解析逻辑
```

## Footer 格式

### 关联 Issue

```
fix: 修复登录失败问题

Closes #123
Fixes #124, #125
Resolves #126
```

### 多人协作

```
feat: 实现新功能

Co-authored-by: Name <email@example.com>
Co-authored-by: Name2 <email2@example.com>
```

### 审阅信息

```
feat: 添加新功能

Reviewed-by: Name <email@example.com>
Signed-off-by: Name <email@example.com>
```

## 完整示例

### 简单提交

```
feat: 添加用户头像上传功能
```

### 带 scope

```
feat(user): 支持修改用户昵称
```

### 带 body

```
fix(auth): 修复 token 过期处理

修复当 token 过期时页面无限刷新的问题。
现在会正确跳转到登录页面。
```

### 带 footer

```
feat(payment): 新增微信支付

实现微信支付接口集成，支持：
- 扫码支付
- JSAPI 支付
- 小程序支付

Closes #234
Reviewed-by: @senior-dev
```

### 破坏性变更

```
feat(api)!: 重构用户接口

BREAKING CHANGE: 用户列表接口从 GET /users 改为 GET /api/v2/users

迁移步骤:
1. 更新 API 调用路径
2. 调整响应数据解析
3. 更新相关测试

Closes #300
```

## Changelog 映射

| Commit Type       | Changelog Section    |
| ----------------- | -------------------- |
| `feat`            | ✨ Features / Added  |
| `fix`             | 🐛 Bug Fixes / Fixed |
| `perf`            | ⚡ Performance       |
| `docs`            | 📚 Documentation     |
| `refactor`        | ♻️ Refactor          |
| `BREAKING CHANGE` | 💥 Breaking Changes  |
