# Asset Classification

资产敏感度分类指南，用于风险评估中的资产识别和影响评估。

## 1. 资产分类框架

### 1.1 数据资产分类

| 级别 | 标签 | 描述                     | 示例                     |
| ---- | ---- | ------------------------ | ------------------------ |
| L4   | 绝密 | 泄露将造成不可挽回的损失 | 核心算法源码、加密密钥   |
| L3   | 机密 | 泄露将造成重大业务损失   | 用户密码、财务数据、合同 |
| L2   | 内部 | 仅供内部使用             | 内部文档、配置文件       |
| L1   | 公开 | 可公开访问               | 产品介绍、公开 API       |

### 1.2 系统资产分类

| 级别 | 标签 | 描述                     | 示例                 |
| ---- | ---- | ------------------------ | -------------------- |
| S4   | 关键 | 停机将导致业务完全中断   | 支付网关、核心数据库 |
| S3   | 重要 | 停机将严重影响业务       | 用户认证、订单系统   |
| S2   | 标准 | 停机将造成部分功能不可用 | 报表系统、后台管理   |
| S1   | 辅助 | 停机影响有限             | 内部工具、测试环境   |

## 2. 数据资产详细分类

### 2.1 用户数据

| 数据类型      | 分类级别 | 处理要求                   |
| ------------- | -------- | -------------------------- |
| 密码/凭证     | L4       | 加密存储、传输加密、不可逆 |
| 支付信息      | L4       | PCI-DSS 合规、令牌化       |
| 身份证/护照号 | L4       | 加密存储、最小化收集       |
| 手机号/邮箱   | L3       | 脱敏显示、授权访问         |
| 姓名/昵称     | L2       | 普通保护、合理收集         |
| 公开资料      | L1       | 基本保护                   |

### 2.2 业务数据

| 数据类型 | 分类级别 | 处理要求             |
| -------- | -------- | -------------------- |
| 交易记录 | L4       | 完整性校验、审计日志 |
| 财务报表 | L3       | 授权访问、版本控制   |
| 客户列表 | L3       | 授权访问、防泄露     |
| 产品配置 | L2       | 变更审批、版本控制   |
| 公开价格 | L1       | 基本保护             |

### 2.3 技术数据

| 数据类型 | 分类级别 | 处理要求           |
| -------- | -------- | ------------------ |
| 加密密钥 | L4       | HSM 存储、密钥轮换 |
| API 密钥 | L4       | 加密存储、定期轮换 |
| 源代码   | L3       | 访问控制、代码审计 |
| 配置文件 | L2       | 版本控制、环境隔离 |
| 日志文件 | L2       | 脱敏处理、定期清理 |
| 公开文档 | L1       | 基本保护           |

## 3. 系统资产详细分类

### 3.1 基础设施

| 系统类型   | 分类级别 | SLA 要求      |
| ---------- | -------- | ------------- |
| 生产数据库 | S4       | 99.99% 可用性 |
| 认证服务   | S4       | 99.99% 可用性 |
| 支付网关   | S4       | 99.99% 可用性 |
| 应用服务器 | S3       | 99.9% 可用性  |
| 缓存服务   | S3       | 99.9% 可用性  |
| 消息队列   | S3       | 99.9% 可用性  |
| 日志系统   | S2       | 99% 可用性    |
| 监控系统   | S2       | 99% 可用性    |
| 测试环境   | S1       | 95% 可用性    |

### 3.2 应用服务

| 服务类型     | 分类级别 | 恢复时间目标 (RTO) |
| ------------ | -------- | ------------------ |
| 核心业务 API | S4       | < 5 分钟           |
| 用户认证     | S4       | < 5 分钟           |
| 订单处理     | S3       | < 30 分钟          |
| 搜索服务     | S3       | < 1 小时           |
| 报表服务     | S2       | < 4 小时           |
| 后台管理     | S2       | < 4 小时           |
| 内部工具     | S1       | < 24 小时          |

## 4. 资产识别清单

### 4.1 Web 应用资产

```yaml
data_assets:
  - name: 用户凭证
    type: user_credential
    classification: L4
    storage:
      - PostgreSQL (加密)
      - Redis (会话)
    access_control: 仅认证服务

  - name: 用户个人信息
    type: pii
    classification: L3
    storage: PostgreSQL
    access_control: 授权用户
    compliance: GDPR

  - name: 业务日志
    type: log
    classification: L2
    storage: Elasticsearch
    retention: 90 天

system_assets:
  - name: 生产数据库
    type: database
    classification: S4
    technology: PostgreSQL 15
    backup: 每小时增量，每日全量
    dr_site: 异地热备

  - name: API 网关
    type: gateway
    classification: S3
    technology: Kong
    scaling: 自动扩缩
```

### 4.2 微服务资产

```yaml
services:
  - name: auth-service
    classification: S4
    dependencies: [user-db, redis, secret-manager]
    data_handled: [L4, L3]

  - name: order-service
    classification: S3
    dependencies: [order-db, payment-gateway, notification]
    data_handled: [L3, L2]

  - name: notification-service
    classification: S2
    dependencies: [email-provider, sms-provider]
    data_handled: [L2]
```

## 5. 资产与风险映射

### 5.1 攻击面分析

| 资产     | 暴露程度 | 攻击向量             | 风险因素   |
| -------- | -------- | -------------------- | ---------- |
| 公开 API | 高       | 注入、认证绕过、DDoS | 直接可访问 |
| 用户输入 | 高       | XSS、CSRF、注入      | 不可信来源 |
| 数据库   | 中       | 注入、权限提升       | 间接访问   |
| 内部 API | 低       | SSRF、权限滥用       | 需内部访问 |
| 配置文件 | 低       | 信息泄露             | 需系统访问 |

### 5.2 资产依赖链

```
用户请求
    ↓
[API Gateway] (S3)
    ↓
[Auth Service] (S4)
    ↓
[User Database] (S4, L4)
    ↓
[Order Service] (S3)
    ↓
[Payment Gateway] (S4)
    ↓
[Transaction Log] (L3)
```

**关键链路识别**：

- 单点故障：Auth Service 停机将导致所有服务不可用
- 数据泄露：User Database 泄露影响最大

## 6. 保护措施矩阵

### 6.1 按数据分类

| 分类 | 加密要求      | 访问控制     | 审计日志 | 备份策略   |
| ---- | ------------- | ------------ | -------- | ---------- |
| L4   | AES-256 + TLS | 最小权限+MFA | 全量     | 加密、异地 |
| L3   | AES-256 + TLS | RBAC         | 关键操作 | 加密       |
| L2   | TLS           | 基本认证     | 可选     | 常规       |
| L1   | 可选 TLS      | 公开         | 无       | 常规       |

### 6.2 按系统分类

| 分类 | 冗余要求  | 监控级别   | 变更审批 | 灾备要求 |
| ---- | --------- | ---------- | -------- | -------- |
| S4   | 多活/热备 | 实时告警   | 双人审批 | 异地热备 |
| S3   | 热备      | 分钟级监控 | 审批     | 异地冷备 |
| S2   | 冷备      | 小时级监控 | 通知     | 本地备份 |
| S1   | 无        | 日志记录   | 无       | 按需     |

## 7. 资产清单模板

```yaml
asset_inventory:
  metadata:
    project: "{{project_name}}"
    updated: "{{date}}"
    owner: "{{team}}"

  data_assets:
    - id: DA-001
      name: ""
      classification: L1|L2|L3|L4
      description: ""
      storage_location: ""
      retention_period: ""
      access_control: ""
      encryption: ""
      backup: ""
      compliance: []

  system_assets:
    - id: SA-001
      name: ""
      classification: S1|S2|S3|S4
      description: ""
      technology: ""
      dependencies: []
      data_handled: []
      sla: ""
      rto: ""
      rpo: ""
      backup: ""
      dr_plan: ""

  relationships:
    - from: ""
      to: ""
      type: depends_on|stores|processes
```
