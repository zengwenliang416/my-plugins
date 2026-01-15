---
name: software-architecture
description: |
  【触发条件】当用户需要设计软件架构、实现 Clean Architecture、应用 SOLID 原则和设计模式时使用。
  【核心产出】输出：架构设计图、模块划分方案、设计模式实现、代码结构建议。
  【不触发】不用于：DevOps 配置（改用 devops-config）、数据库设计（改用 db-migration-helper）。
  【先问什么】若缺少：项目规模、技术栈、核心业务领域，先提问补齐。
allowed-tools: Read, Write, Edit, Glob, Grep, mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__serena__find_referencing_symbols
---

# Software Architecture - 软件架构设计助手

## 功能概述

帮助设计和实现高质量的软件架构，包括 Clean Architecture、SOLID 原则、常用设计模式和领域驱动设计。

## 可执行脚本

本 Skill 包含以下可执行脚本（位于 `scripts/` 目录）：

| 脚本                      | 用途                   | 执行方式                                      |
| ------------------------- | ---------------------- | --------------------------------------------- |
| `analyze-dependencies.sh` | 分析项目依赖和安全审计 | `bash scripts/analyze-dependencies.sh [目录]` |
| `module-structure.sh`     | 分析模块结构和架构模式 | `bash scripts/module-structure.sh [目录]`     |

## SOLID 原则

### S - 单一职责原则 (SRP)

```
一个类只应该有一个引起变化的原因
```

```python
# ❌ 违反 SRP
class User:
    def save_to_db(self): ...
    def send_email(self): ...
    def generate_report(self): ...

# ✅ 遵循 SRP
class User: ...
class UserRepository:
    def save(self, user): ...
class EmailService:
    def send(self, user, message): ...
class UserReportGenerator:
    def generate(self, user): ...
```

### O - 开闭原则 (OCP)

```
对扩展开放，对修改关闭
```

```python
# ✅ 通过抽象实现扩展
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    @abstractmethod
    def process(self, amount: float) -> bool: ...

class CreditCardProcessor(PaymentProcessor):
    def process(self, amount: float) -> bool: ...

class WeChatPayProcessor(PaymentProcessor):
    def process(self, amount: float) -> bool: ...
```

### L - 里氏替换原则 (LSP)

```
子类必须能替换其父类
```

### I - 接口隔离原则 (ISP)

```
客户端不应依赖它不需要的接口
```

```python
# ❌ 违反 ISP
class Worker(ABC):
    @abstractmethod
    def work(self): ...
    @abstractmethod
    def eat(self): ...  # 机器人不需要吃饭

# ✅ 遵循 ISP
class Workable(ABC):
    @abstractmethod
    def work(self): ...

class Eatable(ABC):
    @abstractmethod
    def eat(self): ...

class Human(Workable, Eatable): ...
class Robot(Workable): ...
```

### D - 依赖倒置原则 (DIP)

```
高层模块不应依赖低层模块，两者都应依赖抽象
```

```python
# ❌ 违反 DIP
class OrderService:
    def __init__(self):
        self.db = MySQLDatabase()  # 直接依赖具体实现

# ✅ 遵循 DIP
class OrderService:
    def __init__(self, db: Database):  # 依赖抽象
        self.db = db
```

## Clean Architecture

### 分层结构

```
┌─────────────────────────────────────────────┐
│              Frameworks & Drivers           │  外层：Web、DB、UI
├─────────────────────────────────────────────┤
│           Interface Adapters                │  适配器：Controllers、Presenters
├─────────────────────────────────────────────┤
│            Application Business             │  用例：Application Services
├─────────────────────────────────────────────┤
│          Enterprise Business Rules          │  核心：Entities、Domain
└─────────────────────────────────────────────┘
```

### 依赖规则

- 依赖只能从外向内
- 内层不知道外层的存在
- 数据跨边界时使用 DTO

### 目录结构示例

```
src/
├── domain/           # 领域层
│   ├── entities/
│   ├── value_objects/
│   └── repositories/  # 接口定义
├── application/      # 应用层
│   ├── use_cases/
│   ├── services/
│   └── dto/
├── infrastructure/   # 基础设施层
│   ├── persistence/
│   ├── external/
│   └── config/
└── presentation/     # 表现层
    ├── api/
    └── cli/
```

## 常用设计模式

### 创建型模式

| 模式      | 用途         | 场景                 |
| --------- | ------------ | -------------------- |
| Factory   | 创建对象     | 根据条件创建不同实例 |
| Builder   | 构建复杂对象 | 多步骤构建           |
| Singleton | 单一实例     | 配置、连接池         |

### 结构型模式

| 模式      | 用途         | 场景               |
| --------- | ------------ | ------------------ |
| Adapter   | 接口转换     | 兼容不同接口       |
| Decorator | 动态添加功能 | 不修改原类增强功能 |
| Facade    | 简化接口     | 统一复杂子系统     |

### 行为型模式

| 模式     | 用途     | 场景           |
| -------- | -------- | -------------- |
| Strategy | 算法封装 | 可切换的算法族 |
| Observer | 事件通知 | 发布-订阅      |
| Command  | 封装请求 | 撤销、队列     |

## 领域驱动设计 (DDD)

### 核心概念

| 概念                | 说明               |
| ------------------- | ------------------ |
| Entity              | 有唯一标识的对象   |
| Value Object        | 无标识的不可变对象 |
| Aggregate           | 实体和值对象的集合 |
| Repository          | 聚合的持久化抽象   |
| Domain Service      | 无状态的领域操作   |
| Application Service | 用例编排           |

### 聚合设计原则

1. 聚合根是唯一入口
2. 聚合内保持一致性
3. 聚合间通过 ID 引用
4. 小聚合优于大聚合

## 架构决策记录 (ADR)

```markdown
# ADR-001: 选择 PostgreSQL 作为主数据库

## 状态

已采纳

## 上下文

需要选择关系型数据库...

## 决策

选择 PostgreSQL

## 后果

- 正面: JSONB 支持、扩展性好
- 负面: 运维复杂度略高
```

## 参考文档

- `patterns-catalog.md` - 设计模式详解
- `clean-architecture-template.md` - 项目模板
