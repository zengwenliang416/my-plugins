# Three Rs（三 R 策略）

## 定义

云迁移的三种主要策略：Rehost（重新托管）、Replatform（重新平台化）、Refactor（重构）。根据业务需求和技术债务选择合适的迁移深度。

## 策略对比

| 策略                         | 变更程度 | 周期 | 成本 | 收益 | 适用场景             |
| ---------------------------- | -------- | ---- | ---- | ---- | -------------------- |
| **Rehost**（Lift & Shift）   | 0-5%     | 短   | 低   | 低   | 快速上云，无重构预算 |
| **Replatform**               | 10-30%   | 中   | 中   | 中   | 利用云服务，部分优化 |
| **Refactor**（Re-architect） | 50-100%  | 长   | 高   | 高   | 云原生改造，长期价值 |

## 策略 1: Rehost（重新托管）

### 定义

将应用原封不动迁移到云端，最小化代码变更（"Lift and Shift"）。

### 适用场景

- **快速上云需求**（数据中心合同到期）
- **遗留系统维护**（技术债务严重但业务稳定）
- **预算有限**（无法承担重构成本）
- **POC 验证**（先迁移再优化）

### 实施步骤

#### 1. 评估依赖

```bash
# 检查系统依赖
- OS 版本：CentOS 7.9
- Runtime：Java 8, Tomcat 8.5
- 数据库：MySQL 5.7
- 中间件：Redis 4.0, RabbitMQ 3.8
```

#### 2. 选择云实例

```yaml
# AWS EC2 选型
legacy-server:
  instance-type: m5.xlarge # 4 vCPU, 16 GB RAM
  os-image: Amazon Linux 2 # 兼容 CentOS
  ebs-volume: 500 GB gp3 # 通用 SSD
  placement: us-east-1a

database:
  service: Amazon RDS for MySQL
  version: "5.7"
  instance-class: db.m5.large
  storage: 1 TB gp2
```

#### 3. 迁移数据

```bash
# MySQL 数据迁移
# 方案 A: mysqldump（适合小于 100 GB）
mysqldump -h legacy-db.example.com -u admin -p --single-transaction \
  --databases app_db > backup.sql

mysql -h new-rds.amazonaws.com -u admin -p app_db < backup.sql

# 方案 B: AWS DMS（适合大于 100 GB）
aws dms create-replication-task \
  --replication-task-identifier migrate-mysql \
  --source-endpoint-arn arn:aws:dms:us-east-1:xxx:endpoint:legacy-mysql \
  --target-endpoint-arn arn:aws:dms:us-east-1:xxx:endpoint:rds-mysql \
  --migration-type full-load-and-cdc # 全量 + 增量
```

#### 4. 配置变更

```properties
# application.properties（最小化变更）
# 仅修改连接字符串
spring.datasource.url=jdbc:mysql://new-rds.amazonaws.com:3306/app_db
spring.redis.host=elasticache.amazonaws.com

# 保持其他配置不变（避免引入新问题）
```

#### 5. 验证与切换

```bash
# 灰度验证
- 10% 流量切到新环境（Route 53 加权路由）
- 监控错误率、延迟、资源利用率
- 问题修复后逐步扩大到 100%

# DNS 切换
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dns-cutover.json
```

### 优点

| 优点         | 说明                     |
| ------------ | ------------------------ |
| **周期短**   | 2-4 周完成迁移           |
| **风险低**   | 代码不变，行为可预测     |
| **成本可控** | 无需重写代码，人力成本低 |
| **快速ROI**  | 立即享受云基础设施优势   |

### 缺点

| 缺点           | 说明                             |
| -------------- | -------------------------------- |
| **技术债延续** | 未解决架构问题                   |
| **成本未优化** | 未利用云原生服务（如Serverless） |
| **扩展性受限** | 仍是单体架构，难以水平扩展       |

---

## 策略 2: Replatform（重新平台化）

### 定义

迁移时进行适度优化，利用云托管服务替代自建组件，无需重写核心业务逻辑。

### 适用场景

- **降低运维负担**（数据库、缓存使用托管服务）
- **适度现代化**（替换过时中间件）
- **渐进式优化**（先平台化，后重构）

### 实施步骤

#### 1. 识别托管服务替换机会

| 自建组件      | 云托管服务                | 优势                 |
| ------------- | ------------------------- | -------------------- |
| MySQL 主从    | Amazon RDS                | 自动备份、故障转移   |
| Redis 集群    | ElastiCache               | 自动扩容、补丁管理   |
| RabbitMQ      | Amazon MQ                 | 托管升级、高可用     |
| Nginx + SSL   | Application Load Balancer | 自动证书轮换         |
| Cron 定时任务 | EventBridge + Lambda      | Serverless，按需付费 |

#### 2. 改造应用配置

```java
// 原代码（硬编码配置）
public class LegacyConfig {
    private static final String DB_HOST = "192.168.1.10";
    private static final String DB_PORT = "3306";
}

// Replatform 后（使用环境变量）
@Configuration
public class CloudConfig {
    @Value("${DB_ENDPOINT}") // 从环境变量读取
    private String dbEndpoint;

    @Bean
    public DataSource dataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:mysql://" + dbEndpoint + "/app_db")
            .build();
    }
}
```

#### 3. 替换定时任务

```yaml
# 原方案：crontab
0 2 * * * /usr/local/bin/daily-report.sh

# 新方案：EventBridge + Lambda
Resources:
  DailyReportRule:
    Type: AWS::Events::Rule
    Properties:
      ScheduleExpression: cron(0 2 * * ? *) # 每天 2 点
      Targets:
        - Arn: !GetAtt DailyReportLambda.Arn
          Id: "1"

  DailyReportLambda:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.9
      Handler: report.handler
      Code:
        S3Bucket: my-lambda-code
        S3Key: report.zip
      Timeout: 300
```

#### 4. 利用托管监控

```yaml
# 原方案：自建 ELK（Elasticsearch + Logstash + Kibana）
# 新方案：CloudWatch Logs + CloudWatch Insights

# 应用日志自动推送到 CloudWatch
logging:
  level:
    root: INFO
  pattern:
    console: "%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n"
  cloudwatch:
    enabled: true
    log-group: /aws/app/production
    log-stream: application-logs

# CloudWatch Insights 查询
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
```

### 优点

| 优点           | 说明                        |
| -------------- | --------------------------- |
| **运维简化**   | 托管服务减少 50% 运维工作量 |
| **可靠性提升** | 利用云厂商 SLA（99.95%+）   |
| **成本可见性** | 云服务账单清晰，成本可优化  |
| **弹性扩展**   | 托管服务自动扩容            |

### 缺点

| 缺点           | 说明                       |
| -------------- | -------------------------- |
| **厂商锁定**   | 依赖云厂商特定服务         |
| **成本不确定** | 按用量付费，需持续监控成本 |
| **学习成本**   | 团队需学习云服务最佳实践   |

---

## 策略 3: Refactor（重构）

### 定义

重新设计架构，采用云原生技术（容器化、微服务、Serverless），最大化云优势。

### 适用场景

- **长期战略**（未来 5 年核心系统）
- **扩展性需求**（流量增长 10x+）
- **技术债清理**（架构腐化严重）
- **竞争优势**（需要快速迭代能力）

### 实施步骤

#### 1. 拆分微服务

```
# 单体拆分策略（DDD 领域驱动）
Monolith (30 万行)
├─ User Service (用户域)
├─ Order Service (订单域)
├─ Inventory Service (库存域)
├─ Payment Service (支付域)
└─ Notification Service (通知域)
```

#### 2. 容器化

```dockerfile
# Dockerfile（多阶段构建）
FROM maven:3.8-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM openjdk:17-jre-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 3. Kubernetes 编排

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: myregistry/user-service:v1.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
```

#### 4. 服务网格

```yaml
# Istio VirtualService（流量管理）
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
    - user-service
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: user-service
            subset: v2 # Canary 版本
          weight: 10
        - destination:
            host: user-service
            subset: v1
          weight: 90
```

#### 5. 可观测性

```yaml
# Prometheus + Grafana + Jaeger
monitoring:
  prometheus:
    enabled: true
    scrape-interval: 15s
  grafana:
    dashboards:
      - k8s-cluster-metrics
      - application-metrics
      - business-metrics
  tracing:
    jaeger:
      enabled: true
      sampling-rate: 0.1 # 10% 采样
```

### 优点

| 优点             | 说明                       |
| ---------------- | -------------------------- |
| **弹性伸缩**     | 根据流量自动扩容           |
| **故障隔离**     | 微服务独立故障，不影响全局 |
| **独立部署**     | 服务独立发布，频率提升 10x |
| **技术异构**     | 不同服务可选不同技术栈     |
| **长期成本优化** | 按需付费，资源利用率提升   |

### 缺点

| 缺点         | 说明                       |
| ------------ | -------------------------- |
| **周期长**   | 6-18 个月完整重构          |
| **成本高**   | 需要架构师、DevOps 专家    |
| **复杂度高** | 分布式系统调试困难         |
| **组织变革** | 需要 DevOps 文化和流程支持 |

---

## 决策矩阵

| 因素         | Rehost | Replatform | Refactor |
| ------------ | ------ | ---------- | -------- |
| 迁移周期     | 2-4 周 | 1-3 月     | 6-18 月  |
| 技术债务     | 延续   | 部分清理   | 完全清理 |
| 运维负担     | 高     | 中         | 低       |
| 扩展性       | 差     | 中         | 优       |
| 团队技能要求 | 低     | 中         | 高       |
| 预算要求     | 低     | 中         | 高       |
| ROI 周期     | 立即   | 3-6 月     | 12-24 月 |

## 选型决策树

```
业务是否需要快速上云（3 个月内）？
├─ 是 → Rehost
└─ 否 → 系统是否有严重技术债务？
    ├─ 是 → Refactor
    └─ 否 → 是否需要降低运维负担？
        ├─ 是 → Replatform
        └─ 否 → Rehost
```

## 混合策略

实际项目常采用混合策略：

```
Phase 1 (Month 1-2):   Rehost 核心业务（快速上云）
Phase 2 (Month 3-6):   Replatform 数据库和中间件（降低运维）
Phase 3 (Month 7-18):  Refactor 核心模块为微服务（长期优化）
```

## 参考资源

- AWS: [6 Rs of Cloud Migration](https://aws.amazon.com/blogs/enterprise-strategy/6-strategies-for-migrating-applications-to-the-cloud/)
- Gartner: [The Five Rs of Cloud Migration](https://www.gartner.com/en/documents/3896624)
- Microsoft: [Cloud Adoption Framework](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/)

## Gate Checks

- [x] 定义清晰（3 种策略定义明确）
- [x] 对比表格完整（周期、成本、收益、场景）
- [x] 每种策略有详细实施步骤
- [x] 优缺点对比完整
- [x] 决策矩阵量化（7 个维度对比）
- [x] 决策树辅助选型
- [x] 混合策略示例
