---
name: thought-synthesizer
description: |
  【触发条件】thinking 工作流 Phase 4：整合上下文探索与约束集
  【核心产出】输出 ${run_dir}/synthesis.md，包含约束/风险/依赖/成功判据与未决问题
  【不触发】无探索产物时（可降级为轻量总结）
  【先问什么】无需询问，自动执行
  【🚨 强制】必须使用 sequential-thinking MCP 进行结构化整合
allowed-tools:
  - Read
  - Write
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径
  - name: depth
    type: string
    required: true
    description: 思考深度 (light/deep/ultra)
---

# Thought Synthesizer - 思考整合原子技能

## MCP 工具集成

| MCP 工具              | 用途                          | 触发条件        |
| --------------------- | ----------------------------- | --------------- |
| `sequential-thinking` | 结构化多源整合，约束/风险分析 | 🚨 每次执行必用 |

## 职责边界

整合来自多个上下文边界的探索结果，形成统一的约束集合。

- **输入**: `${run_dir}/explore-*.json`（核心）与可选 \*-thought.md
- **输出**: `${run_dir}/synthesis.md`
- **核心能力**: 约束整合、风险/依赖归纳、成功判据提炼

---

## 🚨 CRITICAL: 强制工具使用规则

```
┌─────────────────────────────────────────────────────────────────┐
│  🔄 思考整合                                                     │
│     ✅ 必须使用: mcp__sequential-thinking__sequentialthinking   │
│     ❌ 禁止行为: 简单拼接各边界输出、跳过结构化整合              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 执行流程

### Step 0: 结构化整合规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划整合策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划约束整合策略。需要：1) 读取探索 JSON 2) 汇总硬/软约束 3) 提取多模型补充约束 4) 合并依赖与风险 5) 汇总成功判据线索 6) 识别开放问题 7) 生成结构化 synthesis.md",
  thoughtNumber: 1,
  totalThoughts: 7,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **读取探索**：读取 boundaries.json 与各 explore-*.json
2. **硬/软约束**：区分强制与偏好约束
3. **依赖/风险**：合并重复项并去重
4. **成功判据**：聚合可验证行为线索
5. **开放问题**：汇总需用户澄清的疑问
6. **整合输出**：生成结构化 synthesis.md

### Step 1: 读取所有思考输出

```
# 读取边界列表（如存在）
Read("${run_dir}/boundaries.json")

# 读取各边界探索结果
Read("${run_dir}/explore-<boundary>.json")

# 可选读取补充思考输出（若存在）
Read("${run_dir}/claude-thought.md")
Read("${run_dir}/codex-thought.md")
Read("${run_dir}/gemini-thought.md")
```

### Step 2: 结构化整合分析

**使用 sequential-thinking 进行 6 步整合**：

```
mcp__sequential-thinking__sequentialthinking({
  thought: "第 1 步：合并所有 explore-*.json 的 constraints_discovered，区分硬/软约束。",
  thoughtNumber: 2,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 2 步：从 codex-thought.md / gemini-thought.md 中提取补充约束与风险（若存在），标注来源。",
  thoughtNumber: 3,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 3 步：合并 dependencies 与 risks，去重并标注来源。",
  thoughtNumber: 4,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 4 步：汇总 success_criteria_hints，整理为可验证判据。",
  thoughtNumber: 5,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 5 步：汇总 open_questions，按优先级排序。",
  thoughtNumber: 6,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 6 步：生成综合整合输出，形成可交接的约束集合摘要。",
  thoughtNumber: 7,
  totalThoughts: 7,
  nextThoughtNeeded: false
})
```

### Step 3: 生成整合报告

**输出路径**：`${run_dir}/synthesis.md`

**文档模板**：

```markdown
---
generated_at: { ISO 8601 时间戳 }
synthesizer_version: "1.0"
boundaries_integrated: ["user-domain", "auth-session"]
models_used: ["codex", "gemini"]
depth: { light / deep / ultra }
---

# 约束整合报告

## 整合概述

- **参与边界**: { 边界列表 }
- **思考深度**: { depth }
- **整合方法**: 结构化约束整合

## 约束集合

### 硬约束

- {硬约束 1}
- {硬约束 2}

### 软约束

- {软约束 1}
- {软约束 2}

## 依赖与风险

### 依赖

- {依赖 1}
- {依赖 2}

### 风险

- {风险 1}
- {风险 2}

## 成功判据（线索）

- {可观察成功线索 1}
- {可观察成功线索 2}

## 待确认问题

- {问题 1}
- {问题 2}

## 多模型补充（可选）

- **Codex 补充**: {来自 codex-thought.md 的约束/风险/判据}
- **Gemini 补充**: {来自 gemini-thought.md 的约束/风险/判据}

## 边界贡献

| 边界 | 主要发现 | 关键约束 |
| ---- | -------- | -------- |
| {boundary-1} | {发现} | {约束} |
| {boundary-2} | {发现} | {约束} |
```

---

## Light 模式处理

当只有单边界输出时：

```markdown
---
generated_at: { ISO 8601 时间戳 }
synthesizer_version: "1.0"
boundaries_integrated: ["core"]
models_used: []
depth: light
---

# 约束整合报告（Light 模式）

## 整合概述

- **参与边界**: core
- **思考深度**: light
- **说明**: 单边界模式

## 边界探索结果

{直接引用 explore-core.json 的核心内容}

## 结论

{核心约束与成功判据摘要}

## 置信度

- **整体置信度**: { 高 / 中 / 低 }
- **说明**: 单边界分析，复杂问题建议拆分更多上下文边界
```

---

## 质量门控

### 工具使用验证

- [ ] 调用了 `mcp__sequential-thinking__sequentialthinking` 至少 7 次
- [ ] 读取了所有可用的 explore-*.json 文件
- [ ] 如存在 codex/gemini thought 文件，已提取补充约束
- [ ] 产出 synthesis.md 文件

### 产出质量验证

- [ ] 各边界约束与风险提取完整
- [ ] 约束分为硬/软两类
- [ ] 依赖与风险去重完成
- [ ] 成功判据线索可验证
- [ ] 开放问题已排序

---

## 返回值

成功时返回：

```json
{
  "status": "success",
  "output_file": "${run_dir}/synthesis.md",
  "boundaries_integrated": ["user-domain", "auth-session"],
  "constraints_count": 12,
  "open_questions_count": 3,
  "overall_confidence": "medium",
  "key_synthesis": "约束集合摘要",
  "next_phase": {
    "phase": 5,
    "name": "conclusion-generator"
  }
}
```

---

## 约束

- 必须使用 sequential-thinking 进行结构化整合
- 不简单拼接，要真正分析和综合
- 明确标注硬/软约束与开放问题
- 依赖与风险需去重并标注来源
- 保留不确定性，不强行统一
