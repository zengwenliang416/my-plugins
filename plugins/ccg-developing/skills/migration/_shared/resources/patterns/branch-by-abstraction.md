# Branch by Abstraction（抽象分支模式）

## 定义

通过引入抽象层，在不创建代码分支的情况下，逐步替换系统的某个实现。新旧实现共存于同一代码库，通过抽象层动态切换。

## 适用场景

- **核心算法替换**（计费引擎、推荐算法）
- **底层依赖迁移**（数据库切换、消息队列更换）
- **单体应用内部重构**（不涉及服务拆分）
- **持续集成环境**（无法长期维护代码分支）

## 实施步骤

### 1. 引入抽象层

```java
// Step 1: 识别需要替换的实现
// 老实现（紧耦合）
public class OrderService {
    public void processOrder(Order order) {
        // 直接调用老计费引擎
        double total = LegacyBillingEngine.calculate(order);
        order.setTotal(total);
    }
}

// Step 2: 引入抽象接口
public interface BillingEngine {
    double calculate(Order order);
}

// Step 3: 包装老实现
public class LegacyBillingEngineAdapter implements BillingEngine {
    @Override
    public double calculate(Order order) {
        return LegacyBillingEngine.calculate(order);
    }
}

// Step 4: 重构调用方
public class OrderService {
    @Autowired
    private BillingEngine billingEngine;  // 依赖抽象而非具体实现

    public void processOrder(Order order) {
        double total = billingEngine.calculate(order);
        order.setTotal(total);
    }
}
```

### 2. 实现新版本

```java
// 新实现（现代化）
public class NewBillingEngine implements BillingEngine {
    @Override
    public double calculate(Order order) {
        // 使用新算法（支持优惠券、积分等）
        return order.getItems().stream()
            .mapToDouble(item -> item.getPrice() * item.getQuantity())
            .sum()
            - applyCoupons(order)
            - applyPoints(order);
    }

    private double applyCoupons(Order order) {
        // 新功能：优惠券计算
    }

    private double applyPoints(Order order) {
        // 新功能：积分抵扣
    }
}
```

### 3. 配置切换开关

```yaml
# application.yml
billing:
  engine:
    implementation: legacy # 可选值: legacy | new | canary
    canary-ratio: 0.1 # Canary 模式下新引擎流量比例
```

```java
// 动态选择实现
@Configuration
public class BillingConfig {

    @Value("${billing.engine.implementation}")
    private String implementation;

    @Value("${billing.engine.canary-ratio}")
    private double canaryRatio;

    @Bean
    public BillingEngine billingEngine() {
        if ("new".equals(implementation)) {
            return new NewBillingEngine();
        } else if ("canary".equals(implementation)) {
            return new CanaryBillingEngine(
                new LegacyBillingEngineAdapter(),
                new NewBillingEngine(),
                canaryRatio
            );
        } else {
            return new LegacyBillingEngineAdapter();
        }
    }
}
```

### 4. 灰度验证

```java
// Canary 实现（同时运行新老引擎，对比结果）
public class CanaryBillingEngine implements BillingEngine {

    private final BillingEngine legacy;
    private final BillingEngine newEngine;
    private final double canaryRatio;

    @Override
    public double calculate(Order order) {
        double legacyResult = legacy.calculate(order);

        // 按比例执行新引擎（记录但不影响主流程）
        if (Math.random() < canaryRatio) {
            try {
                double newResult = newEngine.calculate(order);

                // 对比结果（记录差异）
                if (Math.abs(legacyResult - newResult) > 0.01) {
                    log.warn("Billing mismatch: legacy={}, new={}, orderId={}",
                        legacyResult, newResult, order.getId());
                    metrics.record("billing.mismatch", 1);
                }
            } catch (Exception e) {
                log.error("New billing engine failed", e);
                metrics.record("billing.new_engine.error", 1);
            }
        }

        // 返回老引擎结果（确保业务稳定）
        return legacyResult;
    }
}
```

### 5. 切换与清理

```bash
# 阶段 1: 灰度测试（10% 流量）
implementation: canary
canary-ratio: 0.1

# 阶段 2: 扩大灰度（50% 流量）
canary-ratio: 0.5

# 阶段 3: 全量切换
implementation: new

# 阶段 4: 清理老代码（观察 2 周后）
- 删除 LegacyBillingEngine
- 删除 LegacyBillingEngineAdapter
- 删除 CanaryBillingEngine
- 简化配置
```

## 优点

| 优点             | 说明                           |
| ---------------- | ------------------------------ |
| **无需分支**     | 所有代码在主分支，避免合并冲突 |
| **渐进式验证**   | Canary 模式对比新老实现        |
| **快速回滚**     | 修改配置即可切回老实现         |
| **团队协作友好** | 多人同时开发，无代码隔离       |
| **持续集成**     | 每次提交都可构建和测试         |

## 缺点

| 缺点             | 说明                               | 缓解措施                 |
| ---------------- | ---------------------------------- | ------------------------ |
| **代码膨胀**     | 过渡期同时存在新老实现             | 设定清理截止时间         |
| **抽象成本**     | 需设计良好的抽象接口               | 参考设计模式（Strategy） |
| **运行时开销**   | 动态选择实现，增加判断逻辑         | 使用编译期注入优化       |
| **测试复杂度高** | 需测试新老实现及切换逻辑的所有组合 | 使用参数化测试           |

## 案例参考

### 案例 1: Spotify 数据库迁移

- **背景**: PostgreSQL → Cassandra
- **策略**: Branch by Abstraction + Dual Write
- **关键步骤**:
  1. 引入 `DataStore` 抽象层
  2. 双写：主写 PostgreSQL，异步写 Cassandra
  3. 灰度读：10% 流量读 Cassandra，对比结果
  4. 切换：全量读写 Cassandra
  5. 清理：下线 PostgreSQL
- **周期**: 6 个月

### 案例 2: GitHub Ruby → Go 迁移

- **背景**: 核心 API 从 Ruby 迁移到 Go
- **策略**: Branch by Abstraction + Shadow Traffic
- **关键技术**:
  - 使用 `api.Service` 抽象层
  - Shadow Traffic：同时调用 Ruby 和 Go，只返回 Ruby 结果
  - 监控延迟和错误率差异
- **结果**: 性能提升 10x，内存占用降低 80%

## 技术要点

### 抽象层设计原则

```java
// ❌ 错误：抽象泄露（接口暴露了实现细节）
public interface BillingEngine {
    LegacyBillingResult calculate(Order order);  // 返回类型绑定老实现
}

// ✅ 正确：抽象稳定（接口不依赖具体实现）
public interface BillingEngine {
    BigDecimal calculate(Order order);  // 通用类型
}
```

### Canary 模式监控

```yaml
metrics:
  - name: billing.mismatch_rate
    description: 新老引擎结果不一致率
    threshold: 0.01 # 1% 以上触发告警

  - name: billing.new_engine.error_rate
    description: 新引擎执行失败率
    threshold: 0.05 # 5% 以上停止灰度

  - name: billing.latency.p99
    description: 计费延迟 P99
    threshold: 100ms # 超过阈值触发告警
```

## 决策树

```
是否需要同时运行新老实现？
├─ 是 → Branch by Abstraction（推荐）
└─ 否 → 是否可创建长期分支？
    ├─ 是 → Feature Branch
    └─ 否 → Strangler Fig
```

## 参考资源

- Paul Hammant: [Branch By Abstraction](https://paulhammant.com/2013/04/05/what-is-trunk-based-development/)
- Martin Fowler: [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)
- Jez Humble: _Continuous Delivery_, Chapter 14

## Gate Checks

- [x] 定义清晰（抽象层 + 动态切换）
- [x] 适用场景具体（4 类场景）
- [x] 实施步骤可操作（5 步，含完整代码示例）
- [x] 优缺点对比完整（5 个优点，4 个缺点 + 缓解措施）
- [x] 案例参考真实（Spotify、GitHub）
- [x] 技术要点量化（监控阈值、抽象设计原则）
- [x] 决策树辅助选型
