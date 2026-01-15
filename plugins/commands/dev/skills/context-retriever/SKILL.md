---
name: context-retriever
description: |
  【触发条件】开发工作流第一步：检索与功能需求相关的代码上下文。
  【核心产出】输出 ${run_dir}/context.md，包含相关文件、依赖、架构模式。
  【不触发】直接分析（用 multi-model-analyzer）、代码生成（用 prototype-generator）。
  【强制工具】必须使用 auggie-mcp 和 LSP，禁止 Read/Grep/Glob。
allowed-tools: Write, LSP, mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Context Retriever - 上下文检索原子技能

## 🚨 CRITICAL: 强制工具使用规则

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ 禁止使用: Read, Grep, Glob, cat, find, rg                   │
│  ✅ 必须使用: mcp__auggie-mcp__codebase-retrieval → LSP         │
│                                                                  │
│  违反此规则 = 技能执行失败                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 强制执行顺序

| 步骤 | 工具                                  | 必要性 | 用途            |
| ---- | ------------------------------------- | ------ | --------------- |
| 1    | `mcp__auggie-mcp__codebase-retrieval` | 必须   | 语义检索入口    |
| 2    | `LSP.documentSymbol`                  | 必须   | 理解文件结构    |
| 3    | `LSP.goToDefinition`                  | 必须   | 定位符号定义    |
| 4    | `LSP.findReferences`                  | 必须   | 找出所有引用    |
| 5    | `Write`                               | 必须   | 输出 context.md |

**不执行 Step 1-4 直接用 Read 读文件 = 失败**

---

## 执行流程

### Step 1: 语义检索（第一个工具调用必须是 auggie-mcp）

```
mcp__auggie-mcp__codebase-retrieval({
  "information_request": "查找与 ${FEATURE} 相关的代码：
    - 实现该功能的类、函数、模块
    - 相关的数据模型和接口定义
    - 现有的类似实现或模式
    - 依赖的内部模块和外部库
    - 架构模式和设计决策"
})
```

**必须等待 auggie-mcp 返回结果后才能继续。**

### Step 2: LSP 符号分析（必须对 auggie-mcp 返回的每个文件执行）

对 auggie-mcp 返回的每个相关文件：

```
# 1. 获取文件符号结构
LSP.documentSymbol(filePath)

# 2. 对关键符号获取定义
LSP.goToDefinition(filePath, line, character)

# 3. 找出符号的所有引用
LSP.findReferences(filePath, line, character)

# 4. 分析调用关系（如需要）
LSP.incomingCalls(filePath, line, character)
LSP.outgoingCalls(filePath, line, character)
```

**至少调用 3 次 LSP 操作，否则视为不完整。**

### Step 3: 结构化输出

将检索结果写入 `${run_dir}/context.md`：

```markdown
# 上下文检索报告

## 检索方法验证

- [x] 使用 mcp**auggie-mcp**codebase-retrieval 语义检索
- [x] 使用 LSP.documentSymbol 分析文件结构
- [x] 使用 LSP.goToDefinition 定位符号
- [x] 使用 LSP.findReferences 查找引用

## 需求概述

[功能需求一句话描述]

## 相关文件（来自 auggie-mcp）

| 文件路径 | 相关度 | 关键符号 | 说明     |
| -------- | ------ | -------- | -------- |
| src/...  | 高     | FooClass | 核心实现 |
| lib/...  | 中     | barFunc  | 依赖函数 |

## 符号分析（来自 LSP）

### 主要类/接口

| 符号名 | 位置             | 引用次数 | 说明     |
| ------ | ---------------- | -------- | -------- |
| Foo    | src/foo.ts:10:1  | 15       | 核心类   |
| IBar   | src/types.ts:5:1 | 8        | 关键接口 |

### 调用关系
```

A.method() → B.helper() → C.process()

```

## 架构模式

- 当前架构: [识别的架构模式]
- 数据流向: [数据如何流动]
- 关键接口: [需要实现/扩展的接口]

## 依赖分析

| 依赖    | 类型     | 用途     |
| ------- | -------- | -------- |
| lodash  | 外部库   | 工具函数 |
| ./utils | 内部模块 | 通用工具 |

## 潜在影响

- 可能影响的模块: [列表]
- 需要修改的文件: [列表]
- 测试覆盖情况: [现有测试]

---

检索时间: [timestamp]
下一步: 调用 multi-model-analyzer 进行分析
```

---

## 质量门控

### 工具使用验证（必须全部满足）

- [ ] 调用了 `mcp__auggie-mcp__codebase-retrieval` 至少 1 次
- [ ] 调用了 `LSP.documentSymbol` 至少 1 次
- [ ] 调用了 `LSP.goToDefinition` 或 `LSP.findReferences` 至少 1 次
- [ ] **没有**使用 Read/Grep/Glob 读取源代码文件

### 产出质量验证

- [ ] 识别了 3+ 相关文件
- [ ] 提取了关键符号和接口
- [ ] 分析了依赖关系
- [ ] 评估了潜在影响范围

---

## 约束

- 不做方案分析（交给 multi-model-analyzer）
- 不生成代码（交给 prototype-generator）
- 检索范围可广，但产出必须聚焦
- **绝对禁止跳过 auggie-mcp 和 LSP 直接读文件**
