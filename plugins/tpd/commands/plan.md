---
description: "OpenSpec 规划工作流：OpenSpec 选择 → 上下文检索 → 多模型分析 → 歧义消除 → PBT 属性 → 计划整合 → 校验"
argument-hint: "[proposal_id] [--task-type=frontend|backend|fullstack] [--loop]"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Write
  - Task
  - Bash
  - mcp__codex__codex
  - mcp__gemini__gemini
---

# /tpd:plan - OpenSpec 规划工作流命令

## 概述

plan 阶段的目标：将 OpenSpec 提案细化为**零决策可执行计划**，并产出可验证的 PBT 属性。该阶段必须结合 OpenSpec，所有关键约束都要明确落盘。

**支持无参数调用**：直接执行 `/tpd:plan` 时，自动从 `openspec view` 中选择提案进入规划（与 gudaspec 行为一致）。

---

## 🚨🚨🚨 强制执行规则 🚨🚨🚨

**与 GudaSpec Plan 对齐的硬性要求：**

- ✅ 必须先 `openspec view` 并让用户确认 `proposal_id`
- ✅ 必须同时使用 `mcp__codex__codex` 与 `mcp__gemini__gemini` 做多模型分析
- ✅ 必须完成“歧义消除审计”，所有决策点必须转化为明确约束
- ✅ 必须提取 PBT 属性（不变式 + 反例策略）
- ✅ 必须执行 `openspec validate <proposal_id> --strict`
- ✅ 只有用户明确批准后，才可进入 /tpd:dev

**禁止行为：**

- ❌ 需求不清时直接给出方案
- ❌ 只做单模型分析
- ❌ 未验证就进入 dev
- ❌ 未经确认直接落盘 OpenSpec

**OpenSpec 规则：**

- thinking 阶段已直接写入 `openspec/`，plan 阶段不再接入草稿
- 任何阶段都必须参考 `openspec/AGENTS.md`（若缺失，先运行 `openspec update`）

---

## Phase 0: OpenSpec 状态检查（支持自动衔接）

1. 执行（与官方流程一致的 OpenSpec Dashboard 探测）：

```bash
openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
```

2. 如果项目未初始化 OpenSpec：
   - 立即提示执行 `/tpd:init`
   - 完成后再继续本阶段

3. proposal_id 解析优先级：
   - 参数显式传入的 proposal_id
   - 若 `openspec view` 仅有 1 个 Active Change → 自动选择
   - 否则让用户从 `openspec view` 输出中选择

4. **无参数调用时**：不要报错，直接进入以上自动选择流程。

---

## Phase 1: 初始化

1. 解析参数：
   - TASK_TYPE: fullstack (默认) | frontend | backend
   - LOOP_MODE: 是否自动衔接 dev（--loop 参数）
   - PROPOSAL_ID: 已确认的 proposal_id（来自 Phase 0）

2. 生成运行目录路径（固定路径，位于 OpenSpec 之下）：
   - PLAN_DIR: `openspec/changes/${PROPOSAL_ID}/artifacts/plan`

```bash
mkdir -p "${PLAN_DIR}"
```

3. 写入 `${PLAN_DIR}/state.json` 与 `${PLAN_DIR}/input.md`
   - 若无显式功能描述：从 proposal.md 提取摘要写入 input.md
   - 写入 proposal_id，供 /tpd:dev 自动衔接

---

## Phase 2: 载入 OpenSpec 提案

1. thinking 阶段已直接写入 openspec/；plan 阶段仅基于 OpenSpec 正式内容执行。

2. 读取提案：

```
/openspec:proposal ${PROPOSAL_ID}
```

3. 将提案内容写入 `${PLAN_DIR}/proposal.md`（用于后续汇总）

---

## Phase 3: 需求解析（可选但推荐）

**立即调用 Skill 工具：**

```
Skill(skill="tpd:requirement-parser", args="run_dir=${PLAN_DIR}")
```

**验证**：确认 `${PLAN_DIR}/requirements.md` 已生成

---

## Phase 4: 上下文检索

**立即调用 Skill 工具：**

```
Skill(skill="tpd:plan-context-retriever", args="run_dir=${PLAN_DIR}")
```

**验证**：确认 `${PLAN_DIR}/context.md` 已生成

---

## Phase 5: 多模型实现分析（必须）

**并行调用 MCP：**

```
mcp__codex__codex: "Analyze proposal ${PROPOSAL_ID}: Provide implementation approach, identify technical risks, and suggest alternative architectures. Focus on edge cases and failure modes."

mcp__gemini__gemini: "Analyze proposal ${PROPOSAL_ID}: Evaluate from maintainability, scalability, and integration perspectives. Highlight potential conflicts with existing systems."
```

**输出**：
- `${PLAN_DIR}/analysis-codex.md`
- `${PLAN_DIR}/analysis-gemini.md`

**⏸️ 硬停止**：AskUserQuestion 展示核心差异与建议，确认后继续

---

## Phase 6: 多模型歧义消除审计（必须）

**并行调用 MCP：**

```
mcp__codex__codex: "Review proposal ${PROPOSAL_ID} for decision points that remain unspecified. List each as: [AMBIGUITY] <description> → [REQUIRED CONSTRAINT] <what must be decided>."

mcp__gemini__gemini: "Identify implicit assumptions in proposal ${PROPOSAL_ID}. For each assumption, specify: [ASSUMPTION] <description> → [EXPLICIT CONSTRAINT NEEDED] <concrete specification>."
```

**输出**：`${PLAN_DIR}/ambiguities.md`

**⏸️ 硬停止**：必须使用 AskUserQuestion 逐条确认，将结论写入 `${PLAN_DIR}/constraints.md`

**若无法消除歧义**：返回 /tpd:thinking 或终止

---

## Phase 7: 多模型 PBT 属性提取（必须）

**并行调用 MCP：**

```
mcp__codex__codex: "Extract Property-Based Testing properties from proposal ${PROPOSAL_ID}. For each requirement, identify: [INVARIANT] <property> → [FALSIFICATION STRATEGY] <how to generate counterexamples>."

mcp__gemini__gemini: "Analyze proposal ${PROPOSAL_ID} for system properties. Define: [PROPERTY] <name> | [DEFINITION] <formal description> | [BOUNDARY CONDITIONS] <edge cases> | [COUNTEREXAMPLE GENERATION] <approach>."
```

**输出**：`${PLAN_DIR}/pbt.md`

---

## Phase 8: 多模型规划细化（可并行）

根据 task_type 调用：

```
Skill(skill="tpd:codex-planner", args="run_dir=${PLAN_DIR}")
Skill(skill="tpd:gemini-planner", args="run_dir=${PLAN_DIR}")
```

**验证**：`codex-plan.md` / `gemini-plan.md`

---

## Phase 9: 架构整合

```
Skill(skill="tpd:architecture-analyzer", args="run_dir=${PLAN_DIR} task_type=${TASK_TYPE}")
```

**验证**：`architecture.md`

---

## Phase 10: 任务分解

```
Skill(skill="tpd:task-decomposer", args="run_dir=${PLAN_DIR}")
```

**验证**：`tasks.md`

---

## Phase 11: 风险评估

```
Skill(skill="tpd:risk-assessor", args="run_dir=${PLAN_DIR}")
```

**验证**：`risks.md`

---

## Phase 12: 计划整合

```
Skill(skill="tpd:plan-synthesizer", args="run_dir=${PLAN_DIR}")
```

**验证**：`plan.md`

**⏸️ 硬停止**：AskUserQuestion 获取计划批准

---

## Phase 13: OpenSpec 校验

```bash
openspec validate ${PROPOSAL_ID} --strict
```

若失败：

```bash
openspec show ${PROPOSAL_ID} --json --deltas-only
```

---

## Phase 14: 交付 / 衔接

输出完成摘要：

```
🎉 规划任务完成！

📋 提案: ${PROPOSAL_ID}
🔀 类型: ${TASK_TYPE}
📁 产物:
  ${PLAN_DIR}/
  ├── input.md
  ├── proposal.md
  ├── requirements.md
  ├── context.md
  ├── analysis-codex.md
  ├── analysis-gemini.md
  ├── ambiguities.md
  ├── constraints.md
  ├── pbt.md
  ├── codex-plan.md
  ├── gemini-plan.md
  ├── architecture.md
  ├── tasks.md
  ├── risks.md
  └── plan.md

🚀 后续操作：
/tpd:dev --proposal-id=${PROPOSAL_ID}
```

### 循环模式（--loop）

用户批准后**自动衔接**到 /tpd:dev：

```
/tpd:dev --proposal-id=${PROPOSAL_ID}
```
