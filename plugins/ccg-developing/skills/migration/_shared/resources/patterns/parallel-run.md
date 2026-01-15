# Parallel Run（并行运行模式）

## 定义

新老系统同时运行，接收相同的输入，产生各自的输出，通过对比输出验证新系统正确性。用于高风险场景的迁移验证。

## 适用场景

- **金融交易系统**（计费、支付、清算）
- **监管报送系统**（财务报表、合规数据）
- **核心算法替换**（风控模型、定价引擎）
- **数据准确性要求极高**的系统

## 实施步骤

### 1. 设计流量复制机制

```java
// 方案 A: 应用层复制（侵入式，精确控制）
@RestController
public class OrderController {

    @Autowired
    private LegacyOrderService legacyService;

    @Autowired
    private NewOrderService newService;

    @Autowired
    private ParallelRunOrchestrator orchestrator;

    @PostMapping("/api/orders")
    public OrderResponse createOrder(@RequestBody OrderRequest request) {
        return orchestrator.execute(request, legacyService, newService);
    }
}

// 方案 B: 网络层复制（非侵入，通用性强）
// 使用 Envoy/Nginx 配置 traffic mirroring
http {
    upstream legacy_backend {
        server legacy.example.com:8080;
    }

    upstream new_backend {
        server new.example.com:8080;
    }

    server {
        location /api/ {
            proxy_pass http://legacy_backend;
            # 镜像流量到新系统（不影响主流程）
            mirror /mirror;
            mirror_request_body on;
        }

        location /mirror {
            internal;
            proxy_pass http://new_backend$request_uri;
            proxy_set_header X-Mirrored-Request true;
        }
    }
}
```

### 2. 实现并行执行器

```java
@Service
public class ParallelRunOrchestrator {

    @Autowired
    private ComparisonService comparisonService;

    @Autowired
    private MetricsService metricsService;

    @Async
    public OrderResponse execute(
        OrderRequest request,
        LegacyOrderService legacy,
        NewOrderService newService
    ) {
        // Step 1: 主路径执行（老系统）
        OrderResponse legacyResponse = legacy.process(request);

        // Step 2: 并行执行（新系统，非阻塞）
        CompletableFuture.runAsync(() -> {
            try {
                OrderResponse newResponse = newService.process(request);

                // Step 3: 对比结果
                ComparisonResult comparison = comparisonService.compare(
                    legacyResponse,
                    newResponse
                );

                // Step 4: 记录差异
                if (!comparison.isMatch()) {
                    log.warn("Parallel run mismatch: requestId={}, diff={}",
                        request.getId(), comparison.getDiff());

                    // 持久化差异记录
                    comparisonService.saveMismatch(request, comparison);

                    // 监控指标
                    metricsService.recordMismatch("order.create", comparison.getSeverity());
                }
            } catch (Exception e) {
                log.error("New system execution failed", e);
                metricsService.recordError("order.create.new_system", e);
            }
        });

        // Step 5: 返回老系统结果（确保业务不受影响）
        return legacyResponse;
    }
}
```

### 3. 设计对比规则

```java
@Service
public class ComparisonService {

    public ComparisonResult compare(OrderResponse legacy, OrderResponse newResp) {
        ComparisonResult result = new ComparisonResult();

        // 关键字段严格对比
        result.addCheck("orderId", legacy.getOrderId(), newResp.getOrderId());
        result.addCheck("totalAmount", legacy.getTotalAmount(), newResp.getTotalAmount());

        // 时间戳字段容忍 1 秒误差
        result.addCheck("createdAt",
            legacy.getCreatedAt(),
            newResp.getCreatedAt(),
            Duration.ofSeconds(1));

        // 浮点数字段容忍 0.01 误差
        result.addCheck("discount",
            legacy.getDiscount(),
            newResp.getDiscount(),
            0.01);

        // 非关键字段记录但不影响结果
        result.addInfo("processingTime", legacy.getProcessingTime(), newResp.getProcessingTime());

        return result;
    }

    public void saveMismatch(OrderRequest request, ComparisonResult comparison) {
        MismatchRecord record = MismatchRecord.builder()
            .requestId(request.getId())
            .requestPayload(toJson(request))
            .legacyResponse(toJson(comparison.getLegacyResponse()))
            .newResponse(toJson(comparison.getNewResponse()))
            .diff(comparison.getDiff())
            .severity(comparison.getSeverity())
            .timestamp(Instant.now())
            .build();

        mismatchRepository.save(record);
    }
}
```

### 4. 监控与分析

```yaml
# 关键指标
metrics:
  - name: parallel_run.mismatch_rate
    description: 新老系统结果不一致率
    calculation: mismatches / total_requests
    threshold: 0.001 # 0.1% 以上触发调查

  - name: parallel_run.new_system_error_rate
    description: 新系统执行失败率
    threshold: 0.01 # 1% 以上停止并行运行

  - name: parallel_run.latency_impact
    description: 并行运行对主路径延迟的影响
    threshold: 10ms # P99 延迟增加不超过 10ms

  - name: parallel_run.resource_overhead
    description: 并行运行的资源开销
    threshold: 1.3x # CPU/内存开销不超过 30%
```

```sql
-- 分析差异模式（SQL 查询）
SELECT
  diff_field,
  severity,
  COUNT(*) as occurrence_count,
  AVG(ABS(legacy_value - new_value)) as avg_diff
FROM mismatch_records
WHERE timestamp > NOW() - INTERVAL '24 HOURS'
GROUP BY diff_field, severity
ORDER BY occurrence_count DESC
LIMIT 10;
```

### 5. 渐进式切换

```
Week 1-2:  10% 流量并行运行，修复明显差异
Week 3-4:  50% 流量并行运行，验证边界案例
Week 5-6:  100% 流量并行运行，对比结果稳定
Week 7:    切换到新系统（返回新系统结果）
Week 8:    反向并行运行（新系统为主，老系统对比）
Week 9:    下线老系统
```

## 优点

| 优点               | 说明                               |
| ------------------ | ---------------------------------- |
| **零风险验证**     | 新系统错误不影响生产业务           |
| **全量真实流量**   | 使用生产数据验证，发现边界案例     |
| **量化可信度**     | 通过不一致率指标评估新系统成熟度   |
| **无需Mock数据**   | 直接使用生产流量，无需构造测试用例 |
| **渐进式信心建立** | 从小流量到全量，逐步增强团队信心   |

## 缺点

| 缺点             | 说明                                 | 缓解措施                       |
| ---------------- | ------------------------------------ | ------------------------------ |
| **资源开销大**   | 双倍计算资源，成本增加               | 仅在关键路径使用，限制并行比例 |
| **副作用风险**   | 新系统可能产生非预期的副作用（写库） | 使用只读模式，禁止写操作       |
| **对比成本高**   | 需实现复杂的结果对比逻辑             | 使用通用对比框架               |
| **不适合异步**   | 异步系统难以对比结果                 | 改用事件溯源对比最终状态       |
| **监管合规问题** | 某些行业禁止未经审计的系统处理数据   | 申请沙箱环境或监管豁免         |

## 案例参考

### 案例 1: GitHub MySQL → Vitess 迁移

- **背景**: 分库分表中间件迁移
- **策略**: Parallel Run + Shadow Traffic
- **关键步骤**:
  1. Vitess 以只读模式接收镜像流量
  2. 对比查询结果（延迟、数据一致性）
  3. 发现并修复 11 个边界 Bug
  4. 全量切换到 Vitess
- **周期**: 18 个月
- **结果**: 零停机迁移，数据零丢失

### 案例 2: Stripe 计费引擎重构

- **背景**: 计费算法从 Ruby 重写为 Go
- **策略**: Parallel Run + Approval Testing
- **关键技术**:
  - 每次计费同时调用新老引擎
  - 对比结果精确到分（0.01 误差触发告警）
  - 记录所有不一致案例，人工审核
- **结果**: 发现 137 个边界案例，修复后切换

## 技术要点

### 副作用隔离

```java
// ✅ 正确：新系统使用只读数据库副本
@Configuration
public class NewSystemDataSourceConfig {

    @Bean
    public DataSource newSystemDataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:mysql://readonly-replica:3306/db")
            .username("readonly_user")
            .build();
    }
}

// ❌ 错误：新系统直接操作生产数据库
public class NewOrderService {
    public void process(Order order) {
        orderRepository.save(order);  // 风险！可能产生重复数据
    }
}
```

### 流量控制

```java
// 动态控制并行运行比例
@Component
public class ParallelRunConfig {

    @Value("${parallel-run.enabled}")
    private boolean enabled;

    @Value("${parallel-run.sampling-rate}")
    private double samplingRate;  // 0.0 ~ 1.0

    public boolean shouldRunInParallel(OrderRequest request) {
        if (!enabled) {
            return false;
        }

        // 基于请求 ID 的稳定采样（同一请求总是得到相同结果）
        long hash = Hashing.murmur3_128()
            .hashString(request.getId(), StandardCharsets.UTF_8)
            .asLong();

        return (Math.abs(hash) % 10000) < (samplingRate * 10000);
    }
}
```

## 决策树

```
新系统错误是否可容忍？
├─ 否 → Parallel Run（推荐）
└─ 是 → 是否需要全量真实流量验证？
    ├─ 是 → Parallel Run
    └─ 否 → Branch by Abstraction + Canary
```

## 参考资源

- Google SRE Book: [Testing for Reliability](https://sre.google/sre-book/testing-reliability/)
- GitHub Engineering: [MySQL High Availability at GitHub](https://github.blog/engineering/infrastructure/mysql-high-availability-at-github/)
- Cindy Sridharan: _Distributed Systems Observability_, Chapter 6

## Gate Checks

- [x] 定义清晰（同时运行 + 结果对比）
- [x] 适用场景具体（4 类高风险场景）
- [x] 实施步骤可操作（5 步，含流量复制、对比逻辑）
- [x] 优缺点对比完整（5 个优点，5 个缺点 + 缓解措施）
- [x] 案例参考真实（GitHub、Stripe）
- [x] 技术要点量化（监控阈值、采样算法）
- [x] 决策树辅助选型
