# Refactoring Patterns Reference

代码重构模式和实施指南。

---

## 1. 原型重构流程

### 1.1 重构步骤

```
1. 验证原型 diff 可应用
2. 理解原型意图
3. 评估代码质量
4. 执行重构
5. 验证重构结果
```

### 1.2 重构原则

| 原则 | 说明 |
|------|------|
| 保持功能等价 | 重构不改变外部行为 |
| 小步前进 | 每次只做一个重构 |
| 持续验证 | 每步后运行测试 |
| 代码所有权 | Claude 负责最终质量 |

---

## 2. 常见重构模式

### 2.1 提取函数

**Before:**
```typescript
function processOrder(order: Order) {
  // 验证订单
  if (!order.items.length) throw new Error('Empty order');
  if (order.total < 0) throw new Error('Invalid total');

  // 计算折扣
  let discount = 0;
  if (order.total > 100) discount = order.total * 0.1;
  if (order.total > 500) discount = order.total * 0.2;

  // 处理支付
  // ...
}
```

**After:**
```typescript
function processOrder(order: Order) {
  validateOrder(order);
  const discount = calculateDiscount(order.total);
  processPayment(order, discount);
}

function validateOrder(order: Order): void {
  if (!order.items.length) throw new Error('Empty order');
  if (order.total < 0) throw new Error('Invalid total');
}

function calculateDiscount(total: number): number {
  if (total > 500) return total * 0.2;
  if (total > 100) return total * 0.1;
  return 0;
}
```

### 2.2 替换条件为多态

**Before:**
```typescript
function getArea(shape: Shape): number {
  switch (shape.type) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
  }
}
```

**After:**
```typescript
interface Shape {
  getArea(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  getArea(): number {
    return this.width * this.height;
  }
}
```

### 2.3 引入参数对象

**Before:**
```typescript
function createUser(
  name: string,
  email: string,
  age: number,
  role: string,
  department: string
) {
  // ...
}
```

**After:**
```typescript
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  role: string;
  department: string;
}

function createUser(params: CreateUserParams) {
  const { name, email, age, role, department } = params;
  // ...
}
```

### 2.4 用组合替换继承

**Before:**
```typescript
class Employee {
  calculatePay() { /* ... */ }
}

class Manager extends Employee {
  calculatePay() {
    return super.calculatePay() + this.bonus;
  }
}
```

**After:**
```typescript
interface PayCalculator {
  calculate(base: number): number;
}

class StandardPay implements PayCalculator {
  calculate(base: number): number {
    return base;
  }
}

class ManagerPay implements PayCalculator {
  constructor(private bonus: number) {}
  calculate(base: number): number {
    return base + this.bonus;
  }
}

class Employee {
  constructor(private payCalculator: PayCalculator) {}
  calculatePay() {
    return this.payCalculator.calculate(this.baseSalary);
  }
}
```

---

## 3. 代码质量检查

### 3.1 检查清单

| 类别 | 检查项 |
|------|--------|
| 命名 | 变量/函数名是否清晰 |
| 函数 | 函数是否过长（>20行） |
| 参数 | 参数是否过多（>3个） |
| 重复 | 是否有重复代码 |
| 复杂度 | 嵌套是否过深（>3层） |
| 类型 | 类型是否完整 |
| 错误处理 | 是否有适当的错误处理 |

### 3.2 代码异味

| 异味 | 描述 | 重构方法 |
|------|------|----------|
| 长函数 | >20 行 | 提取函数 |
| 长参数列表 | >3 个参数 | 引入参数对象 |
| 重复代码 | 相似代码块 | 提取公共函数 |
| 过大的类 | 职责过多 | 拆分类 |
| 特性依恋 | 频繁访问其他类 | 移动方法 |
| 数据泥团 | 多个参数总是一起出现 | 引入对象 |
| switch 语句 | 多个 switch 相同 | 多态替换 |

---

## 4. 变更记录格式

### 4.1 changes.md 结构

```markdown
---
implemented_at: 2026-01-17T12:00:00Z
model: codex | gemini
prototype: prototype-codex.diff
---

# 代码实施报告

## 变更摘要

**任务**: [任务描述]
**文件数**: [数量]
**变更行数**: +[新增]/-[删除]

## 变更详情

### 1. [文件路径]

**变更类型**: 新增 | 修改 | 删除

**变更内容**:
- [变更项 1]
- [变更项 2]

**重构说明**:
[如果对原型进行了重构，说明原因]

\`\`\`typescript
// 关键代码片段
\`\`\`

### 2. [文件路径]

...

## 重构记录

| 原型代码 | 重构后 | 原因 |
|----------|--------|------|
| [原始实现] | [重构实现] | [原因说明] |

## 验证结果

- [ ] 类型检查通过
- [ ] 测试通过
- [ ] 代码规范检查通过

## 注意事项

[需要后续关注的问题]
```

---

## 5. LSP 辅助重构

### 5.1 重命名

```typescript
// 使用 LSP findReferences 找到所有引用
// 确保重命名安全
LSP.findReferences(file, line, character)
```

### 5.2 提取接口

```typescript
// 使用 LSP documentSymbol 分析类结构
// 识别可提取的公共接口
LSP.documentSymbol(file)
```

### 5.3 移动函数

```typescript
// 使用 LSP incomingCalls/outgoingCalls 分析依赖
// 确定移动后的影响范围
LSP.incomingCalls(file, line, character)
```

---

## 6. 实施策略

### 6.1 小步重构

```
1. 确认测试通过
2. 执行一个小重构
3. 运行测试
4. 如果测试失败，回滚
5. 如果测试通过，提交
6. 重复直到完成
```

### 6.2 大重构拆分

```
大重构 → 多个小重构

例如：重构整个模块
1. 提取接口
2. 重命名变量
3. 拆分大函数
4. 引入设计模式
5. 清理死代码
```

---

## 7. 验证方法

### 7.1 类型检查

```bash
# TypeScript
npx tsc --noEmit

# 只检查变更文件
npx tsc --noEmit src/changed-file.ts
```

### 7.2 测试运行

```bash
# 运行相关测试
npm test -- --findRelatedTests src/changed-file.ts

# 运行所有测试
npm test
```

### 7.3 Lint 检查

```bash
# ESLint
npx eslint src/changed-file.ts

# 自动修复
npx eslint --fix src/changed-file.ts
```
