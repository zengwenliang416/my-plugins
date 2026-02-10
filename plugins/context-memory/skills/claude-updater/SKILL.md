---
name: claude-updater
description: |
  【触发条件】claude-full/claude-related 流程中，为单个模块生成 CLAUDE.md
  【核心产出】模块目录下的 CLAUDE.md 文件
  【专属用途】
    - 分析模块代码结构
    - 构建生成 prompt
    - 调用 gemini-cli 生成
    - Claude 审查重构
  【强制工具】auggie-mcp, LSP, gemini-cli (降级: codex-cli)
  【不触发】批量处理（由 memory.md 编排）
  【先问什么】默认先确认输入范围、输出格式与约束条件
allowed-tools:
  - Bash
  - Read
  - Write
  - LSP
  - Skill
arguments:
  - name: module_path
    type: string
    required: true
    description: 目标模块路径
  - name: strategy
    type: string
    required: true
    description: 生成策略 (single-layer|multi-layer)
  - name: force_regenerate
    type: boolean
    required: false
    default: false
    description: 强制重新生成（即使已存在）
---

# Claude Updater Skill

## 核心概念

### 生成策略

| 策略         | Depth | 上下文范围                     | 适用场景             |
| ------------ | ----- | ------------------------------ | -------------------- |
| single-layer | 0-2   | `@*/CLAUDE.md @*.{ts,tsx,...}` | 浅层目录，引用子模块 |
| multi-layer  | ≥3    | `@**/*` 所有文件               | 深层目录，独立分析   |

### CLAUDE.md 模板结构

```markdown
# {Module Name}

## Purpose

[1-2 sentences describing what this module does]

## Structure

[Directory tree with brief descriptions]

## Components

### {Component Name}

- **Purpose**: [What it does]
- **Exports**: [Key exports]
- **Dependencies**: [Internal/external deps]

## Dependencies

### Internal

- `../path/to/module` - [Purpose]

### External

- `package-name` - [Usage]

## Integration

[How this module connects with the system]

## Implementation Notes

[Key algorithms, patterns, or gotchas]
```

## MCP 工具集成

| MCP 工具              | 用途                 | 触发条件        |
| --------------------- | -------------------- | --------------- |
| `auggie-mcp`          | 语义检索模块代码结构 | 🚨 必须使用     |
| `LSP`                 | 获取符号定义和引用   | 发现代码文件时  |

## 执行流程

```
│     thought: "规划 CLAUDE.md 生成策略：
│       1) auggie-mcp 分析模块代码结构
│       2) LSP 获取符号定义
│       3) 构建生成 prompt
│       4) 调用 gemini-cli（降级 codex-cli）
│       5) Claude 审查重构
│       6) 写入 CLAUDE.md",
│     thoughtNumber: 1,
│     totalThoughts: 6,
│     nextThoughtNeeded: true
│   })
│
├── Step 1: 🚨 auggie-mcp 分析模块结构
│   mcp__auggie-mcp__codebase-retrieval({
│     information_request: "分析 ${module_path} 目录的代码结构：
│       1. 主要功能和职责
│       2. 导出的 API/接口
│       3. 内部依赖关系
│       4. 外部依赖关系
│       5. 关键实现模式"
│   })
│
├── Step 2: 🚨 LSP 获取符号信息
│   For each code_file in module:
│     LSP(operation="documentSymbol", filePath=file, line=1, character=1)
│     → 获取函数/类/接口定义
│
│   For each important_symbol:
│     LSP(operation="findReferences", ...)
│     → 找到使用处，理解集成点
│
├── Step 3: 构建 prompt
│   基于 auggie-mcp 和 LSP 结果：
│   ├── 目录结构信息
│   ├── 代码符号列表
│   ├── 依赖关系图
│   └── 策略特定的上下文范围
│
├── Step 4: 调用 Skill("context-memory:gemini-cli")
│   Skill("context-memory:gemini-cli",
│     module_path="${module_path}",
│     strategy="${strategy}"
│   )
│
│   If failed → Skill("context-memory:codex-cli", ...)
│
├── Step 5: Claude 审查重构
│   对 gemini/codex 输出进行：
│   ├── 结构验证（符合模板）
│   ├── 内容准确性检查
│   ├── 去除占位符/TODO
│   └── 精简冗余内容
│
└── Step 6: Write CLAUDE.md
    Write(file_path="${module_path}/CLAUDE.md", content=reviewed_content)
```

## 策略详解

### Single-Layer 策略

```markdown
适用: depth 0-2 的模块

Prompt 上下文:

- @\*/CLAUDE.md → 子模块文档（如存在）
- @_.ts @_.tsx → 当前目录代码文件
- @_.js @_.jsx → JavaScript 文件
- @\*.py → Python 文件
- @\*.md → 文档文件
- @_.json @_.yaml → 配置文件

特点:

- 引用子模块的 CLAUDE.md，不重复其内容
- 聚焦当前目录的直接内容
- 适合顶层和中层目录
```

### Multi-Layer 策略

```markdown
适用: depth >= 3 的深层模块

Prompt 上下文:

- @\*_/_ → 递归读取所有文件

特点:

- 完整分析整个子树
- 可能生成多个 CLAUDE.md（每个子目录一个）
- 自底向上生成（最深的先生成）
- 适合叶子模块和深层结构
```

## 降级链

```
gemini-cli
    │
    ▼ (失败: 非零退出码/空输出)
codex-cli
    │
    ▼ (失败)
手动模式: 提示用户手动编写
```

## 输出验证

### 必须包含

- [ ] Purpose 在前 2 句话内清晰描述
- [ ] Structure 列出目录/文件结构
- [ ] Components 列出主要组件
- [ ] Dependencies 区分内部/外部

### 禁止包含

- [ ] 占位符文本（[TODO], [TBD]）
- [ ] 重复子模块 CLAUDE.md 的完整内容
- [ ] 过于冗长的代码示例
- [ ] 过时的信息

## 使用示例

```
# 单层策略生成
Skill("context-memory:claude-updater",
  module_path="src/auth",
  strategy="single-layer"
)

# 多层策略生成
Skill("context-memory:claude-updater",
  module_path="src/core/handlers/oauth",
  strategy="multi-layer"
)

# 强制重新生成
Skill("context-memory:claude-updater",
  module_path="src/utils",
  strategy="single-layer",
  force_regenerate=true
)
```

## 错误处理

### gemini-cli 失败

```
1. 检查错误类型
   - 网络错误 → 重试 (3次, 指数退避)
   - 配额错误 → 切换到 codex-cli
   - 工具不可用 → 切换到 codex-cli

2. 降级到 codex-cli
   - 使用相同的 prompt
   - 输出质量可能略有不同
```

### 模块不存在

```
Error: Module path does not exist: ${module_path}
Action: 跳过此模块，记录错误
```

### 权限问题

```
Error: Cannot write to ${module_path}/CLAUDE.md
Action: 通知用户检查权限
```

## 验证清单

- [ ] auggie-mcp 分析了模块结构
- [ ] LSP 获取了符号信息
- [ ] prompt 构建完整
- [ ] gemini-cli/codex-cli 调用成功
- [ ] Claude 已审查重构
- [ ] CLAUDE.md 已写入
- [ ] 输出符合模板结构
