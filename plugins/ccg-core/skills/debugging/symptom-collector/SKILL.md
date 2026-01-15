---
name: symptom-collector
description: |
  【触发条件】调试工作流第一步：收集错误症状、日志和复现信息。
  【核心产出】输出 ${run_dir}/symptoms.md，包含结构化的问题描述和证据。
  【不触发】假设生成（用 hypothesis-generator）、根因分析（用 root-cause-analyzer）。
allowed-tools: Read, Grep, Glob, Bash, mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Symptom Collector - 症状收集原子技能

## 职责边界

- **输入**: `${run_dir}/problem.md` + 错误信息（可选）
- **输出**: `${run_dir}/symptoms.md`
- **单一职责**: 只做信息收集和结构化整理，不做分析

## 执行流程

### Step 1: 收集问题描述

向用户确认：

| 信息项   | 必需 | 说明                |
| -------- | ---- | ------------------- |
| 错误现象 | ✅   | 用户看到什么问题    |
| 影响范围 | ✅   | 哪些功能/用户受影响 |
| 复现步骤 | ✅   | 如何触发问题        |
| 首次出现 | ⬜   | 何时开始出现        |
| 频率     | ⬜   | 必现/偶发/特定条件  |

### Step 2: 收集错误日志

```bash
# 搜索错误日志
grep -r "ERROR\|Exception\|FATAL" logs/ --include="*.log" | tail -50

# 搜索最近的错误
grep -r "ERROR" logs/ --include="*.log" -l | xargs -I {} tail -20 {}

# 检查系统日志
dmesg | tail -50  # 内核日志（如适用）
```

### Step 3: 收集堆栈跟踪

```bash
# 提取堆栈跟踪
grep -A 30 "Exception\|Error\|Traceback" logs/error.log | head -100

# 查找相关代码位置
# 从堆栈中提取文件:行号
```

### Step 4: 收集环境信息

```bash
# 运行时环境
node --version 2>/dev/null || python --version 2>/dev/null
cat package.json 2>/dev/null | grep -A5 '"dependencies"' | head -10

# Git 信息
git log --oneline -5
git status --short

# 系统资源（如适用）
free -m 2>/dev/null || vm_stat 2>/dev/null
```

### Step 5: 代码上下文

使用 `mcp__auggie-mcp__codebase-retrieval` 查找相关代码：

```
information_request: "查找与以下错误相关的代码:

错误信息: <error_message>
文件位置: <file:line if known>

需要:
1. 错误发生的函数/方法
2. 相关的调用链
3. 错误处理逻辑
"
```

### Step 6: 输出症状报告

将结果写入 `${run_dir}/symptoms.md`：

```markdown
# 症状报告: <问题简述>

## 元信息

- 收集时间: [timestamp]
- 问题 ID: debug-YYYYMMDD-HHMMSS
- 严重程度: Critical | High | Medium | Low

## 问题描述

### 现象

<用户描述的问题现象>

### 影响范围

- 受影响功能: [功能列表]
- 受影响用户: [用户群体/比例]
- 业务影响: [业务影响描述]

### 复现步骤

1. [步骤 1]
2. [步骤 2]
3. [步骤 3]
4. 观察到: [错误现象]

### 时间线

- 首次出现: [时间]
- 频率: 必现 | 偶发 | 特定条件触发
- 相关事件: [最近的部署/变更]

## 证据收集

### 错误日志
```

[错误日志内容]

```

### 堆栈跟踪

```

[堆栈跟踪内容]

```

### 相关代码

| 文件 | 行号 | 说明 |
|------|------|------|
| src/foo.ts | 25 | 错误抛出位置 |
| src/bar.ts | 10 | 调用方 |

### 环境信息

| 项目 | 值 |
|------|-----|
| 运行时 | Node.js 18.x |
| 框架 | Express 4.x |
| 数据库 | PostgreSQL 14 |
| 最近提交 | abc1234 |

## 初步观察

- [观察 1: 客观事实]
- [观察 2: 客观事实]
- [观察 3: 客观事实]

---

下一步: 调用 hypothesis-generator 生成假设
```

## 返回值

执行完成后，返回：

```
症状收集完成。
输出文件: ${run_dir}/symptoms.md

📋 收集概要:
- 问题 ID: debug-YYYYMMDD-HHMMSS
- 严重程度: {Critical|High|Medium|Low}
- 错误日志: X 条
- 堆栈跟踪: Y 个
- 相关文件: Z 个

下一步: 使用 debugging:hypothesis-generator 生成假设
```

## 质量门控

| 维度     | 标准             | 阈值      |
| -------- | ---------------- | --------- |
| 问题描述 | 现象是否清晰     | 必填      |
| 复现步骤 | 步骤是否完整     | 必填      |
| 错误证据 | 是否有日志/堆栈  | 至少 1 项 |
| 代码定位 | 是否找到相关代码 | 建议      |

## 约束

- 不做假设分析（交给 hypothesis-generator）
- 不做根因判断（交给 root-cause-analyzer）
- 只收集客观事实，不加主观判断
- 信息不足时主动向用户提问
