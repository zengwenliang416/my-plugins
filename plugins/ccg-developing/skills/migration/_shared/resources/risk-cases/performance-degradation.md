# 性能退化风险案例库

## 案例 1: 索引策略变更导致查询超时

### 背景

升级 PostgreSQL 12 → 16 后，核心查询从 50ms 暴涨到 8秒。

### 根因

PostgreSQL 16 查询计划器更倾向于并行扫描，但该查询的数据分布不适合并行。

```sql
-- 查询
SELECT * FROM orders WHERE status = 'pending' AND created_at > NOW() - INTERVAL '7 days';

-- PG 12 计划：Index Scan (50ms)
-- PG 16 计划：Parallel Seq Scan (8000ms)
```

### 解决方案

```sql
-- 禁用特定查询的并行扫描
SET max_parallel_workers_per_gather = 0;

-- 或强制使用索引
CREATE INDEX CONCURRENTLY idx_orders_status_created
  ON orders(status, created_at) WHERE status = 'pending';
```

### 预防措施

- 迁移前收集慢查询基线（P95, P99 延迟）
- 使用 EXPLAIN ANALYZE 对比新老版本执行计划
- 灰度切换时监控查询延迟

---

## 案例 2: JVM GC 策略不兼容

### 背景

Java 8 → Java 17 迁移后，Full GC 频率增加 5x，STW 时间达 2 秒。

### 根因

Java 17 默认 G1GC 参数针对现代硬件优化，但老应用堆配置不适配。

### 解决方案

```bash
# 调整 G1GC 参数
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16M
-XX:InitiatingHeapOccupancyPercent=45

# 或使用 ZGC（大堆场景）
-XX:+UseZGC
-XX:ZCollectionInterval=120
```

### 预防措施

- 性能测试包含压测（JMeter, Gatling）
- 监控 GC 日志（-Xlog:gc\*）
- 对比迁移前后的 P99 延迟

---

## 通用性能验证清单

### 基准测试 (Baseline)

- [ ] 收集迁移前 P50/P95/P99 延迟
- [ ] 记录 TPS/QPS 峰值
- [ ] 分析慢查询（>100ms）

### 迁移后验证

- [ ] 相同压力下性能对比（±10% 可接受）
- [ ] 监控资源使用率（CPU, Memory, I/O）
- [ ] 检查是否有新的慢查询

### 回滚阈值

- P99 延迟增加 > 50% → 立即回滚
- 错误率增加 > 1% → 立即回滚
- CPU/Memory 使用率 > 80% 持续 5 分钟 → 告警
