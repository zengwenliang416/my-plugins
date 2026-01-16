---
name: db-migration-helper
description: |
  【触发条件】当用户需要设计数据库表结构、生成迁移脚本、处理数据迁移、设计回滚方案时使用。
  【核心产出】输出：表结构设计、ORM 迁移脚本、数据迁移脚本、回滚方案。
  【不触发】不用于：数据分析（改用 csv-analyzer）、API 设计（改用 api-designer）。
  【先问什么】若缺少：数据库类型、ORM 框架、表关系描述，先提问补齐。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__serena__search_for_pattern, mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__codex__codex
---

# DB Migration Helper - 数据库迁移助手

## 工作流程

```
1. 确认 ORM/数据库 → 2. 设计表结构 → 3. 生成迁移 → 4. 编写回滚方案
```

---

## 表结构设计规范

### 命名规范

```sql
-- 表名：小写复数，下划线分隔
users, order_items, user_profiles

-- 字段名：小写，下划线分隔
user_id, created_at, is_active

-- 主键：id 或 表名单数_id
id, user_id

-- 外键：关联表单数_id
user_id, order_id

-- 索引名：idx_表名_字段名
idx_users_email, idx_orders_user_id_status
```

### 标准字段

```sql
-- 每个表都应包含
id          BIGINT PRIMARY KEY AUTO_INCREMENT,
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

-- 软删除（可选）
deleted_at  TIMESTAMP NULL,

-- 乐观锁（可选）
version     INT DEFAULT 1
```

### 索引设计

```sql
-- 唯一索引
UNIQUE INDEX idx_users_email (email)

-- 普通索引
INDEX idx_orders_user_id (user_id)

-- 复合索引（最左前缀原则）
INDEX idx_orders_user_status_created (user_id, status, created_at)
```

---

## ORM 迁移

### 支持的 ORM

| ORM       | 语言                  | 模板位置                                |
| --------- | --------------------- | --------------------------------------- |
| Prisma    | TypeScript/JavaScript | `references/orm-templates.md#prisma`    |
| TypeORM   | TypeScript            | `references/orm-templates.md#typeorm`   |
| Sequelize | JavaScript            | `references/orm-templates.md#sequelize` |
| Alembic   | Python/SQLAlchemy     | `references/orm-templates.md#alembic`   |

### 命令速查

| ORM       | 生成迁移                            | 应用迁移                    | 回滚                    |
| --------- | ----------------------------------- | --------------------------- | ----------------------- |
| Prisma    | `npx prisma migrate dev --name xxx` | `npx prisma migrate deploy` | `resolve --rolled-back` |
| TypeORM   | `migration:generate`                | `migration:run`             | `migration:revert`      |
| Sequelize | `migration:generate`                | `db:migrate`                | `db:migrate:undo`       |
| Alembic   | `alembic revision -m`               | `alembic upgrade head`      | `alembic downgrade -1`  |

---

## 工具脚本

```bash
# 生成迁移脚本骨架
python scripts/migration-generator.py --orm prisma --table users

# 比较两个 schema 的差异
python scripts/schema-diff.py schema_v1.sql schema_v2.sql
```

---

## 使用示例

```
设计一个电商订单系统的数据库表结构，包括：
- 用户、商品、订单、订单明细、支付记录
- 考虑索引设计
- 生成 Prisma schema

给 users 表添加 phone 字段：
- 从 user_profiles 表迁移数据
- 生成 TypeORM 迁移脚本
- 提供回滚方案

这条 SQL 查询很慢，帮我分析并优化：
SELECT * FROM orders WHERE user_id = 1 AND status = 'pending'
ORDER BY created_at DESC
```

---

## 参考文档导航

| 需要         | 读取                               |
| ------------ | ---------------------------------- |
| ORM 迁移模板 | `references/orm-templates.md`      |
| 数据迁移模式 | `references/migration-patterns.md` |

---

## 最佳实践

### 迁移安全

- 始终编写 down 方法
- 大表迁移分批执行
- 生产环境迁移前先在 staging 测试

### 向后兼容

- 新增字段设置默认值或允许 NULL
- 删除字段前先停止使用
- 重命名字段使用两步迁移

### 性能考量

- 避免在高峰期执行迁移
- 大表添加索引使用 ONLINE DDL
- 批量更新避免长事务
