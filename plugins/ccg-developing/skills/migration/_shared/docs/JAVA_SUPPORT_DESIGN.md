# Java 项目迁移支持设计

## 技术栈识别（tech-stack-detector）

### Java 项目特征检测

```yaml
检测文件:
  - pom.xml # Maven 项目
  - build.gradle # Gradle 项目
  - build.xml # Ant 项目（老旧）
  - ivy.xml # Ivy 依赖管理
  - settings.gradle # Gradle 多模块
  - gradlew/gradlew.bat # Gradle Wrapper

Java 版本检测:
  - pom.xml: <maven.compiler.source>
  - build.gradle: sourceCompatibility
  - .java 文件: 语法特征（lambda → Java 8+, records → Java 14+）

框架识别:
  - Spring Framework: spring-*.jar, @Component/@Service
  - Spring Boot: spring-boot-starter-*, @SpringBootApplication
  - Hibernate: hibernate-core, @Entity
  - Struts: struts.xml, struts-core.jar
  - JSF: faces-config.xml, javax.faces
  - JavaEE/JakartaEE: javax.*/jakarta.* imports
```

### 输出示例（tech-stack.json）

```json
{
  "language": "Java",
  "version": "8",
  "buildTool": "Maven",
  "buildFiles": ["pom.xml"],
  "frameworks": {
    "backend": [
      {
        "name": "Spring Framework",
        "version": "4.3.25",
        "eol": "2020-12-31",
        "status": "end-of-life"
      },
      {
        "name": "Hibernate",
        "version": "5.2.17",
        "modules": ["hibernate-core", "hibernate-validator"]
      }
    ],
    "web": [
      {
        "name": "Spring MVC",
        "version": "4.3.25"
      }
    ],
    "database": [
      {
        "driver": "MySQL Connector/J",
        "version": "5.1.47"
      }
    ]
  },
  "architecture": "Monolithic MVC",
  "packaging": "WAR",
  "appServer": "Tomcat 8.5"
}
```

## 后端分析（backend-analyzer）

### Java 特定分析维度

```yaml
代码结构分析:
  - 包结构设计: 是否分层（controller/service/dao）
  - 类职责划分: God Classes 检测（>1000 行）
  - 继承深度: 过深继承链（>4 层）
  - 接口使用: 是否过度抽象

Spring 配置分析:
  - XML vs 注解配置: applicationContext.xml vs @Configuration
  - Bean 管理方式: XML <bean> vs @Component
  - 事务管理: <tx:advice> vs @Transactional
  - AOP 配置: XML vs @Aspect

数据访问层分析:
  - ORM 框架: Hibernate/MyBatis/JPA
  - SQL 注入风险: String concatenation 查询
  - N+1 查询问题: Lazy loading 未优化
  - 连接池配置: HikariCP/C3P0/DBCP

技术债务识别:
  - 硬编码配置: IP/密码硬编码
  - 异常吞噬: 空 catch 块
  - 资源泄漏: 未关闭的 Connection/Stream
  - 线程不安全: SimpleDateFormat 在成员变量
```

### 输出示例（backend-analysis.md）

```markdown
## 架构概览

- **架构风格**: 传统三层 MVC 单体架构
- **包结构**: com.example.{controller, service, dao, model, util}
- **Spring 配置**: 混合模式（80% XML + 20% 注解）

## 代码质量评估

### 优势

- 分层清晰，职责分明
- Service 层有事务管理
- 使用 Hibernate 作为 ORM

### 问题

**严重问题**:

1. **God Class**: `UserService.java` (1547 行) - 需拆分
2. **SQL 注入**: `UserDao.java:89` - 字符串拼接查询
3. **资源泄漏**: `FileUploadUtil.java:45` - InputStream 未关闭

**中等问题**:

1. **线程不安全**: `DateUtil.java:12` - SimpleDateFormat 成员变量
2. **过度继承**: BaseController → AbstractController → UserController (4 层)
3. **硬编码**: `application-context.xml` - 数据库密码明文

## 技术栈迁移建议

### 迁移路径: Spring 4 → Spring Boot 3

**阶段一**: Spring Boot 适配层

- 保留现有 XML 配置
- 添加 @SpringBootApplication 入口
- 引入 spring-boot-starter-web

**阶段二**: 配置迁移

- XML Bean 转换为 @Configuration
- properties 文件迁移到 application.yml
- 外部化配置（数据库连接）

**阶段三**: 依赖升级

- Spring 4.3 → 6.1
- Hibernate 5.2 → 6.4
- Java 8 → Java 17

**风险点**:

- javax._ → jakarta._ 命名空间变更
- Hibernate HQL 语法变更
- Servlet 4.0 → 6.0 API 变化
```

## CLAUDE.md 生成（claude-doc-generator）

### Java 项目根级文档模板

```markdown
# 项目架构文档

> 自动生成于 2026-01-13 | 项目类型: Java Spring MVC

## 项目概览

**项目名称**: Legacy ERP System
**技术栈**: Java 8 + Spring 4.3 + Hibernate 5.2 + MySQL 5.7
**架构风格**: 单体三层 MVC
**构建工具**: Maven 3.6
**打包方式**: WAR (部署到 Tomcat 8.5)

## 模块结构
```

项目根/
├── src/main/java/com/example/erp/
│ ├── controller/ # Spring MVC 控制器
│ ├── service/ # 业务逻辑层
│ ├── dao/ # 数据访问层
│ ├── model/ # 实体类 (Hibernate)
│ └── util/ # 工具类
├── src/main/resources/
│ ├── spring/ # Spring XML 配置
│ ├── mybatis/ # MyBatis Mapper
│ └── application.properties
└── src/main/webapp/
├── WEB-INF/
│ └── views/ # JSP 视图
└── static/ # 静态资源

```

## 架构决策

### 数据访问层
- **ORM 框架**: Hibernate 5.2
- **二级缓存**: EhCache
- **事务管理**: Spring 声明式事务 (@Transactional)

### Web 层
- **视图技术**: JSP + JSTL
- **前端框架**: jQuery 1.12 + Bootstrap 3
- **表单验证**: Hibernate Validator

### 配置管理
- **Spring 配置**: XML 为主 (applicationContext.xml)
- **Bean 作用域**: 主要使用 Singleton
- **属性注入**: 构造器注入 + Setter 注入

## 关键流程

### 用户登录流程
```

LoginController.login()
→ AuthService.authenticate()
→ UserDao.findByUsername()
→ Hibernate Session

```

### 订单创建流程
```

OrderController.create()
→ OrderService.createOrder() [@Transactional]
→ OrderDao.save()
→ InventoryService.deductStock()
→ NotificationService.sendEmail()

```

## 已知技术债

1. **配置混乱**: XML 和注解混用，无统一规范
2. **God Classes**: UserService (1547 行)、OrderService (1203 行)
3. **SQL 注入风险**: 部分 DAO 使用字符串拼接
4. **资源泄漏**: IO 流未正确关闭
5. **线程不安全**: SimpleDateFormat 共享实例

## 依赖清单

### 核心依赖
- spring-webmvc: 4.3.25.RELEASE
- hibernate-core: 5.2.17.Final
- mysql-connector-java: 5.1.47

### 构建插件
- maven-compiler-plugin: 3.8.1 (target: 1.8)
- maven-war-plugin: 3.2.3

## 迁移建议

### 短期改进（1-3 个月）
1. 外部化配置（数据库密码）
2. 修复 SQL 注入漏洞
3. 添加单元测试（当前覆盖率 <10%）

### 中期重构（3-6 个月）
1. 拆分 God Classes
2. 统一配置方式（全面转向注解）
3. 引入 Spring Boot 适配层

### 长期规划（6-12 个月）
1. 微服务拆分（订单模块、库存模块、用户模块）
2. 前后端分离（替换 JSP 为 RESTful API）
3. 容器化部署（Docker + Kubernetes）
```

## 依赖关系图（dependency-mapper）

### Java 特定依赖分析

```yaml
分析维度:
  - Maven 依赖树: mvn dependency:tree
  - 包间引用: 通过 import 语句分析
  - Spring Bean 依赖: XML <ref> + @Autowired
  - 循环依赖检测: A → B → A

输出格式:
  - Mermaid 图: 可视化模块依赖
  - JSON 图: 供工具分析
  - 关键路径: 识别核心模块
```

### 输出示例（dependency-graph.json）

```json
{
  "modules": [
    {
      "name": "controller",
      "type": "presentation",
      "files": 45,
      "dependencies": ["service", "model"]
    },
    {
      "name": "service",
      "type": "business",
      "files": 67,
      "dependencies": ["dao", "model", "util"]
    },
    {
      "name": "dao",
      "type": "persistence",
      "files": 34,
      "dependencies": ["model"]
    }
  ],
  "externalDependencies": {
    "spring-webmvc": {
      "version": "4.3.25",
      "usedIn": ["controller"],
      "transitive": ["spring-core", "spring-beans"]
    },
    "hibernate-core": {
      "version": "5.2.17",
      "usedIn": ["dao", "service"],
      "transitive": ["javax.persistence-api"]
    }
  },
  "circularDependencies": [
    {
      "path": "UserService → OrderService → UserService",
      "location": ["UserService.java:89", "OrderService.java:234"]
    }
  ]
}
```

## 技术债扫描（tech-debt-scanner）

### Java 特定代码异味

```yaml
检测规则:
  - God Classes: >500 行或 >20 方法
  - 长方法: >50 行
  - 深度继承: >4 层
  - 空 catch: catch (Exception e) {}
  - Magic Numbers: 硬编码数字（非常量）
  - SimpleDateFormat 滥用: 成员变量
  - String.format SQL: 拼接查询
  - 未关闭资源: Connection/ResultSet/Stream

工具集成:
  - SonarQube: 静态分析
  - PMD: 代码规范检查
  - SpotBugs: Bug 检测
  - Checkstyle: 代码风格
```

### 输出示例（tech-debt.md）

```markdown
## 技术债务报告

### 严重问题（立即修复）

**TD-001: SQL 注入风险**

- 文件: `UserDao.java:89`
- 代码: `String sql = "SELECT * FROM users WHERE name = '" + username + "'";`
- 修复: 使用 PreparedStatement 或 NamedParameterJdbcTemplate

**TD-002: 资源泄漏**

- 文件: `FileUploadUtil.java:45`
- 代码: `InputStream is = file.getInputStream();` (未关闭)
- 修复: 使用 try-with-resources

### 中等问题（计划重构）

**TD-003: God Class**

- 文件: `UserService.java` (1547 行)
- 建议拆分:
  - UserAuthenticationService (登录/注册)
  - UserProfileService (资料管理)
  - UserPermissionService (权限管理)

**TD-004: 线程不安全**

- 文件: `DateUtil.java:12`
- 代码: `private SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");`
- 修复: 使用 ThreadLocal 或 Java 8 DateTimeFormatter

### 低优先级（技术改进）

**TD-005: 过时 API**

- Java 8 Date API (应使用 java.time.\*)
- Apache Commons Collections 3.x (升级到 4.x)
- Log4j 1.x (迁移到 Log4j 2 或 Logback)
```

## 安全审计（security-auditor）

### Java 特定安全检查

```yaml
检查项:
  - SQL 注入: String 拼接查询
  - XSS 漏洞: 未转义的用户输入
  - CSRF 防护: 是否启用 Spring Security CSRF
  - 敏感信息泄露: 密码/密钥硬编码
  - XML 外部实体注入: XXE 风险
  - 反序列化漏洞: ObjectInputStream 使用
  - 路径遍历: File 路径拼接
  - 弱加密算法: MD5/DES 使用

工具:
  - OWASP Dependency Check
  - Snyk
  - SpotBugs Security
```

## 迁移路径推荐

### 典型 Java 迁移场景

```yaml
场景一: Spring 4 → Spring Boot 3
  难度: 中等
  周期: 2-3 个月
  关键步骤:
    - 添加 Spring Boot Starter
    - 迁移 XML 配置到 @Configuration
    - javax.* → jakarta.* 命名空间
    - Servlet 容器内嵌化

场景二: Java 8 → Java 17
  难度: 简单-中等
  周期: 1-2 个月
  关键步骤:
    - 移除已废弃 API (Applet, CORBA)
    - 更新第三方依赖版本
    - 重新编译并测试
    - 利用新特性 (Records, Pattern Matching)

场景三: 单体 → 微服务
  难度: 高
  周期: 6-12 个月
  关键步骤:
    - 识别有界上下文
    - 数据库拆分策略
    - API Gateway 引入
    - 分布式事务处理 (Saga/2PC)
```

## 资源库支持

### Java 迁移模式库

```yaml
resources:
  - pattern: "Strangler Fig for Spring"
    description: 逐步用 Spring Boot 替换 Spring MVC
    example: |
      # 共存策略
      1. 保留旧的 applicationContext.xml
      2. 新建 @SpringBootApplication 入口
      3. 通过 @ImportResource 引入旧配置
      4. 逐个 Bean 迁移到 @Configuration

  - pattern: "Dual Write for Database Migration"
    description: MySQL → PostgreSQL 数据迁移
    example: |
      1. 应用层双写（旧库 + 新库）
      2. 后台数据同步验证
      3. 切换读流量到新库
      4. 下线旧库写入
```

## 总结

Java 项目迁移支持设计已覆盖：

1. ✅ **技术栈识别**: Maven/Gradle、Spring/Hibernate 版本检测
2. ✅ **代码分析**: God Classes、线程安全、SQL 注入
3. ✅ **文档生成**: 适配 Java 项目结构的 CLAUDE.md
4. ✅ **依赖分析**: Maven 依赖树、循环依赖检测
5. ✅ **安全审计**: OWASP Top 10 检查
6. ✅ **迁移路径**: Spring Boot、Java 17、微服务

所有 Skills 均已适配 Java 生态工具链（Maven、SonarQube、SpotBugs）。
