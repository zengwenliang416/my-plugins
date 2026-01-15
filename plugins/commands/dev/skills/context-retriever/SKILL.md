---
name: context-retriever
description: |
  【触发条件】开发工作流第一步：检索与功能需求相关的上下文。
  【核心产出】输出 ${run_dir}/context.md，包含内部代码 + 外部文档。
  【不触发】直接分析（用 multi-model-analyzer）、代码生成（用 prototype-generator）。
  【强制工具】内部代码用 auggie-mcp + LSP，外部文档用 exa skill。
allowed-tools: Write, Bash, LSP, mcp__auggie-mcp__codebase-retrieval
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
│  🌐 外部文档检索（新技术/最新 API）                               │
│     ✅ 必须使用: exa skill (Bash 调用)                           │
│     ❌ 禁止使用: 直接 WebSearch/WebFetch                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 执行流程

### Step 1: 判断检索类型

根据功能需求判断需要哪种检索：

| 场景                       | 检索类型         | 工具                |
| -------------------------- | ---------------- | ------------------- |
| 修改/扩展现有功能          | 内部代码         | auggie-mcp + LSP    |
| 使用新技术/框架            | 外部文档         | exa skill           |
| 两者结合（常见）           | 内部 + 外部      | 全部工具            |
| 新项目/空代码库            | 仅外部文档       | exa skill           |

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

**2A.2 LSP 符号分析**

对 auggie-mcp 返回的每个相关文件：

```
LSP.documentSymbol(filePath)           # 文件结构
LSP.goToDefinition(filePath, line, char)   # 符号定义
LSP.findReferences(filePath, line, char)   # 所有引用
```

**至少调用 3 次 LSP 操作。**

### Step 2B: 外部文档检索（涉及新技术时必须执行）

**使用 exa skill 搜索最新文档和示例：**

```bash
# exa 脚本（内嵌在 dev 插件中）
EXA="${CLAUDE_PLUGIN_ROOT}/skills/exa/scripts/exa_exec.ts"

# 搜索官方文档和教程
npx tsx "$EXA" search "${技术关键词} tutorial documentation 2024 2025" \
  --content --limit 5

# 搜索代码示例
npx tsx "$EXA" search "${技术关键词} example code implementation" \
  --content --category github --limit 5

# 搜索最佳实践
npx tsx "$EXA" search "${技术关键词} best practices production" \
  --content --limit 3
```

**典型搜索示例：**

```bash
# macOS 语音识别
npx tsx "$EXA" search "SFSpeechRecognizer macOS Swift tutorial 2024" --content --limit 5

# React 新特性
npx tsx "$EXA" search "React 19 useActionState example" --content --include react.dev --limit 5
```

> **注意**：需要设置 `EXA_API_KEY` 环境变量

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

| 符号名 | 位置             | 引用次数 | 说明   |
| ------ | ---------------- | -------- | ------ |
| Foo    | src/foo.ts:10:1  | 15       | 核心类 |

## 外部文档（来自 exa）

### 官方文档

| 来源 | 标题 | URL | 关键内容摘要 |
| ---- | ---- | --- | ------------ |
| Apple Developer | SFSpeechRecognizer | https://... | 语音识别核心 API |

### 代码示例

| 来源 | 标题 | URL | 关键代码片段 |
| ---- | ---- | --- | ------------ |
| GitHub | speech-demo | https://... | 完整实现示例 |

### 最佳实践

- [实践1]: 描述 (来源: URL)
- [实践2]: 描述 (来源: URL)

## 架构模式

- 当前架构: [识别的架构模式]
- 推荐模式: [来自外部文档的建议]

## 依赖分析

| 依赖       | 类型     | 来源     | 用途     |
| ---------- | -------- | -------- | -------- |
| Speech.framework | 系统框架 | Apple | 语音识别 |
| ./utils    | 内部模块 | 代码库   | 通用工具 |

---

检索时间: [timestamp]
下一步: 调用 multi-model-analyzer 进行分析
```

---

## 质量门控

### 工具使用验证

**内部代码（有代码库时）：**
- [ ] 调用了 `mcp__auggie-mcp__codebase-retrieval` 至少 1 次
- [ ] 调用了 LSP 操作至少 3 次
- [ ] **没有**使用 Read/Grep/Glob 读取源代码

**外部文档（涉及新技术时）：**
- [ ] 调用了 exa search 至少 2 次
- [ ] 获取了官方文档链接
- [ ] 获取了代码示例

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
- **外部文档必须用 exa skill，不要直接 WebSearch**
