---
name: conclusion-generator
description: |
  【触发条件】thinking 工作流 Phase 5：生成最终结论和推理链
  【核心产出】输出 ${run_dir}/conclusion.md，包含完整推理链和最终结论
  【不触发】无
  【先问什么】无需询问，自动执行
  【🚨 强制】必须使用 sequential-thinking MCP 构建推理链
allowed-tools:
  - Read
  - Write
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径
---

# Conclusion Generator - 结论生成原子技能

## MCP 工具集成

| MCP 工具              | 用途                       | 触发条件        |
| --------------------- | -------------------------- | --------------- |
| `sequential-thinking` | 构建推理链，生成结构化结论 | 🚨 每次执行必用 |

## 职责边界

基于思考整合结果，生成最终结论和完整推理链。

- **输入**: `${run_dir}/synthesis.md`
- **输出**: `${run_dir}/conclusion.md`
- **核心能力**: 推理链构建、结论生成、置信度标注

---

## 🚨 CRITICAL: 强制工具使用规则

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 结论生成                                                     │
│     ✅ 必须使用: mcp__sequential-thinking__sequentialthinking   │
│     ❌ 禁止行为: 直接输出结论不展示推理过程、跳过置信度标注       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 执行流程

### Step 0: 结构化结论规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划结论生成策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划结论生成策略。需要：1) 读取整合结果 2) 回顾原始问题 3) 梳理关键证据 4) 识别关键假设 5) 构建推理步骤 6) 形成核心结论 7) 评估置信度 8) 识别局限性",
  thoughtNumber: 1,
  totalThoughts: 8,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **读取整合**：获取 synthesis.md 内容
2. **问题回顾**：明确用户真正想要解决的问题
3. **证据梳理**：提取支持结论的关键证据
4. **假设识别**：列出推理过程中的隐含假设
5. **推理构建**：按逻辑顺序排列推理步骤
6. **结论形成**：基于推理链提炼核心结论
7. **置信度评估**：综合评估整体置信度
8. **局限性识别**：列出结论的局限性和适用范围

### Step 1: 读取整合结果

```
Read("${run_dir}/synthesis.md")
Read("${run_dir}/input.md")  # 原始问题
```

### Step 2: 构建推理链

**使用 sequential-thinking 构建完整推理链**：

```
mcp__sequential-thinking__sequentialthinking({
  thought: "第 1 步：回顾原始问题。明确用户真正想要解决的问题是什么，识别核心需求。",
  thoughtNumber: 2,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 2 步：梳理关键证据。从多模型思考和整合结果中，提取支持结论的关键证据和分析。",
  thoughtNumber: 3,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 3 步：识别关键假设。列出推理过程中的隐含假设，评估这些假设的可靠性。",
  thoughtNumber: 4,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 4 步：构建推理步骤。按逻辑顺序排列推理步骤，确保每一步都有依据。",
  thoughtNumber: 5,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 5 步：形成核心结论。基于推理链，提炼出核心结论，确保结论直接回答原始问题。",
  thoughtNumber: 6,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 6 步：评估置信度。综合考虑证据强度、假设可靠性、模型共识度，给出整体置信度。",
  thoughtNumber: 7,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 7 步：识别局限性。列出结论的局限性、适用范围和可能的改进方向。",
  thoughtNumber: 8,
  totalThoughts: 8,
  nextThoughtNeeded: false
})
```

### Step 3: 生成结论报告

**输出路径**：`${run_dir}/conclusion.md`

**文档模板**：

```markdown
---
generated_at: { ISO 8601 时间戳 }
generator_version: "1.0"
confidence: { high / medium / low }
reasoning_steps: { 步骤数 }
---

# 深度思考结论

## 问题回顾

**原始问题**:
{用户的原始问题}

**问题本质**:
{问题的核心需求是什么}

---

## 推理链

### 步骤 1: {步骤标题}

**推理内容**:
{具体推理过程}

**依据**:

- {依据 1}
- {依据 2}

**结论**: {本步骤结论}

---

### 步骤 2: {步骤标题}

{... 同上格式 ...}

---

### 步骤 N: 最终推导

**推理内容**:
{最终推导过程}

**综合依据**:

- 来自 Claude: {依据}
- 来自 Codex: {依据}
- 来自 Gemini: {依据}

**最终结论**: {核心结论}

---

## 核心结论

### 直接回答

{对原始问题的直接、简洁回答}

### 详细说明

{对结论的详细解释和背景说明}

### 关键要点

1. **要点 1**: {描述}
2. **要点 2**: {描述}
3. **要点 3**: {描述}

---

## 置信度分析

### 整体置信度: { 高 / 中 / 低 }

**置信度说明**:
{为什么是这个置信度}

### 置信度分解

| 维度         | 评分 (1-10) | 说明   |
| ------------ | ----------- | ------ |
| 证据充分性   | {分}        | {说明} |
| 推理严谨性   | {分}        | {说明} |
| 模型共识度   | {分}        | {说明} |
| 假设可靠性   | {分}        | {说明} |
| **加权总分** | **{分}**    |        |

---

## 关键假设

### 假设清单

| 序号 | 假设内容 | 可靠性   | 影响范围   |
| ---- | -------- | -------- | ---------- |
| 1    | {假设 1} | 高/中/低 | {影响说明} |
| 2    | {假设 2} | 高/中/低 | {影响说明} |

### 假设风险

{如果某些假设不成立，结论会如何变化}

---

## 局限性与改进

### 当前局限

1. {局限 1}
2. {局限 2}
3. {局限 3}

### 适用范围

- **适用**: {结论适用的场景}
- **不适用**: {结论不适用的场景}

### 进一步探索方向

{如果要深入探索，应该从哪些方向入手}

---

## 摘要

**一句话结论**:
{最简洁的结论陈述}

**推理链摘要**:
{问题} → {关键推理 1} → {关键推理 2} → {结论}

**置信度**: { 高 / 中 / 低 } | **推理步骤**: { N } 步
```

---

## 质量门控

### 工具使用验证

- [ ] 调用了 `mcp__sequential-thinking__sequentialthinking` 至少 8 次
- [ ] 读取了 synthesis.md 和 input.md 文件
- [ ] 产出 conclusion.md 文件

### 产出质量验证

- [ ] 推理链每一步都有明确依据
- [ ] 核心结论直接回答原始问题
- [ ] 置信度分解有合理说明
- [ ] 关键假设已识别并评估
- [ ] 局限性和适用范围已标注

---

## 返回值

成功时返回：

```json
{
  "status": "success",
  "output_file": "${run_dir}/conclusion.md",
  "confidence": "high",
  "reasoning_steps": 7,
  "one_line_conclusion": "一句话结论",
  "key_points": ["要点 1", "要点 2", "要点 3"],
  "limitations_count": 3,
  "next_phase": {
    "phase": 6,
    "name": "delivery"
  }
}
```

---

## 约束

- 必须使用 sequential-thinking 构建推理链
- 结论必须直接回答原始问题
- 必须标注置信度和假设
- 推理链每一步都要有依据
- 明确标注局限性和适用范围
