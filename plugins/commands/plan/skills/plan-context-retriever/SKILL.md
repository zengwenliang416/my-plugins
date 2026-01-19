---
name: plan-context-retriever
description: |
  【触发条件】plan 工作流第二步：检索与需求相关的代码上下文
  【核心产出】输出 ${run_dir}/context.md
  【🚨强制工具🚨】auggie-mcp 必须首选！LSP 符号分析！exa 外部检索（新项目）
  【禁止】跳过 auggie-mcp 直接用 Grep/Glob
  【不触发】直接分析（用 architecture-analyzer）
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - LSP
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Plan Context Retriever - 上下文检索原子技能

## 职责边界

- **输入**: `run_dir` + `${run_dir}/requirements.md`
- **输出**: `${run_dir}/context.md`
- **单一职责**: 只做上下文检索，不做架构分析

## 执行流程

### Step 1: 读取需求

```bash
REQUIREMENTS=$(cat "${run_dir}/requirements.md")
```

从需求文件中提取：

- 功能需求列表
- 技术约束
- 任务类型

### Step 2: 判断项目状态

检查是否为新项目：

```bash
# 检查代码库是否有实质内容
FILE_COUNT=$(find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" | wc -l)
```

| 状态     | 判断条件       | 检索策略                 |
| -------- | -------------- | ------------------------ |
| 新项目   | 代码文件 < 10  | 使用 exa 外部检索        |
| 现有项目 | 代码文件 >= 10 | 使用 auggie-mcp 内部检索 |

### Step 3: 内部代码检索（现有项目）

## 🚨🚨🚨 强制工具优先级 🚨🚨🚨

**代码检索必须按以下顺序，不得跳过：**

| 优先级 | 工具                                  | 用途             | 强制性             |
| ------ | ------------------------------------- | ---------------- | ------------------ |
| 1      | `mcp__auggie-mcp__codebase-retrieval` | 语义检索（首选） | **必须首先使用**   |
| 2      | `LSP`                                 | 符号级精准操作   | 对检索结果深入分析 |
| 3      | `Grep/Glob`                           | 降级选择         | 仅当 auggie 不可用 |

**禁止行为**：

- ❌ 跳过 auggie-mcp 直接用 Grep/Glob
- ❌ 不调用 LSP 就完成检索
- ❌ 只用 Read 手动翻看文件

**强制调用 `mcp__auggie-mcp__codebase-retrieval`**：

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "查找与 <功能需求> 相关的代码：
    - 相关的类、函数、模块
    - 数据模型和接口定义
    - 现有的类似实现
    - 依赖的外部库
    - 配置文件和环境变量"
})
```

**验证检索完成**：必须获得至少 3 个相关代码片段，否则扩大搜索范围。

### Step 4: LSP 符号级分析

对语义检索结果中的关键符号，使用 LSP 深入分析：

| 场景         | LSP 操作                          | 产出         |
| ------------ | --------------------------------- | ------------ |
| 理解文件结构 | `documentSymbol`                  | 文件符号列表 |
| 查看符号定义 | `goToDefinition`                  | 定义位置     |
| 找出所有引用 | `findReferences`                  | 引用列表     |
| 理解调用关系 | `incomingCalls` / `outgoingCalls` | 调用图       |
| 接口实现定位 | `goToImplementation`              | 实现列表     |

### Step 5: 外部文档检索（新项目或需要最佳实践）

调用 exa skill 获取外部资源：

```
Skill(skill="dev:exa", args="query=<技术栈> best practices implementation")
```

检索内容：

- 官方文档
- 最佳实践指南
- 示例代码库
- 常见问题解决方案

### Step 6: 证据收集

收集所有发现的证据：

```json
{
  "internal_evidence": [
    {
      "file": "src/auth/login.ts",
      "line": 42,
      "symbol": "authenticateUser",
      "relevance": "高",
      "reason": "现有认证实现"
    }
  ],
  "external_evidence": [
    {
      "source": "https://docs.example.com/auth",
      "title": "Authentication Best Practices",
      "relevance": "中",
      "reason": "行业标准参考"
    }
  ]
}
```

### Step 7: 结构化输出

将检索结果写入 `${run_dir}/context.md`：

```markdown
# 上下文检索报告

## 元信息

- 检索时间: [timestamp]
- 项目状态: [新项目|现有项目]
- 检索范围: [内部|外部|混合]

## 需求概述

[从 requirements.md 提取的核心需求]

## 内部代码上下文

### 相关文件

| 文件路径               | 相关度 | 关键符号         | 说明         |
| ---------------------- | ------ | ---------------- | ------------ |
| src/auth/login.ts      | 高     | authenticateUser | 核心认证逻辑 |
| src/models/user.ts     | 高     | UserModel        | 用户数据模型 |
| src/middleware/auth.ts | 中     | authMiddleware   | 认证中间件   |

### 架构模式

- **当前架构**: [识别的架构模式]
- **数据流向**: [数据如何流动]
- **关键接口**: [需要实现/扩展的接口]

### 依赖分析

| 依赖           | 类型     | 版本   | 用途     |
| -------------- | -------- | ------ | -------- |
| express        | 外部库   | 4.18.2 | Web 框架 |
| jsonwebtoken   | 外部库   | 9.0.0  | JWT 处理 |
| ./utils/crypto | 内部模块 | -      | 加密工具 |

### 调用关系图
```

authenticateUser()
├── validateCredentials()
│ └── hashPassword()
├── generateToken()
└── saveSession()

```

## 外部文档上下文

### 参考资料

| 来源 | 标题 | 相关度 | 要点 |
|-----|-----|-------|-----|
| [URL] | [标题] | 高/中/低 | [关键信息] |

### 最佳实践

- [从外部文档提取的最佳实践]

### 技术选型建议（新项目）

| 领域 | 推荐方案 | 理由 |
|-----|---------|-----|
| 认证 | JWT + OAuth2 | 行业标准 |
| 数据库 | PostgreSQL | 复杂查询支持 |

## 潜在影响

- **可能影响的模块**: [列表]
- **需要修改的文件**: [列表]
- **测试覆盖情况**: [现有测试]

## 证据链

[完整的证据 JSON]

---

下一步: 调用 architecture-analyzer 进行架构分析
```

## 返回值

执行完成后，返回：

```
上下文检索完成。
输出文件: ${run_dir}/context.md
项目状态: [新项目|现有项目]
相关文件: X 个
外部参考: Y 个

下一步: 使用 plan:architecture-analyzer 进行架构分析
```

## 质量门控

- ✅ 识别了相关代码文件
- ✅ 提取了关键符号和接口
- ✅ 分析了依赖关系
- ✅ 评估了潜在影响范围
- ✅ 收集了证据链

## 约束

- 不做架构分析（交给 architecture-analyzer）
- 不生成代码（交给后续阶段）
- 检索范围可广，但产出必须聚焦
- 必须使用 LSP 进行符号级精准分析
