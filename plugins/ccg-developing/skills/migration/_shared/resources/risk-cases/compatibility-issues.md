# 兼容性问题案例库

## 案例 1: 依赖库不兼容导致启动失败

### 背景

Spring Boot 2.7 → 3.2 升级后，应用启动失败，报 NoClassDefFoundError。

### 根因

第三方库 `aliyun-sdk-oss:3.10.2` 依赖 `javax.xml.bind:jaxb-api`，但 Spring Boot 3 使用 Jakarta EE，包名已变更。

```
java.lang.NoClassDefFoundError: javax/xml/bind/annotation/XmlElement
  at com.aliyun.oss.model.ResponseHeaderOverrides.<clinit>
```

### 解决方案

```xml
<!-- 方案 A: 升级依赖库 -->
<dependency>
  <groupId>com.aliyun.oss</groupId>
  <artifactId>aliyun-sdk-oss</artifactId>
  <version>3.17.0</version> <!-- 支持 Jakarta EE -->
</dependency>

<!-- 方案 B: 手动添加桥接包（临时） -->
<dependency>
  <groupId>jakarta.xml.bind</groupId>
  <artifactId>jakarta.xml.bind-api</artifactId>
</dependency>
```

### 预防措施

- 使用 `mvn dependency:tree` 检查传递依赖
- 提前检查关键依赖的兼容性（查阅 Release Notes）
- 在隔离环境测试启动

---

## 案例 2: API 签名变更导致线上故障

### 背景

Hibernate 5 → 6 升级后，自定义方言编译失败。

### 根因

Hibernate 6 重构了 Dialect 抽象类，方法签名变更。

```java
// Hibernate 5
public class CustomMySQLDialect extends MySQL57Dialect {
    @Override
    public String getTableTypeString() {
        return " ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    }
}

// Hibernate 6（方法已删除）
// getTableTypeString() 不再存在，需改用 getCreateTableString()
```

### 解决方案

```java
public class CustomMySQLDialect extends MySQLDialect {
    @Override
    public String getCreateTableString() {
        return "CREATE TABLE IF NOT EXISTS";
    }

    @Override
    public String getTableOptions(Table table) {
        return " ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    }
}
```

### 预防措施

- 编译期检查：`mvn clean compile`
- 单元测试覆盖自定义扩展
- 查阅官方 Migration Guide

---

## 案例 3: 协议不兼容导致客户端连接失败

### 背景

MySQL 5.7 → 8.0 升级后，老版本客户端（PHP 5.6）无法连接数据库。

### 根因

MySQL 8.0 默认认证插件从 `mysql_native_password` 改为 `caching_sha2_password`，老客户端不支持。

### 解决方案

```sql
-- 临时方案：修改用户认证插件
ALTER USER 'app_user'@'%'
  IDENTIFIED WITH mysql_native_password BY 'password';

-- 长期方案：升级客户端驱动
-- PHP: 升级到 PHP 7.4+（支持 caching_sha2_password）
-- Node.js: 升级 mysql2 到 2.0+
```

### 预防措施

- 迁移前盘点所有客户端版本
- 测试环境验证客户端连接
- 提前通知相关团队升级客户端

---

## 通用兼容性检查清单

### 依赖检查

- [ ] 运行 `mvn dependency:tree` 检查冲突
- [ ] 检查 SNAPSHOT 依赖（替换为稳定版本）
- [ ] 验证传递依赖的版本兼容性

### 编译检查

- [ ] 完整编译项目（包括测试代码）
- [ ] 检查编译警告（Deprecation, Unchecked）
- [ ] 确认所有自定义扩展仍可编译

### 运行时检查

- [ ] 在隔离环境启动应用
- [ ] 检查日志中的 ClassNotFoundException
- [ ] 验证核心功能可用

### 客户端检查

- [ ] 盘点所有客户端类型和版本
- [ ] 测试客户端连接（JDBC, HTTP Client, SDK）
- [ ] 验证 API 协议兼容性
