---
name: root-cause-analyzer
description: |
  【触发条件】调试工作流第三步：验证假设，追踪根因，使用 5 Whys 分析。
  【核心产出】输出 ${run_dir}/root-cause.md，包含确认的根因和错误链。
  【不触发】假设生成（用 hypothesis-generator）、修复建议（用 fix-proposer）。
allowed-tools: Read, Write, Bash, Grep, Glob, LSP, mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Root Cause Analyzer - 根因分析原子技能

## 职责边界

- **输入**: `${run_dir}/hypotheses.md`（或 hypotheses-codex.md + hypotheses-gemini.md）
- **输出**: `${run_dir}/root-cause.md`
- **单一职责**: 只做假设验证和根因确认，不做修复方案设计

## 执行流程

### Step 1: 读取假设报告

```bash
读取 ${run_dir}/hypotheses.md
提取: 假设列表、验证方法、验证计划
```

### Step 2: 按顺序验证假设

对每个假设执行验证：

```
for 假设 in 验证计划:
    执行验证方法
    记录结果
    if 假设成立:
        标记为确认
        进入深度分析
        break
    else:
        标记为排除
        记录排除原因
        继续下一个假设
```

### Step 3: 深度分析 - 5 Whys

对确认的假设进行深层追踪：

```markdown
## 5 Whys 分析

问题: [确认的问题现象]

Why 1: 为什么发生 [现象]？
→ [直接原因]

Why 2: 为什么 [直接原因] 发生？
→ [次级原因]

Why 3: 为什么 [次级原因] 发生？
→ [深层原因]

Why 4: 为什么 [深层原因] 发生？
→ [根本原因]

Why 5: 为什么 [根本原因] 发生？
→ [系统性问题/流程缺陷]

根因确认: [最终根因描述]
```

### Step 4: 错误链追踪

使用 LSP 追踪调用链：

```bash
# 定位错误发生点
LSP goToDefinition <error_location>

# 追踪调用链
LSP incomingCalls <function_name>

# 查找所有引用
LSP findReferences <symbol>
```

构建错误链：

```
[用户操作/触发点]
    ↓
[入口函数] - file:line
    ↓
[中间层 1] - file:line
    ↓
[中间层 2] - file:line
    ↓
[错误发生点] - file:line
    ↓
[ROOT CAUSE] - 根因描述
```

### Step 5: 代码分析

定位问题代码：

```bash
# 读取问题代码
Read <file_path>

# 分析代码逻辑
# 标注问题点
```

### Step 6: 输出根因报告

将结果写入 `${run_dir}/root-cause.md`：

```markdown
# 根因分析报告: <问题简述>

## 元信息

- 基于假设: hypotheses.md
- 分析时间: [timestamp]
- 分析方法: 5 Whys + 错误链追踪

## 假设验证结果

| 假设   | 状态    | 说明           |
| ------ | ------- | -------------- |
| 假设 1 | ✅ 确认 | 根因           |
| 假设 2 | ❌ 排除 | [排除原因]     |
| 假设 3 | ⏭️ 跳过 | 已确认其他假设 |

## 5 Whys 分析

### 问题: [错误现象]

| 层级  | 问题                 | 答案         |
| ----- | -------------------- | ------------ |
| Why 1 | 为什么 [现象] 发生？ | [直接原因]   |
| Why 2 | 为什么 [直接原因]？  | [次级原因]   |
| Why 3 | 为什么 [次级原因]？  | [深层原因]   |
| Why 4 | 为什么 [深层原因]？  | [根本原因]   |
| Why 5 | 为什么 [根本原因]？  | [系统性问题] |

### 根因确认

**一句话描述**: [根因的简洁描述]

## 错误链
```

[触发点]: 用户点击提交按钮

    │
    ▼

[OrderController.submit()]: src/controllers/order.ts:45

    │ 调用 OrderService.createOrder()
    ▼

[OrderService.createOrder()]: src/services/order.ts:78

    │ 调用 Database.insert()
    ▼

[Database.insert()]: src/db/connection.ts:120

    │ 连接超时
    ▼

[CONNECTION POOL]: src/db/pool.ts:25

    │ 连接池耗尽
    ▼

[ROOT CAUSE]: src/services/query.ts:50

    异常路径未关闭数据库连接

````

## 问题代码

**位置**: `src/services/query.ts:50`

```typescript
// ❌ 问题代码
async function queryData(sql: string) {
  const conn = await pool.getConnection();
  const result = await conn.query(sql);
  if (!result) {
    return null;  // 连接泄漏！未关闭连接
  }
  conn.release();
  return result;
}
````

**问题分析**:

- 第 5 行: 提前返回时未释放连接
- 影响: 每次查询失败都会泄漏一个连接
- 累积效应: 连接池逐渐耗尽

## 影响评估

| 维度     | 评估                   |
| -------- | ---------------------- |
| 影响范围 | 高并发时所有数据库操作 |
| 触发条件 | 查询返回空结果         |
| 紧急程度 | 高 - 会导致服务不可用  |

## 相关发现

在分析过程中发现的其他问题：

1. [其他问题 1]: [位置] - [描述]
2. [其他问题 2]: [位置] - [描述]

---

下一步: 调用 fix-proposer 生成修复方案

```

## 返回值

执行完成后，返回：

```

根因分析完成。
输出文件: ${run_dir}/root-cause.md

🎯 根因确认:
[根因的一句话描述]

📍 问题位置: src/services/query.ts:50
🔗 错误链深度: X 层
⚠️ 紧急程度: {Critical|High|Medium|Low}

下一步: 使用 /debugging:fix-proposer 生成修复方案

```

## 质量门控

| 维度 | 标准 | 阈值 |
|------|------|------|
| 根因确认 | 是否明确定位根因 | ✅ |
| 5 Whys | 是否完成深度分析 | ≥3 层 |
| 错误链 | 是否追踪完整链路 | ✅ |
| 代码定位 | 是否定位到具体代码 | 精确到行 |

## 约束

- 不做假设生成（交给 hypothesis-generator）
- 不做修复方案设计（交给 fix-proposer）
- 必须验证假设，不能跳过验证直接确认
- 根因必须定位到具体代码位置
```
