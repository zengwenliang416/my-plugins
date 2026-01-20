# Refactoring Patterns Catalog - 重构模式目录

## 代码级重构

### 1. Extract Method（提取方法）

**适用场景**:

- 方法体过长
- 代码片段在多处重复
- 需要添加注释解释代码意图

**操作步骤**:

1. 识别可提取的代码片段
2. 确定新方法的名称（描述代码意图）
3. 创建新方法，复制代码
4. 识别局部变量和参数
5. 替换原代码为方法调用
6. 编译测试

**示例**:

```typescript
// Before
function printOwing() {
  printBanner();

  // print details
  console.log("name: " + name);
  console.log("amount: " + getOutstanding());
}

// After
function printOwing() {
  printBanner();
  printDetails();
}

function printDetails() {
  console.log("name: " + name);
  console.log("amount: " + getOutstanding());
}
```

**风险等级**: 🟢 Low

---

### 2. Extract Class（提取类）

**适用场景**:

- 类承担过多职责
- 类中存在独立的数据和行为子集
- 子类之间共享部分功能

**操作步骤**:

1. 决定如何分割职责
2. 创建新类表示分割的职责
3. 建立旧类到新类的连接
4. 使用 Move Field 移动字段
5. 使用 Move Method 移动方法
6. 检查并简化接口

**示例**:

```typescript
// Before
class Person {
  name: string;
  officeAreaCode: string;
  officeNumber: string;

  getTelephoneNumber() {
    return `(${this.officeAreaCode}) ${this.officeNumber}`;
  }
}

// After
class Person {
  name: string;
  officeTelephone: TelephoneNumber;

  getTelephoneNumber() {
    return this.officeTelephone.getTelephoneNumber();
  }
}

class TelephoneNumber {
  areaCode: string;
  number: string;

  getTelephoneNumber() {
    return `(${this.areaCode}) ${this.number}`;
  }
}
```

**风险等级**: 🟡 Medium

---

### 3. Move Method（移动方法）

**适用场景**:

- 方法与另一个类的交互多于本类
- 方法是另一个类特性的羡慕者

**操作步骤**:

1. 检查源方法使用的所有特性
2. 检查是否有子类或超类也声明了该方法
3. 在目标类中声明该方法
4. 复制代码并调整
5. 决定如何从源对象引用目标对象
6. 将源方法变成委托方法
7. 决定是否删除源方法

**风险等级**: 🟡 Medium

---

### 4. Introduce Parameter Object（引入参数对象）

**适用场景**:

- 一组参数总是一起出现
- 多个方法使用相同的参数组

**操作步骤**:

1. 检查现有参数是否已有合适的结构
2. 创建新类表示参数组
3. 为新类添加原参数作为字段
4. 对每个使用这些参数的方法，添加新参数
5. 逐个删除原参数
6. 查找适合移入新类的行为

**示例**:

```typescript
// Before
function amountInvoiced(startDate: Date, endDate: Date) {}
function amountReceived(startDate: Date, endDate: Date) {}
function amountOverdue(startDate: Date, endDate: Date) {}

// After
class DateRange {
  constructor(
    public start: Date,
    public end: Date,
  ) {}
}

function amountInvoiced(dateRange: DateRange) {}
function amountReceived(dateRange: DateRange) {}
function amountOverdue(dateRange: DateRange) {}
```

**风险等级**: 🟢 Low

---

### 5. Replace Conditional with Polymorphism（以多态取代条件表达式）

**适用场景**:

- 同样的条件判断在多处重复
- 根据类型码执行不同行为

**操作步骤**:

1. 确保条件表达式在某个方法内
2. 在超类中定义抽象方法
3. 在每个子类中覆写该方法
4. 将条件分支移到对应子类
5. 删除条件表达式

**示例**:

```typescript
// Before
class Bird {
  getSpeed() {
    switch (this.type) {
      case "EUROPEAN":
        return this.getBaseSpeed();
      case "AFRICAN":
        return this.getBaseSpeed() - this.getLoadFactor();
      case "NORWEGIAN_BLUE":
        return this.isNailed ? 0 : this.getBaseSpeed();
    }
  }
}

// After
abstract class Bird {
  abstract getSpeed(): number;
}

class European extends Bird {
  getSpeed() {
    return this.getBaseSpeed();
  }
}

class African extends Bird {
  getSpeed() {
    return this.getBaseSpeed() - this.getLoadFactor();
  }
}

class NorwegianBlue extends Bird {
  getSpeed() {
    return this.isNailed ? 0 : this.getBaseSpeed();
  }
}
```

**风险等级**: 🔶 High

---

### 6. Encapsulate Field（封装字段）

**适用场景**:

- 存在公共字段
- 需要对字段访问添加逻辑

**操作步骤**:

1. 为字段创建 getter/setter
2. 查找所有直接访问该字段的地方
3. 替换为调用 getter/setter
4. 将字段设为私有

**风险等级**: 🟢 Low

---

## 遗留系统迁移模式

### 前端迁移模式

| 遗留气味         | 迁移策略                                          | 目标技术栈        | 复杂度 |
| ---------------- | ------------------------------------------------- | ----------------- | ------ |
| jQuery Spaghetti | Incremental Component Migration + Adapter Pattern | React/Vue/Angular | High   |
| Global State     | Module Pattern → State Management Migration       | Redux/Vuex/Pinia  | Medium |
| $scope Pollution | ngUpgrade + Component Migration                   | Angular 17+       | High   |
| Callback Hell    | Promise/Async-Await Modernization                 | ES2017+           | Low    |
| Script Tag Soup  | Module Bundler Introduction                       | Webpack/Vite      | Medium |

### 后端迁移模式

| 遗留气味         | 迁移策略                              | 目标模式          | 复杂度   |
| ---------------- | ------------------------------------- | ----------------- | -------- |
| Monolithic Ball  | Strangler Fig + Domain Decomposition  | Microservices/DDD | Critical |
| Shared Database  | Database per Service + Event Sourcing | Service Isolation | High     |
| Hardcoded Config | Configuration Externalization         | Config Center     | Low      |
| Session State    | Stateless + External State Store      | Redis/JWT         | Medium   |
| Raw SQL          | ORM/Query Builder Migration           | TypeORM/Prisma    | Medium   |

---

## Strangler Fig Pattern 实施步骤

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway / Proxy                     │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │   New Service   │◄────────────►│  Legacy System  │       │
│  │   (Modern)      │   渐进迁移    │   (To Replace)  │       │
│  └─────────────────┘              └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**阶段 1: 引入路由层**

- 部署 API Gateway
- 100% 流量路由到遗留系统

**阶段 2: 识别迁移边界**

- 使用 auggie-mcp 识别模块边界
- 评估每个模块的依赖关系

**阶段 3: 逐步替换**

- 从低风险模块开始
- 渐进式迁移流量

**阶段 4: 淘汰旧组件**

- 监控旧组件流量
- 流量归零后下线

---

## 重构优先级矩阵

| 优先级  | 条件               | 建议       |
| ------- | ------------------ | ---------- |
| 🔴 立即 | 安全漏洞、生产 bug | 优先修复   |
| 🔶 高   | 阻碍新功能开发     | 本迭代处理 |
| 🟡 中   | 降低可维护性       | 下迭代处理 |
| 🟢 低   | 代码美化           | 机会性修复 |

---

## 参考资源

- Martin Fowler - Refactoring: Improving the Design of Existing Code
- https://refactoring.guru/refactoring/techniques
- https://martinfowler.com/bliki/StranglerFigApplication.html
