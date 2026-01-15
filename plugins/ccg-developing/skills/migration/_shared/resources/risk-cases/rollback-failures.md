# 回滚失败风险案例库

## 案例 1: 数据库 DDL 变更不可逆

### 背景

某公司迁移时执行了字段类型变更：`VARCHAR(100) → TEXT`，后续业务失败需回滚，但发现无法恢复。

### 问题

```sql
-- 迁移时执行（不可逆）
ALTER TABLE users MODIFY COLUMN bio TEXT;

-- 尝试回滚
ALTER TABLE users MODIFY COLUMN bio VARCHAR(100);
-- 错误：Data too long for column 'bio' at row 3456
-- 原因：已有用户填写了超过 100 字符的 bio
```

### 根因

迁移过程中，用户已经利用新类型（TEXT）填写了长文本数据，回滚会导致数据截断。

### 正确做法

```sql
-- 方案 A: 双字段过渡（推荐）
-- Step 1: 添加新字段
ALTER TABLE users ADD COLUMN bio_v2 TEXT;

-- Step 2: 迁移数据
UPDATE users SET bio_v2 = bio;

-- Step 3: 应用层切换到 bio_v2
-- 观察 7 天，确认无问题

-- Step 4: 删除旧字段
ALTER TABLE users DROP COLUMN bio;
ALTER TABLE users RENAME COLUMN bio_v2 TO bio;

-- 回滚方案：如果需要回滚，bio 字段仍存在，无数据丢失

-- 方案 B: 保留迁移前快照
CREATE TABLE users_backup_20250113 AS SELECT * FROM users;
-- 回滚时从快照恢复
```

### 预防措施

- 不可逆 DDL 必须分阶段执行（添加 → 迁移 → 删除）
- 保留原字段至少 30 天
- 使用 Online DDL 工具（pt-online-schema-change, gh-ost）
- 回滚预案必须在迁移前测试

---

## 案例 2: 配置文件不一致导致回滚失败

### 背景

Spring Boot 3 迁移后回滚到 2.7，应用启动失败。

### 问题

```yaml
# application.yml（迁移时新增的配置）
spring:
  security:
    oauth2:
      resourceserver: # Spring Boot 3 新配置
        jwt:
          issuer-uri: https://auth.example.com

# 回滚到 Spring Boot 2.7
# 启动失败：Unrecognized field "resourceserver"
```

### 根因

配置文件已修改为新版本格式，但代码回滚到老版本，导致配置不兼容。

### 正确做法

```bash
# 方案 A: 配置版本化（Git）
git tag config-v2.7-stable
git tag config-v3.2-migration

# 回滚时同步回滚配置
git checkout config-v2.7-stable -- application.yml

# 方案 B: 配置中心（Apollo, Nacos）
# 配置与代码解耦，支持独立版本控制和回滚
```

### 预防措施

- 配置文件纳入版本控制
- 使用配置中心（支持灰度和回滚）
- 迁移前备份完整配置目录
- 回滚脚本包含配置恢复步骤

---

## 案例 3: 数据库版本降级不支持

### 背景

PostgreSQL 16 → 回滚到 12，发现官方不支持降级。

### 问题

```bash
# 尝试用 pg_dump 导出 PG 16 数据，导入 PG 12
pg_dump -h pg16-server -U postgres mydb > dump.sql
psql -h pg12-server -U postgres mydb < dump.sql

# 错误：
# ERROR:  syntax error at or near "NULLS NOT DISTINCT"
# 原因：PG 16 的 UNIQUE 索引语法 PG 12 不支持
```

### 根因

新版本数据库引入的特性（SQL 语法、数据格式）无法在老版本中解析。

### 正确做法

```bash
# 方案 A: 保留老版本实例（推荐）
# 迁移前不删除 PG 12 实例，仅切换流量到 PG 16
# 回滚时直接切回 PG 12（需确保数据同步）

# 方案 B: 逻辑复制（Bidirectional Replication）
# 使用 Pglogical 或 Bucardo 实现双向同步
# 迁移期间两个版本都在写入，回滚零影响

# 方案 C: 应用层双写
# 应用同时写入 PG 12 和 PG 16
# 读取仍从 PG 12（主）
# 验证 PG 16 数据一致性后切换
```

### 预防措施

- 数据库迁移保留原实例至少 30 天
- 使用双向复制或应用双写
- 回滚演练必须包含数据库回滚
- 记录所有使用的新特性，评估回滚风险

---

## 通用回滚准备清单

### 迁移前 (Pre-Migration)

- [ ] 编写详细回滚方案文档
- [ ] 测试环境验证回滚流程
- [ ] 保留完整数据备份（逻辑 + 物理）
- [ ] 配置文件版本化（Git tag）
- [ ] 确认依赖服务的回滚路径

### 迁移中 (During Migration)

- [ ] 保留老版本运行实例（不删除）
- [ ] 使用蓝绿部署或金丝雀发布
- [ ] 设置回滚决策点（P0 故障 5 分钟回滚）
- [ ] 实时监控关键指标（错误率、延迟）

### 回滚触发条件

- 错误率 > 1%（持续 3 分钟）
- P99 延迟增加 > 50%
- 数据一致性校验失败
- 核心功能不可用

### 回滚步骤（通用）

1. **停止新版本流量**（切换负载均衡）
2. **恢复配置文件**（从备份或 Git）
3. **回滚数据库**（如有 DDL 变更）
4. **验证老版本功能**（冒烟测试）
5. **恢复流量到老版本**
6. **事后分析**（5 Why 根因分析）

### 无法回滚的场景

| 场景                   | 原因               | 预防措施               |
| ---------------------- | ------------------ | ---------------------- |
| 数据库 DDL 不可逆      | 字段删除/类型变更  | 分阶段执行，保留原字段 |
| 数据已被新版本修改     | 新字段、新表结构   | 应用双写，数据向后兼容 |
| 依赖服务已升级且不兼容 | API 协议变更       | 服务间版本协商         |
| 数据库版本降级不支持   | 新版本特性无法降级 | 保留老版本实例         |

### 回滚失败应急方案

- **Plan B**: 快速修复新版本 Bug（Hot Fix）
- **Plan C**: 从备份恢复到迁移前状态（最后手段，可能丢失部分数据）
- **Plan D**: 启用降级开关，禁用问题功能

---

## 回滚演练模板

```bash
#!/bin/bash
# rollback-drill.sh - 回滚演练脚本

echo "=== 回滚演练开始 ==="

# Step 1: 切换流量到老版本
echo "[1/5] 切换负载均衡..."
kubectl set image deployment/myapp myapp=myapp:v1.0.0

# Step 2: 验证老版本健康
echo "[2/5] 健康检查..."
curl -f http://myapp/actuator/health || exit 1

# Step 3: 恢复配置
echo "[3/5] 恢复配置文件..."
git checkout v1.0.0-config -- application.yml
kubectl rollout restart deployment/myapp

# Step 4: 数据库回滚（如需要）
echo "[4/5] 数据库回滚..."
# 通常不执行，仅验证备份可用性
mysql -u root -p -e "SHOW TABLES FROM mydb_backup_20250113;"

# Step 5: 验证功能
echo "[5/5] 冒烟测试..."
curl -f http://myapp/api/health || exit 1

echo "=== 回滚演练成功 ==="
```

---

## 参考资料

- AWS Well-Architected Framework: Reliability Pillar
- Google SRE Book: Managing Rollouts
- Martin Fowler: BlueGreenDeployment
