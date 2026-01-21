# Session Compaction Patterns

## 压缩策略

### 必须保留

| 类型     | 说明       | 示例                   |
| -------- | ---------- | ---------------------- |
| 用户请求 | 原始需求   | "添加用户认证功能"     |
| 最终决策 | 关键决定   | "选择 JWT 方案"        |
| 代码变更 | 修改摘要   | "修改了 auth.ts:45-80" |
| 错误解决 | 问题和方案 | "修复了 CORS 错误"     |

### 可以删除

| 类型     | 说明       | 标记             |
| -------- | ---------- | ---------------- |
| 探索过程 | 多次尝试   | `[EXPLORATION]`  |
| 失败尝试 | 未成功方案 | `[FAILED]`       |
| 冗长输出 | 完整日志   | `[VERBOSE]`      |
| 中间状态 | 临时结果   | `[INTERMEDIATE]` |

## 压缩模板

### 会话摘要格式

```markdown
# Session Summary

**Date**: 2024-01-20
**Duration**: 2h 30m
**Task**: 实现用户认证系统

## 关键决策

1. 选择 JWT + Redis 方案
2. 使用 bcrypt 加密密码
3. 实现 refresh token 机制

## 代码变更

| 文件                | 变更 | 行数   |
| ------------------- | ---- | ------ |
| src/auth/service.ts | 新增 | +120   |
| src/auth/guard.ts   | 新增 | +45    |
| src/config/jwt.ts   | 修改 | +15 -3 |

## 遗留问题

- [ ] 添加速率限制
- [ ] 实现密码重置

## 学习要点

- 项目偏好 class-based service
- 测试覆盖率要求 > 80%
```

## MCP 持久化

### core_memory 实体结构

```json
{
  "entity_type": "session_summary",
  "entity_id": "session_20240120_auth",
  "content": {
    "task": "用户认证",
    "decisions": ["JWT", "bcrypt"],
    "files_changed": ["auth/service.ts"],
    "learnings": ["class-based service"]
  }
}
```

## 压缩流程

```
原始会话 (50,000 tokens)
        │
        ▼
    识别关键点
        │
        ▼
    分类内容
        │
        ▼
    应用策略
        │
        ▼
压缩摘要 (10,000 tokens)
        │
        ▼
    持久化到 MCP
```
