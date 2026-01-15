# 数据迁移模式

常见迁移场景的最佳实践。

---

## 添加字段并迁移数据

```typescript
// TypeORM 示例
export class AddPhoneToUsers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 添加新字段（允许 NULL）
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "phone",
        type: "varchar",
        length: "20",
        isNullable: true,
      }),
    );

    // 2. 迁移数据（从旧表或计算）
    await queryRunner.query(`
      UPDATE users u
      JOIN user_profiles p ON u.id = p.user_id
      SET u.phone = p.phone
      WHERE p.phone IS NOT NULL
    `);

    // 3. 设置非空约束（如需要）
    // await queryRunner.changeColumn('users', 'phone', new TableColumn({
    //   name: 'phone',
    //   type: 'varchar',
    //   length: '20',
    //   isNullable: false,
    // }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("users", "phone");
  }
}
```

---

## 分批迁移大表

```typescript
export class MigrateLargeTable implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await queryRunner.query(`
        UPDATE orders
        SET new_column = COMPUTE_VALUE(old_column)
        WHERE id > ${offset}
        ORDER BY id
        LIMIT ${batchSize}
      `);

      hasMore = result.affectedRows === batchSize;
      offset += batchSize;

      // 避免锁表太久
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
```

---

## 回滚方案模板

````markdown
## 迁移回滚方案

### 迁移信息

- 迁移名称：AddUserPhoneField
- 迁移时间：2024-01-15 10:00:00
- 影响表：users
- 影响记录数：约 100,000

### 回滚步骤

#### 1. 停止相关服务

```bash
kubectl scale deployment api --replicas=0
```
````

#### 2. 执行回滚

```bash
# Prisma
npx prisma migrate resolve --rolled-back AddUserPhoneField

# TypeORM
npm run typeorm migration:revert

# Sequelize
npx sequelize db:migrate:undo
```

#### 3. 验证回滚

```sql
-- 确认字段已删除
DESCRIBE users;

-- 确认数据完整
SELECT COUNT(*) FROM users;
```

#### 4. 重启服务

```bash
kubectl scale deployment api --replicas=3
```

### 风险评估

- 数据丢失风险：低（仅删除新增字段）
- 服务中断时间：约 5 分钟
- 回滚后遗留问题：无

```

---

## 最佳实践清单

### 迁移安全
- [ ] 始终编写 down 方法
- [ ] 大表迁移分批执行
- [ ] 生产环境迁移前先在 staging 测试
- [ ] 保留数据备份

### 向后兼容
- [ ] 新增字段设置默认值或允许 NULL
- [ ] 删除字段前先停止使用
- [ ] 重命名字段使用两步迁移

### 性能考量
- [ ] 避免在高峰期执行迁移
- [ ] 大表添加索引使用 ONLINE DDL
- [ ] 批量更新避免长事务
```
