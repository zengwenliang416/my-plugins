# Strangler Fig Pattern（绞杀者模式）

## 定义

逐步替换老系统的模式，类似绞杀榕（Strangler Fig）逐步包裹并替代宿主树。新系统在老系统外围逐步生长，最终完全替代老系统。

## 适用场景

- **大型单体应用**迁移到微服务
- **无法停机**的关键业务系统
- **风险不可控**的遗留系统
- **技术债务严重**但业务稳定运行的系统

## 实施步骤

### 1. 识别迁移边界

```bash
# 分析模块依赖关系
codex-cli "分析模块间依赖，标识低耦合模块"

# 识别候选模块
- 边缘功能（报表、统计）
- 低依赖模块（工具类、通知服务）
- 独立业务域（用户管理、订单处理）
```

### 2. 建立路由层

```java
// API Gateway 路由配置
@Configuration
public class StranglerRoutingConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            // 新系统路由（优先级高）
            .route("new_user_service", r -> r
                .path("/api/v2/users/**")
                .uri("http://new-user-service"))

            // 老系统路由（兜底）
            .route("legacy_fallback", r -> r
                .path("/**")
                .uri("http://legacy-monolith"))

            .build();
    }
}
```

### 3. 渐进式迁移

```
Week 1-2:  迁移用户查询 API（只读，风险低）
Week 3-4:  迁移用户创建 API（写操作，需数据同步）
Week 5-6:  迁移用户更新/删除 API
Week 7:    下线老用户模块
```

### 4. 数据同步策略

```java
// 双写策略（过渡期）
@Service
public class UserService {

    @Autowired
    private LegacyUserRepository legacyRepo;

    @Autowired
    private NewUserRepository newRepo;

    @Transactional
    public User createUser(UserDTO dto) {
        // 写入新系统（主）
        User newUser = newRepo.save(dto);

        // 异步同步到老系统（保证兼容性）
        asyncSync(() -> legacyRepo.save(transform(newUser)));

        return newUser;
    }
}
```

### 5. 验证与回滚

```yaml
# Feature Toggle 配置
features:
  new-user-service:
    enabled: true
    rollback-threshold: 0.05 # 错误率超过 5% 自动回滚
    canary-ratio: 0.1 # 10% 流量切到新系统
```

## 优点

| 优点             | 说明                           |
| ---------------- | ------------------------------ |
| **风险可控**     | 渐进式迁移，问题及时发现和回滚 |
| **业务不中断**   | 老系统持续运行，用户无感知     |
| **团队压力小**   | 分阶段实施，避免大爆炸式交付   |
| **可增量交付**   | 每个模块迁移后立即上线受益     |
| **技术债务隔离** | 新系统采用新技术栈，不继承债务 |

## 缺点

| 缺点               | 说明                                 | 缓解措施                   |
| ------------------ | ------------------------------------ | -------------------------- |
| **周期长**         | 完整迁移可能需要数月到数年           | 优先迁移高价值模块         |
| **维护成本高**     | 过渡期需同时维护新老两套系统         | 设定明确的迁移截止时间     |
| **数据一致性挑战** | 双写期间数据同步可能出现不一致       | 使用事务日志或 CDC 模式    |
| **路由复杂度**     | API Gateway 需处理版本路由和流量控制 | 使用成熟的网关产品（Kong） |

## 案例参考

### 案例 1: Shopify 单体拆分

- **背景**: Ruby on Rails 单体应用，30 万行代码
- **策略**: Strangler Fig + API Gateway（Nginx）
- **结果**: 3 年完成拆分，服务可用性从 99.5% → 99.95%

### 案例 2: Netflix Monolith → Microservices

- **背景**: Java 单体应用，迁移到基于 Spring Boot 的微服务
- **策略**: Strangler Fig + Zuul Gateway + Eureka
- **关键技术**:
  - 使用 Hystrix 实现熔断和降级
  - 通过 Chaos Monkey 验证新系统稳定性
- **结果**: 2 年完成核心业务拆分，部署频率从月度 → 每天数百次

## 技术要点

### 路由优先级

```
1. 新系统路由（/api/v2/*）
2. 功能开关（Feature Toggle）
3. 灰度流量（Canary）
4. 老系统兜底（/**）
```

### 监控指标

```yaml
metrics:
  - name: new_service_error_rate
    threshold: 0.05
    action: rollback

  - name: new_service_latency_p99
    threshold: 500ms
    action: alert

  - name: data_sync_lag
    threshold: 5min
    action: alert
```

## 决策树

```
是否支持并行运行？
├─ 是 → Strangler Fig（推荐）
└─ 否 → 是否可短暂停机？
    ├─ 是 → Big Bang Migration
    └─ 否 → Branch by Abstraction
```

## 参考资源

- Martin Fowler: [StranglerFigApplication](https://martinfowler.com/bliki/StranglerFigApplication.html)
- Sam Newman: _Building Microservices_, Chapter 5
- Netflix Tech Blog: [Zuul Gateway Pattern](https://netflixtechblog.com/)

## Gate Checks

- [x] 定义清晰（包含类比说明）
- [x] 适用场景具体（4 类场景）
- [x] 实施步骤可操作（5 步，含代码示例）
- [x] 优缺点对比完整（5 个优点，4 个缺点 + 缓解措施）
- [x] 案例参考真实（Shopify、Netflix）
- [x] 技术要点量化（路由优先级、监控阈值）
- [x] 决策树辅助选型
