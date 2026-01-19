---
name: context-retriever
description: |
  【触发条件】开发工作流第一步：检索与功能需求相关的上下文。
  【核心产出】输出 ${run_dir}/context.md，包含内部代码 + 外部文档。
  【不触发】直接分析（用 multi-model-analyzer）、代码生成（用 prototype-generator）。
  【先问什么】需求描述模糊时，询问具体需要检索什么上下文
  【强制工具】内部代码用 auggie-mcp + LSP，外部文档用 exa skill。
allowed-tools:
  - Write
  - Skill
  - LSP
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__sequential-thinking__sequentialthinking
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
│  📦 内部代码检索（现有代码库）                                    │
│     ✅ 必须使用: auggie-mcp → LSP                                │
│     ❌ 禁止使用: Read, Grep, Glob                                │
│                                                                  │
│  🌐 外部文档检索（涉及新技术/新项目时 必须执行）                   │
│     ✅ 必须使用: Skill("exa") 调用 exa skill                     │
│     ❌ 禁止使用: 直接 WebSearch/WebFetch                          │
│     ❌ 禁止使用: 直接 Bash 调用 exa 脚本                          │
│                                                                  │
│  ⚠️  新项目/空代码库 → 必须调用 exa skill 获取外部文档！          │
│      不能因为"没有内部代码"就跳过外部文档检索！                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP 工具集成

| MCP 工具              | 用途                                 | 触发条件        |
| --------------------- | ------------------------------------ | --------------- |
| `sequential-thinking` | 结构化检索策略，确保覆盖所有相关代码 | 🚨 每次执行必用 |
| `auggie-mcp`          | 语义检索（首选）                     | 🚨 必须首先使用 |

## 执行流程

### Step 0: 结构化检索规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划检索策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划上下文检索策略。需要：1) 分析需求关键词 2) 确定检索范围 3) 选择检索方法 4) 规划符号分析 5) 规划证据收集",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **需求关键词提取**：从功能需求提取搜索关键词
2. **检索范围确定**：内部代码 vs 外部文档
3. **检索方法选择**：auggie-mcp → LSP → exa
4. **符号分析规划**：需要深入分析的关键符号
5. **证据收集策略**：如何组织和记录发现

### Step 1: 判断检索类型

根据功能需求判断需要哪种检索：

| 场景              | 检索类型    | 工具             |
| ----------------- | ----------- | ---------------- |
| 修改/扩展现有功能 | 内部代码    | auggie-mcp + LSP |
| 使用新技术/框架   | 外部文档    | exa skill        |
| 两者结合（常见）  | 内部 + 外部 | 全部工具         |
| 新项目/空代码库   | 仅外部文档  | exa skill        |

### Step 2A: 内部代码检索（有代码库时必须执行）

**2A.1 语义检索**

```
mcp__auggie-mcp__codebase-retrieval({
  "information_request": "查找与 ${FEATURE} 相关的代码：
    - 实现该功能的类、函数、模块
    - 相关的数据模型和接口定义
    - 现有的类似实现或模式
    - 依赖的内部模块和外部库"
})
```

**2A.2 LSP 符号分析（🚨 强制执行）**

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨🚨🚨 LSP 调用是强制的，不是可选的！🚨🚨🚨                      │
│                                                                  │
│  auggie-mcp 返回结果后，必须立即对每个相关文件调用 LSP：         │
│                                                                  │
│  1. LSP.documentSymbol(filePath)     - 获取文件结构             │
│  2. LSP.goToDefinition(symbol)       - 跳转到定义               │
│  3. LSP.findReferences(symbol)       - 查找所有引用             │
│  4. LSP.hover(symbol)                - 获取类型信息             │
│                                                                  │
│  最少 5 次 LSP 调用，否则此 Skill 执行失败！                     │
└─────────────────────────────────────────────────────────────────┘
```

**立即执行 LSP 调用序列：**

```
# 1. 对每个相关文件，先获取结构
LSP(operation="documentSymbol", filePath="<file>", line=1, character=1)

# 2. 对关键符号，获取定义
LSP(operation="goToDefinition", filePath="<file>", line=<line>, character=<char>)

# 3. 对要修改的符号，查找所有引用
LSP(operation="findReferences", filePath="<file>", line=<line>, character=<char>)

# 4. 获取类型信息
LSP(operation="hover", filePath="<file>", line=<line>, character=<char>)
```

**验证**：context.md 必须包含 LSP 分析结果表格

### Step 2B: 外部文档检索（🚨 涉及新技术/新项目时必须执行）

**必须通过 Skill 工具调用 exa skill：**

调用 Skill 工具，skill 名称为 `exa`，参数为：

```
search "${技术关键词} tutorial documentation 2024 2025" --content --limit 5
```

**必须执行的 3 次搜索：**

1. **官方文档搜索**：
   调用 Skill 工具，skill 名称为 `exa`，参数为：

   ```
   search "${技术关键词} official documentation tutorial" --content --limit 5
   ```

2. **代码示例搜索**：
   调用 Skill 工具，skill 名称为 `exa`，参数为：

   ```
   search "${技术关键词} example code implementation" --content --category github --limit 5
   ```

3. **最佳实践搜索**：
   调用 Skill 工具，skill 名称为 `exa`，参数为：
   ```
   search "${技术关键词} best practices production" --content --limit 3
   ```

**典型搜索示例（macOS 语音识别）：**

```
Skill("exa", "search 'SFSpeechRecognizer macOS Swift tutorial 2024' --content --limit 5")
Skill("exa", "search 'Speech framework macOS example github' --content --category github --limit 5")
Skill("exa", "search 'macOS speech recognition best practices' --content --limit 3")
```

> **注意**：需要设置 `EXA_API_KEY` 环境变量

**🚨 强制验证**：如果是新项目或涉及新技术，必须调用 exa skill 至少 2 次，否则此 Skill 执行失败！

### Step 3: 结构化输出

将检索结果写入 `${run_dir}/context.md`：

```markdown
# 上下文检索报告

## 检索方法验证

### 内部代码检索

- [x] auggie-mcp 语义检索
- [x] LSP.documentSymbol 分析
- [x] LSP.goToDefinition 定位
- [x] LSP.findReferences 引用

### 外部文档检索

- [x] exa search 官方文档
- [x] exa search 代码示例
- [x] exa search 最佳实践

## 需求概述

[功能需求一句话描述]

## 内部代码（来自 auggie-mcp + LSP）

### 相关文件

| 文件路径 | 相关度 | 关键符号 | 说明     |
| -------- | ------ | -------- | -------- |
| src/...  | 高     | FooClass | 核心实现 |

### 符号分析

| 符号名 | 位置            | 引用次数 | 说明   |
| ------ | --------------- | -------- | ------ |
| Foo    | src/foo.ts:10:1 | 15       | 核心类 |

## 外部文档（来自 exa）

### 官方文档

| 来源            | 标题               | URL         | 关键内容摘要     |
| --------------- | ------------------ | ----------- | ---------------- |
| Apple Developer | SFSpeechRecognizer | https://... | 语音识别核心 API |

### 代码示例

| 来源   | 标题        | URL         | 关键代码片段 |
| ------ | ----------- | ----------- | ------------ |
| GitHub | speech-demo | https://... | 完整实现示例 |

### 最佳实践

- [实践1]: 描述 "来源: URL"
- [实践2]: 描述 "来源: URL"

## 架构模式

- 当前架构: [识别的架构模式]
- 推荐模式: [来自外部文档的建议]

## 依赖分析

| 依赖             | 类型     | 来源   | 用途     |
| ---------------- | -------- | ------ | -------- |
| Speech.framework | 系统框架 | Apple  | 语音识别 |
| ./utils          | 内部模块 | 代码库 | 通用工具 |

---

检索时间: [timestamp]
下一步: 调用 multi-model-analyzer 进行分析
```

---

## 质量门控

### 工具使用验证

**内部代码（有代码库时）：**

- [ ] 调用了 `mcp__auggie-mcp__codebase-retrieval` 至少 1 次
- [ ] 🚨 调用了 LSP 操作**至少 5 次**（documentSymbol + goToDefinition + findReferences + hover）
- [ ] context.md 包含 LSP 分析结果表格
- [ ] **没有**使用 Read/Grep/Glob 读取源代码

**外部文档（涉及新技术或新项目时 - 🚨必须执行）：**

- [ ] 通过 Skill 工具调用了 exa skill 至少 2 次
- [ ] 获取了官方文档链接
- [ ] 获取了代码示例
- [ ] **没有**直接使用 Bash 调用 exa 脚本
- [ ] **没有**跳过外部文档检索

### 产出质量验证

- [ ] 内部：识别了相关文件和符号
- [ ] 外部：获取了最新文档和示例
- [ ] 分析了依赖关系
- [ ] 评估了技术可行性

---

## 约束

- 不做方案分析（交给 multi-model-analyzer）
- 不生成代码（交给 prototype-generator）
- **内部代码禁止跳过 auggie-mcp/LSP 直接读文件**
- **外部文档必须用 Skill("exa") 调用，不要直接 Bash 或 WebSearch**
- **新项目/空代码库时，必须调用 exa skill 获取外部文档**

## 🚨 强制工具验证

**执行此 Skill 后，必须满足以下条件：**

| 检查项             | 要求                    | 验证方式                    |
| ------------------ | ----------------------- | --------------------------- |
| 内部检索           | auggie-mcp 至少 1 次    | 检查 MCP 调用记录           |
| LSP 分析           | 至少 3 次操作           | 检查 LSP 调用记录           |
| 外部文档（新项目） | Skill("exa") 至少 2 次  | 检查 Skill 调用记录         |
| 直接 Bash exa      | 禁止                    | 不能直接调用 exa_exec.ts    |
| 跳过外部检索       | 禁止（新项目/新技术时） | context.md 必须有外部文档段 |

**如果是新项目且没有调用 exa skill，此 Skill 执行失败！**
