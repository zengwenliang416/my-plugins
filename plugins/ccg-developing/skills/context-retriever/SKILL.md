---
name: context-retriever
description: |
  【触发条件】开发工作流第一步：检索与功能需求相关的代码上下文。
  【核心产出】输出 ${run_dir}/context.md，包含相关文件、依赖、架构模式。
  【不触发】直接分析（用 multi-model-analyzer）、代码生成（用 prototype-generator）。
allowed-tools: Read, Write, Grep, Glob, LSP, mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Context Retriever - 上下文检索原子技能

## 职责边界

- **输入**: `run_dir` + `${run_dir}/input.md` 中的功能需求
- **输出**: `${run_dir}/context.md`
- **单一职责**: 只做上下文检索，不做分析或生成

## 执行流程

### Step 1: 读取输入

```bash
# run_dir 由 orchestrator 传入
FEATURE=$(cat "${run_dir}/input.md")
```

### Step 2: 语义检索

使用 `mcp__auggie-mcp__codebase-retrieval` 进行语义搜索：

```
information_request: "查找与 <功能需求> 相关的代码：
- 相关的类、函数、模块
- 数据模型和接口定义
- 现有的类似实现
- 依赖的外部库"
```

### Step 3: 符号级精准检索

对语义检索结果中的关键符号，使用 LSP 深入分析：

| 场景         | LSP 操作                          |
| ------------ | --------------------------------- |
| 理解文件结构 | `documentSymbol`                  |
| 查看符号定义 | `goToDefinition`                  |
| 找出所有引用 | `findReferences`                  |
| 理解调用关系 | `incomingCalls` / `outgoingCalls` |
| 接口实现定位 | `goToImplementation`              |

### Step 4: 结构化输出

将检索结果写入 `${run_dir}/context.md`：

```markdown
# 上下文检索报告

## 需求概述

[功能需求一句话描述]

## 相关文件

| 文件路径 | 相关度 | 关键符号 | 说明     |
| -------- | ------ | -------- | -------- |
| src/...  | 高     | FooClass | 核心实现 |
| lib/...  | 中     | barFunc  | 依赖函数 |

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

## 返回值

执行完成后，返回：

```
上下文检索完成。
输出文件: .claude/developing/context.md
相关文件: X 个
关键符号: Y 个

下一步: 使用 /developing:multi-model-analyzer 进行分析
```

## 质量门控

- ✅ 识别了 3+ 相关文件
- ✅ 提取了关键符号和接口
- ✅ 分析了依赖关系
- ✅ 评估了潜在影响范围

## 约束

- 不做方案分析（交给 multi-model-analyzer）
- 不生成代码（交给 prototype-generator）
- 检索范围可广，但产出必须聚焦
- 必须使用 LSP 进行符号级精准分析
