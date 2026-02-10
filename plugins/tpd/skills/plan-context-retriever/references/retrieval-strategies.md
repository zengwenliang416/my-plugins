# 检索策略指南

## 概述

本文档定义了代码上下文检索的策略和最佳实践。

## 检索工具优先级

| 优先级 | 工具       | 用途           | 适用场景             |
| ------ | ---------- | -------------- | -------------------- |
| 1      | auggie-mcp | 语义检索       | "这个功能在哪实现？" |
| 2      | LSP        | 符号级精准操作 | 定义跳转、引用查找   |
| 3      | Glob       | 文件模式匹配   | 找特定类型文件       |
| 4      | Grep       | 文本搜索       | 精确字符串匹配       |
| 5      | Read       | 文件读取       | 已知路径读取         |

## 检索模式

### 1. 语义检索（Semantic Retrieval）

**适用场景**：

- 不知道具体文件位置
- 需要理解功能实现
- 探索性搜索

**执行方式**：

```typescript
// 使用 auggie-mcp
const query = "用户认证流程是如何实现的？";
const results = await mcp__auggie_mcp__codebase_retrieval({
  information_request: query,
});
```

**最佳实践**：

- 使用自然语言描述意图
- 包含上下文关键词
- 避免过于宽泛的查询

### 2. 符号检索（Symbol Retrieval）

**适用场景**：

- 查找函数/类定义
- 追踪调用关系
- 重构影响分析

**LSP 操作对照**：

| 操作              | 用途         | 示例场景       |
| ----------------- | ------------ | -------------- |
| `goToDefinition`  | 跳转到定义   | 查看函数实现   |
| `findReferences`  | 查找引用     | 修改前影响分析 |
| `documentSymbol`  | 文件符号列表 | 了解文件结构   |
| `workspaceSymbol` | 全局符号搜索 | 找特定类/函数  |
| `hover`           | 获取类型信息 | 理解参数类型   |
| `incomingCalls`   | 调用者分析   | 谁调用了此函数 |
| `outgoingCalls`   | 被调用分析   | 此函数调用了谁 |

### 3. 模式检索（Pattern Retrieval）

**适用场景**：

- 查找特定文件类型
- 匹配命名规范
- 批量文件发现

**Glob 模式示例**：

```bash
# 查找所有服务文件
**/services/*.ts

# 查找测试文件
**/*.{test,spec}.{ts,tsx}

# 查找配置文件
**/config/*.{json,yaml,yml}

# 查找 React 组件
**/components/**/*.tsx
```

### 4. 文本检索（Text Retrieval）

**适用场景**：

- 精确字符串匹配
- 错误消息定位
- 配置值查找

**Grep 模式示例**：

```bash
# 查找特定错误码
"ERROR_CODE_001"

# 查找 API 端点
"/api/v1/users"

# 查找环境变量使用
"process.env.DATABASE_URL"
```

## 检索策略矩阵

| 需求类型 | 首选策略 | 备选策略 | 深度 |
| -------- | -------- | -------- | ---- |
| 功能理解 | 语义     | 符号     | 深   |
| Bug 定位 | 文本     | 符号     | 中   |
| 重构分析 | 符号     | 语义     | 深   |
| 依赖追踪 | 符号     | 模式     | 浅   |
| 配置查找 | 模式     | 文本     | 浅   |

## 上下文扩展策略

### 向上扩展（调用者）

```typescript
// 从目标函数向上追踪
async function expandUpward(symbol: string, depth: number) {
  const callers = await lsp.incomingCalls(symbol);
  if (depth > 0) {
    for (const caller of callers) {
      await expandUpward(caller, depth - 1);
    }
  }
}
```

### 向下扩展（被调用者）

```typescript
// 从目标函数向下追踪
async function expandDownward(symbol: string, depth: number) {
  const callees = await lsp.outgoingCalls(symbol);
  if (depth > 0) {
    for (const callee of callees) {
      await expandDownward(callee, depth - 1);
    }
  }
}
```

### 横向扩展（同级模块）

```typescript
// 查找同目录下相关文件
async function expandSibling(filePath: string) {
  const dir = path.dirname(filePath);
  const siblings = await glob(`${dir}/*.{ts,tsx}`);
  return siblings.filter((f) => f !== filePath);
}
```

## 新项目检索策略

对于新项目或缺少历史代码的场景：

### 1. 外部文档检索（context7 / WebSearch）

```bash
# 使用 WebSearch 获取外部文档
WebSearch(query="React authentication best practices 2024")
```

### 2. 类似项目参考

```bash
# 查找类似开源项目
WebSearch(query="github authentication project examples")
```

### 3. 框架文档

```bash
# 获取框架官方文档
WebSearch(query="Next.js 15 authentication middleware site:nextjs.org")
```

## 检索结果处理

### 相关性评分

| 因素       | 权重 | 说明                 |
| ---------- | ---- | -------------------- |
| 关键词匹配 | 30%  | 与需求关键词的匹配度 |
| 路径相关性 | 25%  | 是否在相关模块路径下 |
| 引用频率   | 20%  | 被其他文件引用的次数 |
| 最近修改   | 15%  | 最近修改时间         |
| 文件大小   | 10%  | 小文件通常更聚焦     |

### 结果过滤

```yaml
filters:
  include:
    - "src/**/*.ts"
    - "lib/**/*.ts"
  exclude:
    - "**/node_modules/**"
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/dist/**"
    - "**/.git/**"
```

### 去重策略

1. 按文件路径去重
2. 合并同文件多个片段
3. 保留最相关的片段

## 检索失败处理

| 情况       | 处理策略                 |
| ---------- | ------------------------ |
| 无结果     | 扩大搜索范围或放宽关键词 |
| 过多结果   | 添加过滤条件或缩小范围   |
| 不相关结果 | 调整查询语句，增加上下文 |
| 工具超时   | 降级到其他工具           |

## 检索日志

每次检索应记录：

```json
{
  "timestamp": "2024-01-19T10:00:00Z",
  "strategy": "semantic",
  "tool": "auggie-mcp",
  "query": "用户认证实现",
  "results_count": 5,
  "top_result": "src/services/auth.ts",
  "duration_ms": 120,
  "success": true
}
```
