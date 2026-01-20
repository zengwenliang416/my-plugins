# Legacy System Modernization Best Practices

## 核心模式：Strangler Fig Pattern（绞杀者模式）

由 Martin Fowler 提出，是现代化遗留系统的**首选策略**。

### 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway / Proxy                     │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │   New Service   │◄────────────►│  Legacy System  │       │
│  │   (Modern)      │   渐进迁移    │   (To Replace)  │       │
│  └─────────────────┘              └─────────────────┘       │
│         ▲                                  ▲                 │
│         │ 新流量                           │ 旧流量          │
│         └──────────────┬───────────────────┘                │
│                        │                                     │
│                    Client                                    │
└─────────────────────────────────────────────────────────────┘
```

### 实施步骤

| 步骤          | 描述                                         | 风险等级 |
| ------------- | -------------------------------------------- | -------- |
| 1. 引入路由层 | 在遗留系统前部署 API Gateway / Reverse Proxy | 低       |
| 2. 识别边界   | 找出可独立替换的"接缝"（seams）              | 低       |
| 3. 逐步替换   | 从低风险、高价值模块开始                     | 中       |
| 4. 流量迁移   | 渐进式将流量从旧系统路由到新服务             | 中       |
| 5. 最终淘汰   | 直到旧组件完全无流量后下线                   | 低       |

### 适用条件

**✅ 适合使用 Strangler Fig 的情况：**

- 大型单体应用，无法一次性重写
- 业务持续运营，不能停机
- 需要渐进式风险控制
- 团队需要时间学习新技术

**❌ 不适合使用的情况：**

- 高度耦合的单体，无法隔离功能边界
- 缺乏可观测性，无法安全路由流量
- 无法引入代理层（安全/合规限制）
- 小型简单系统，"大爆炸"重写更快

---

## 前端遗留系统迁移

### 技术栈演进路径

```
jQuery → AngularJS → Angular/React/Vue → Modern Framework
         (EOL 2021)
```

### 迁移策略对比

| 策略                     | 适用场景        | 优点               | 缺点                 |
| ------------------------ | --------------- | ------------------ | -------------------- |
| **增量迁移 (ngUpgrade)** | 大型 AngularJS  | 风险低，可回滚     | 双框架运行时开销     |
| **Micro-Frontend**       | 多团队/复杂应用 | 独立部署，技术自由 | 架构复杂，初期成本高 |
| **完全重写**             | 小型或结构混乱  | 干净架构           | 成本高、风险大       |
| **Module Federation**    | Webpack 5+ 项目 | 渐进替换，热更新   | 配置复杂             |

### 前端遗留代码气味

| 气味             | 描述                  | 现代化方案               |
| ---------------- | --------------------- | ------------------------ |
| jQuery Spaghetti | DOM 操作散落各处      | 组件化重构               |
| Global State     | window.xxx 全局变量   | 状态管理（Redux/Vuex）   |
| Callback Hell    | 多层嵌套回调          | Promise/async-await      |
| Inline Styles    | style 属性混乱        | CSS Modules/Tailwind     |
| Script Tag Soup  | 多个 script 依赖顺序  | 模块打包（Webpack/Vite） |
| $scope Pollution | AngularJS $scope 滥用 | 组件化 + 单向数据流      |

### 迁移工具

| 工具                    | 用途                         |
| ----------------------- | ---------------------------- |
| ngMigration Assistant   | AngularJS → Angular 迁移分析 |
| Jscodeshift             | AST 级代码转换               |
| ESLint + Prettier       | 代码规范统一                 |
| Webpack Bundle Analyzer | 依赖分析                     |

---

## 后端遗留系统迁移

### 技术栈演进路径

```
COBOL/Mainframe → Java EE → Spring → Spring Boot → Cloud Native
                  ↘ .NET Framework → .NET Core → .NET 8+
```

### 迁移策略对比

| 策略                      | 适用场景       | 风险 | 成本   |
| ------------------------- | -------------- | ---- | ------ |
| **Rehost (Lift & Shift)** | 快速上云       | 低   | 低     |
| **Replatform**            | 优化基础设施   | 中   | 中     |
| **Refactor**              | 代码级重构     | 中   | 中-高  |
| **Rearchitect**           | 微服务化       | 高   | 高     |
| **Rebuild**               | 完全重写       | 极高 | 极高   |
| **Replace**               | 换用 SaaS/COTS | 中   | 变化大 |

### 后端遗留代码气味

| 气味                   | 描述             | 现代化方案               |
| ---------------------- | ---------------- | ------------------------ |
| Monolithic Ball of Mud | 无边界的巨型单体 | DDD 领域分解             |
| Shared Database        | 多服务共享数据库 | Database per Service     |
| Synchronous Everything | 全同步调用       | 事件驱动/消息队列        |
| No API Versioning      | API 无版本管理   | API Gateway + 版本控制   |
| Hardcoded Config       | 配置写死在代码里 | 配置中心（Consul/Nacos） |
| Session State          | 有状态服务       | 无状态 + 外部存储        |
| COBOL Copybooks        | 数据结构复用     | Java/C# DTO 类           |

### COBOL → Java 转换映射

| COBOL 概念             | Java 等价物            |
| ---------------------- | ---------------------- |
| Copybooks              | Package/DTO Classes    |
| ABEND Errors           | Exceptions             |
| Paragraphs             | Methods                |
| CICS Transactions      | REST/gRPC Services     |
| Pointers/Redefinitions | Utility Libraries      |
| JCL Jobs               | Spring Batch/Scheduler |

---

## 数据迁移策略

### 双写模式（Dual-Write）

```
┌─────────────┐     Write      ┌─────────────┐
│   New App   │───────────────►│   New DB    │
└─────────────┘                └─────────────┘
       │                              ▲
       │ Write                        │ Sync
       ▼                              │
┌─────────────┐                ┌─────────────┐
│  Legacy DB  │◄───────────────│   CDC Tool  │
└─────────────┘     Capture    └─────────────┘
```

### CDC（Change Data Capture）工具

| 工具       | 支持数据库                                     |
| ---------- | ---------------------------------------------- |
| Debezium   | MySQL, PostgreSQL, MongoDB, SQL Server, Oracle |
| AWS DMS    | 主流数据库                                     |
| GoldenGate | Oracle 生态                                    |
| Maxwell    | MySQL                                          |

---

## 关键监控指标

| 指标         | 描述                     | 目标            |
| ------------ | ------------------------ | --------------- |
| 流量迁移比例 | 已路由到新服务的请求占比 | 逐步增长到 100% |
| 遗留代码行数 | 旧代码库大小变化         | 持续下降        |
| 部署频率     | 新系统发布速度           | 显著提升        |
| MTTR         | 故障恢复时间             | 降低            |
| 错误率       | 新旧系统错误对比         | 新系统 ≤ 旧系统 |

---

## 风险评估矩阵

| 风险等级    | 条件                           | 建议策略                |
| ----------- | ------------------------------ | ----------------------- |
| 🟢 Low      | 独立模块，测试覆盖好，团队熟悉 | 自动执行                |
| 🟡 Medium   | 有依赖但可隔离，部分测试       | 交互确认                |
| 🔶 High     | 核心业务，多依赖，测试不足     | 分步执行 + 灰度         |
| 🔴 Critical | 数据库 schema 变更，跨系统     | 详细方案评审 + 回滚预案 |

---

## 参考资源

- [Martin Fowler - Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [AWS - Modernization Strategy](https://aws.amazon.com/modernization/)
- [Microsoft - Modernize existing .NET applications](https://docs.microsoft.com/en-us/dotnet/architecture/modernize-with-azure-containers/)
- [Google Cloud - Migrating monolithic applications to microservices](https://cloud.google.com/architecture/microservices-architecture-refactoring-monoliths)
