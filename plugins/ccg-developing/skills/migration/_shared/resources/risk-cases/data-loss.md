# 数据丢失风险案例库

## 案例 1: 字符集转换导致数据截断

### 背景

某电商平台从 MySQL 5.7（latin1）迁移到 8.0（utf8mb4），产品描述字段包含 emoji 表情。

### 问题

latin1 字符集每个字符 1 字节，VARCHAR(100) 可存储 100 个字符。
utf8mb4 每个字符最多 4 字节，VARCHAR(100) 实际只能存储 25 个 emoji。

迁移时数据被截断，导致 3,200 条产品描述丢失后半部分。

### 根因

```sql
-- 迁移前（latin1，100 字节）
CREATE TABLE products (
  description VARCHAR(100) CHARACTER SET latin1
);

-- 迁移后（utf8mb4，100 字符 = 最多 400 字节）
ALTER TABLE products
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

迁移工具按**字符数**而非**字节数**分配空间，未预估 emoji 占用。

### 正确做法

```sql
-- 步骤 1: 评估现有数据的实际字节占用
SELECT
  MAX(LENGTH(description)) as max_bytes,
  MAX(CHAR_LENGTH(description)) as max_chars
FROM products;

-- 结果: max_bytes=280, max_chars=95
-- 结论: 需要 280 / 4 = 70 个字符（utf8mb4）

-- 步骤 2: 扩大字段长度
ALTER TABLE products
  MODIFY description VARCHAR(200) CHARACTER SET latin1;

-- 步骤 3: 转换字符集
ALTER TABLE products
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 步骤 4: 验证数据完整性
SELECT COUNT(*) FROM products
WHERE CHAR_LENGTH(description) < CHAR_LENGTH(CONVERT(description USING latin1));
-- 应返回 0
```

### 预防措施

| 措施               | 说明                            |
| ------------------ | ------------------------------- |
| **提前测试**       | 在测试环境用生产数据快照验证    |
| **容量评估**       | 计算最坏情况（全emoji）所需空间 |
| **分批迁移**       | 先迁移 10% 数据观察             |
| **数据校验**       | 迁移后比对源表和目标表行数/哈希 |
| **备份保留 30 天** | 保留原始备份直到业务验证通过    |

### 影响

- 3,200 条产品描述数据损坏
- 用户投诉 127 起
- 回滚恢复用时 4 小时
- 损失估算：¥50,000（客服 + 声誉）

---

## 案例 2: 数据库主从切换时数据丢失

### 背景

某金融公司从自建 MySQL 迁移到阿里云 RDS，使用主从同步 + 流量切换方案。

### 问题

切换过程中，主库写入了 320 条交易记录，但从库未同步完成就切换流量，导致这 320 条数据永久丢失。

### 根因

```bash
# 迁移流程（错误）
1. 启动主从同步（源 → RDS）
2. 观察延迟：SHOW SLAVE STATUS\G  # Seconds_Behind_Master: 3
3. 认为延迟可接受，立即切换流量到 RDS
4. 切换后发现源库 binlog position 大于 RDS 已同步的 position

# 根因分析
- Seconds_Behind_Master=3 表示从库执行的最后一个事件比主库慢 3 秒
- 但这不意味着所有数据已同步！主库在这 3 秒内可能写入了更多数据
- 切换时主库仍在接收写入，从库未追上
```

### 正确做法

```sql
-- 方案 A: 锁表切换（适合可短暂停机）
-- 步骤 1: 主库只读
SET GLOBAL read_only = ON;

-- 步骤 2: 等待从库完全追上
-- 在从库执行：
SHOW SLAVE STATUS\G
-- 确认：Seconds_Behind_Master: 0

-- 步骤 3: 验证数据一致性
-- 主库：
SELECT MAX(id) FROM transactions;  -- 结果: 50320

-- 从库：
SELECT MAX(id) FROM transactions;  -- 结果: 50320（一致）

-- 步骤 4: 切换流量到从库（RDS）
-- 应用配置指向 RDS

-- 步骤 5: 提升从库为主库
STOP SLAVE;
RESET SLAVE ALL;

-- 方案 B: 双写切换（无停机）
-- 应用层同时写入源库和 RDS，读取仍从源库
-- 等待 RDS 追上后，切换读取到 RDS
-- 停止写入源库
```

### 预防措施

| 措施            | 说明                               |
| --------------- | ---------------------------------- |
| **主库只读**    | 切换前设置 read_only=ON            |
| **双重验证**    | 检查 binlog position 和行数        |
| **灰度切换**    | 先切 1% 流量，观察 24 小时         |
| **双写过渡**    | 同时写入新老库 1 周                |
| **数据对账**    | 每日对比关键表行数和校验和         |
| **Binlog 保留** | 保留源库 binlog 7 天，用于事后恢复 |

### 影响

- 320 条交易记录丢失
- 监管报送不一致
- 客户资金冻结 12 小时
- 罚款：¥500,000

---

## 案例 3: ORM 升级导致批量删除

### 背景

某SaaS公司从 Hibernate 5.6 升级到 6.4，一个看似无关的配置变更导致批量误删除。

### 问题

Hibernate 6 默认启用级联删除优化，触发了意外的 `ON DELETE CASCADE`。

测试环境测试通过（小数据量），但生产环境删除了 12 万条用户数据。

### 根因

```java
// Hibernate 5.6（老代码）
@Entity
public class User {
    @OneToMany(mappedBy = "user")
    private List<Order> orders;
}

@Entity
public class Order {
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}

// 数据库表结构（手动创建，未使用 Hibernate DDL）
CREATE TABLE users (id BIGINT PRIMARY KEY);
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

// 应用代码
userRepository.delete(inactiveUser);  // 删除一个不活跃用户

// Hibernate 5.6 行为：
// 1. DELETE FROM orders WHERE user_id = ?
// 2. DELETE FROM users WHERE id = ?

// Hibernate 6.4 行为：
// 1. DELETE FROM users WHERE id = ?  （直接删除用户）
// 2. 数据库 FK 触发 ON DELETE CASCADE，自动删除关联订单

// 问题：
// 测试环境每个用户只有 1-2 个订单，未察觉异常
// 生产环境某用户有 5,000 个历史订单，全部被误删
```

### 正确做法

```sql
-- 步骤 1: 禁用数据库级别的 CASCADE（迁移前）
ALTER TABLE orders
  DROP FOREIGN KEY fk_user_id,
  ADD CONSTRAINT fk_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT;  -- 禁止级联删除

-- 步骤 2: 由应用层控制删除顺序
@PreRemove
public void preRemove() {
    if (!orders.isEmpty()) {
        throw new IllegalStateException("Cannot delete user with existing orders");
    }
}

-- 步骤 3: 添加软删除
@Entity
@Where(clause = "deleted = false")
public class User {
    @Column(name = "deleted")
    private boolean deleted = false;

    public void softDelete() {
        this.deleted = true;
    }
}
```

### 预防措施

| 措施                 | 说明                                   |
| -------------------- | -------------------------------------- |
| **生产级测试数据**   | 测试环境使用生产数据规模               |
| **删除操作审计**     | 记录所有 DELETE 语句到审计日志         |
| **软删除优先**       | 关键数据使用软删除标记                 |
| **FK 策略 RESTRICT** | 数据库 FK 设置为 RESTRICT 而非 CASCADE |
| **删除前快照**       | 批量删除前备份待删除数据               |

### 影响

- 12 万条订单记录误删除
- 恢复用时 8 小时（从备份恢复）
- 业务中断 1 天
- 客户流失 230 人

---

## 通用预防清单

### 迁移前 (Pre-Migration)

- [ ] 完整备份（逻辑备份 + 物理备份）
- [ ] 在测试环境用生产数据快照验证
- [ ] 评估数据容量变化（字符集、索引）
- [ ] 制定回滚方案（含 RTO/RPO）
- [ ] 设置数据完整性校验点

### 迁移中 (During Migration)

- [ ] 启用慢查询日志（监控异常操作）
- [ ] 实时监控主从延迟
- [ ] 分批迁移（不超过总量 10%）
- [ ] 每批迁移后验证数据一致性
- [ ] 保留源库只读模式 24 小时

### 迁移后 (Post-Migration)

- [ ] 对比关键表行数（源 vs 目标）
- [ ] 计算数据校验和（MD5/SHA256）
- [ ] 业务功能回归测试
- [ ] 监控错误日志 7 天
- [ ] 保留回滚路径 30 天

### 紧急恢复工具

```bash
# 1. 从 binlog 恢复误删数据
mysqlbinlog --start-datetime="2025-01-13 10:00:00" \
            --stop-datetime="2025-01-13 10:05:00" \
            --database=mydb \
            mysql-bin.000123 | mysql -u root -p

# 2. 使用 Percona Toolkit 对比数据
pt-table-checksum --host=source_db --databases=mydb
pt-table-sync --execute --sync-to-master source_db

# 3. 快速恢复单表（从备份）
mysql -u root -p mydb < backup_orders_table.sql
```

## 参考资料

- MySQL 8.0 Character Set Migration Guide
- Percona Toolkit for MySQL
- AWS Database Migration Service Best Practices
- Hibernate 6 Migration Guide
