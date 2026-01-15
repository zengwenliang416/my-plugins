# Java 项目迁移快速开始

> 针对老旧 Java 项目（Spring 4/5, Hibernate, Maven/Gradle）的迁移指南

---

## 一分钟了解

### 迁移功能域能做什么？

1. ✅ **自动扫描老旧 Java 项目**（识别 Spring、Hibernate、Maven/Gradle）
2. ✅ **生成完整 CLAUDE.md 文档**（根级 + 模块级，支持后续迭代迁移）
3. ✅ **深度分析代码质量**（God Classes、SQL 注入、资源泄漏、线程安全）
4. ✅ **智能迁移建议**（Spring 4 → Spring Boot 3、Java 8 → 17）
5. ✅ **安全审计**（OWASP Top 10 检查）

### 典型使用场景

```bash
# 场景：有一个老旧的 Java ERP 系统，想迁移到 Spring Boot
/migration:init "分析 Legacy ERP 系统迁移方案"

# 15 分钟后得到：
# ✓ 项目根/CLAUDE.md（架构文档）
# ✓ 各模块/CLAUDE.md（模块文档）
# ✓ .claude/migration/README.md（迁移分析）
# ✓ backend-analysis.md（Codex 深度分析）
# ✓ tech-debt.md（技术债报告）
# ✓ security-report.md（安全审计）
# ✓ migration-recommendations.md（分阶段迁移建议）
```

---

## 支持的 Java 技术栈

| 组件            | 支持版本                | 识别方式              |
| --------------- | ----------------------- | --------------------- |
| **Java**        | 6, 7, 8, 11, 17         | pom.xml, build.gradle |
| **Spring**      | 3.x, 4.x, 5.x           | spring-webmvc         |
| **Spring Boot** | 1.x, 2.x, 3.x           | spring-boot-starter   |
| **Hibernate**   | 4.x, 5.x, 6.x           | hibernate-core        |
| **MyBatis**     | 3.x                     | mybatis               |
| **Maven**       | 2.x, 3.x                | pom.xml               |
| **Gradle**      | 4.x, 5.x, 6.x, 7.x, 8.x | build.gradle          |
| **Ant**         | 1.x（老旧）             | build.xml             |

---

## 典型输出示例

### 技术栈识别结果

```json
{
  "language": "Java",
  "version": "8",
  "buildTool": "Maven",
  "frameworks": {
    "backend": [
      {
        "name": "Spring Framework",
        "version": "4.3.25",
        "eol": "2020-12-31",
        "status": "end-of-life"
      }
    ]
  },
  "packaging": "WAR",
  "appServer": "Tomcat 8.5"
}
```

### 后端分析报告

```markdown
## 严重问题（立即修复）

**P0-001: God Class - UserService**

- 文件: `com.example.erp.service.UserService:1547`
- 问题: 单个类 1547 行
- 修复: 拆分为 UserAuthenticationService + UserProfileService + UserPermissionService

**P0-002: SQL 注入风险**

- 文件: `com.example.erp.dao.UserDao:89`
- 代码: `String sql = "SELECT * FROM users WHERE name = '" + username + "'";`
- 修复: 使用 PreparedStatement

**P0-003: 资源泄漏**

- 文件: `com.example.erp.util.FileUploadUtil:45`
- 修复: 使用 try-with-resources
```

### 迁移路径建议

```markdown
## 推荐路径: Spring 4 → Spring Boot 3

### 阶段一：安全修复（1 周）

- 修复 5 个 SQL 注入漏洞
- 外部化 34 处硬编码配置

### 阶段二：代码重构（1 个月）

- 拆分 3 个 God Classes
- 修复 12 处资源泄漏

### 阶段三：框架升级（2-3 个月）

- Spring 4.3 → Spring Boot 2.7（过渡版本）
- 统一配置方式（全注解）

### 阶段四：版本升级（2-3 个月）

- Spring Boot 2.7 → 3.2
- Java 8 → Java 17
- javax._ → jakarta._

## 风险评估

| 风险            | 影响 | 概率 | 缓解措施     |
| --------------- | ---- | ---- | ------------ |
| javax → jakarta | 高   | 高   | 分阶段迁移   |
| 业务逻辑回归    | 高   | 中   | 增加单元测试 |
```

---

## Java 特定检测项

### 代码质量

| 检测项         | 阈值    | 工具       |
| -------------- | ------- | ---------- |
| God Classes    | >500 行 | PMD        |
| 长方法         | >50 行  | Checkstyle |
| 深度继承       | >4 层   | SpotBugs   |
| 圈复杂度       | >10     | SonarQube  |
| 单元测试覆盖率 | <80%    | JaCoCo     |

### Spring 配置

| 检测项        | 问题特征             | 建议                  |
| ------------- | -------------------- | --------------------- |
| XML vs 注解   | XML 配置 >1000 行    | 迁移到 @Configuration |
| Bean 循环依赖 | A → B → A            | 重构依赖关系          |
| 事务边界      | Service 方法 >200 行 | 拆分细粒度事务        |

### 数据访问层

| 检测项   | 问题特征          | 修复方案           |
| -------- | ----------------- | ------------------ |
| SQL 注入 | String 拼接查询   | PreparedStatement  |
| N+1 查询 | 循环内查询        | JOIN FETCH         |
| 连接泄漏 | Connection 未关闭 | try-with-resources |
| 二级缓存 | 未启用            | 配置 EhCache       |

### 线程安全

| 检测项            | 问题特征             | 修复方案          |
| ----------------- | -------------------- | ----------------- |
| SimpleDateFormat  | 成员变量             | DateTimeFormatter |
| 非线程安全集合    | 多线程共享 ArrayList | ConcurrentHashMap |
| synchronized 滥用 | 粗粒度锁             | 细粒度锁或 Lock   |

### 安全审计

| 检测项     | CVSS 严重度 | 工具                   |
| ---------- | ----------- | ---------------------- |
| SQL 注入   | 9.8（高危） | SpotBugs Security      |
| XSS        | 7.5（高危） | OWASP Dependency Check |
| 硬编码密码 | 7.5（高危） | SonarQube              |
| XXE        | 8.8（高危） | Snyk                   |
| 反序列化   | 9.8（高危） | SpotBugs               |

---

## 生成的 CLAUDE.md 示例

### 项目根级（root/CLAUDE.md）

```markdown
# Legacy ERP System

> Java 8 + Spring 4.3 + Hibernate 5.2

## 架构风格

单体三层 MVC，WAR 部署到 Tomcat 8.5

## 模块结构

- controller/ - Spring MVC 控制器（45 类）
- service/ - 业务逻辑层（67 类）
- dao/ - 数据访问层（34 类）
- model/ - Hibernate 实体（56 类）

## 技术债

1. God Class: UserService (1547 行)
2. SQL 注入: 5 处
3. 单元测试覆盖率: <10%

## 迁移建议

短期（1-3 月）: 安全修复
中期（3-6 月）: Spring Boot 2.7
长期（6-12 月）: 微服务拆分
```

### 模块级（controller/CLAUDE.md）

```markdown
# Controller 层

> Spring MVC 控制器，45 个类

## 关键控制器

- UserController.java - 用户管理（234 行）
- OrderController.java - 订单管理（345 行）

## 配置方式

- 80% 注解（@Controller, @RequestMapping）
- 20% XML（spring-mvc.xml）

## 已知问题

1. 过度继承: BaseController → AbstractController → UserController (4 层)
2. 异常处理: 缺少统一 @ExceptionHandler

## 测试覆盖

- 单元测试: 12/45 (27%)
- 集成测试: 3/45 (7%)
```

---

## 为什么需要 CLAUDE.md？

### 问题：迁移是长期工程

```
第一次迁移（2026-01）: Spring 4 → Spring Boot 2.7
第二次迁移（2026-06）: Java 8 → Java 11
第三次迁移（2027-01）: Spring Boot 2.7 → 3.2
                        Java 11 → Java 17
```

**每次迁移都需要理解原项目**，但半年后团队成员可能已经变化，代码也在持续演进。

### 解决方案：永久架构文档

- **CLAUDE.md**（项目根 + 模块）= 长期架构参考
- **每次迁移都能读懂原项目**
- **新成员快速上手**

---

## 多模型协作优势

### Codex（后端专家）

- **优势**: 只读沙箱、复杂链路分析、深度理解业务逻辑
- **负责**:
  - Java 代码质量分析
  - Spring 配置分析
  - Hibernate N+1 查询检测
  - 依赖关系图生成
  - 技术债扫描
  - 安全审计

### Gemini（前端专家）

- **优势**: 快速原型、设计趋势敏感、UI 组件分析
- **负责**:
  - JSP/Thymeleaf 前端分析
  - JavaScript/jQuery 代码分析
  - CSS 样式检查

### Claude（编排者）

- **职责**:
  - 协调 Codex + Gemini
  - 重构外部模型输出（去冗余、统一格式）
  - 最终质量把关
  - 生成 CLAUDE.md

---

## 使用流程

### 1. 触发迁移分析

```bash
cd /path/to/legacy-java-project
/migration:init "分析项目迁移方案"
```

### 2. 选择分析深度

```
[A] 完整分析（推荐）- 15-20 分钟
    ✓ CLAUDE.md（根 + 模块）
    ✓ Codex + Gemini 深度分析
    ✓ 技术债 + 安全审计

[B] 快速分析 - 3-5 分钟
    ✓ 仅技术栈识别

[C] 自定义
```

### 3. 等待分析完成

```
Phase 1: 项目扫描 ✓
Phase 2: 生成 CLAUDE.md ✓
Phase 3: 深度分析（Codex + Gemini） ⏳
  ├─ 后端分析 (Codex) ⏳
  ├─ 前端分析 (Gemini) ⏳
  └─ 依赖分析 (Codex) ⏳
```

### 4. 查看结果

```bash
# 查看迁移概览
cat .claude/migration/README.md

# 查看后端分析
cat .claude/migration/analysis/backend-analysis.md

# 查看迁移建议
cat .claude/migration/analysis/migration-recommendations.md

# 查看项目架构
cat CLAUDE.md
```

---

## 常见问题

### Q1: 我的项目用 Gradle，支持吗？

✅ **支持**。能识别 `build.gradle` 和 `settings.gradle`。

### Q2: 我的项目是 Spring 3.x，支持吗？

✅ **支持**。能识别 Spring 3.x-5.x。

### Q3: 分析会修改我的代码吗？

❌ **不会**。只读分析，不修改代码。

### Q4: 需要运行项目吗？

❌ **不需要**。静态分析，不需要运行。

### Q5: 多久重新分析一次？

建议：

- **每次大版本迁移前**（Spring 4 → Boot 3）
- **每 6 个月**（跟踪技术债变化）
- **新成员加入时**（CLAUDE.md 快速上手）

### Q6: CLAUDE.md 会过期吗？

会。建议：

- **代码重大重构后重新生成**
- **迁移完成后更新**
- **保留历史版本**（git 管理）

---

## 下一步

1. ✅ 已完成设计（支持 Java）
2. ⏳ 实施 12 个 Skills
3. ⏳ 实施 migration-init-orchestrator
4. ⏳ 填充资源库（迁移模式、技术映射）
5. ⏳ 端到端测试

---

## 相关文档

- **完整设计**: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- **Java 支持细节**: [JAVA_SUPPORT_DESIGN.md](./JAVA_SUPPORT_DESIGN.md)
- **开发流程**: [QUICK_REFERENCE.md](../../ui-ux/_shared/docs/QUICK_REFERENCE.md)
