---
name: context-explorer
description: |
  【触发条件】thinking 工作流 Phase 3：按上下文边界探索代码库
  【核心产出】输出 ${run_dir}/explore-<boundary>.json
  【🚨强制工具🚨】必须使用 auggie-mcp 做语义检索
  【不触发】仅要求纯主观分析
  【先问什么】无需询问，自动执行
allowed-tools:
  - Read
  - Write
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径
  - name: boundary
    type: string
    required: true
    description: 上下文边界名称（kebab-case）
  - name: scope
    type: string
    required: false
    description: 边界范围说明（可选）
---

# Context Explorer - 上下文边界探索原子技能

## 职责边界

在指定上下文边界内完成代码库探索，输出结构化约束集，不做方案设计或代码修改。

- **输入**: `${run_dir}/input.md` + `boundary` + `scope(可选)`
- **输出**: `${run_dir}/explore-${boundary}.json`
- **核心能力**: 语义检索、约束提炼、风险与依赖识别
- **写入范围**: 仅允许写入 `${run_dir}`（位于 OpenSpec 产物目录），禁止修改项目业务代码与其他 OpenSpec 规范

---

## 🚨 CRITICAL: 强制工具使用规则

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 上下文探索                                                   │
│     ✅ 必须使用: mcp__auggie-mcp__codebase-retrieval             │
│     ✅ 必须使用: mcp__sequential-thinking__sequentialthinking    │
│     ❌ 禁止行为: 仅凭直觉输出、跳过语义检索                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 输出模板（严格遵循）

```json
{
  "module_name": "<boundary>",
  "existing_structures": ["..."],
  "existing_conventions": ["..."],
  "constraints_discovered": ["..."],
  "open_questions": ["..."],
  "dependencies": ["..."],
  "risks": ["..."],
  "success_criteria_hints": ["..."]
}
```

---

## 执行流程

### Step 0: 结构化检索规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划检索策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划上下文探索策略。需要：1) 读取需求 2) 明确边界范围 3) 设计检索问题 4) 提炼约束与风险 5) 形成结构化 JSON 输出",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: 读取输入

```
Read("${run_dir}/input.md")
```

### Step 2: 语义检索（必须使用 auggie-mcp）

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "在边界 <boundary> 内检索相关代码与结构。请返回：关键模块/文件、既有模式、约束、依赖、风险、潜在成功判据线索。"
})
```

> 若提供 scope，请在检索问题中体现。

### Step 3: 提炼约束与风险（sequential-thinking）

```
mcp__sequential-thinking__sequentialthinking({
  thought: "基于检索结果，整理 existing_structures / existing_conventions / constraints_discovered / dependencies / risks / open_questions / success_criteria_hints。",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 4: 输出 JSON

**输出路径**：`${run_dir}/explore-${boundary}.json`

```
Write("${run_dir}/explore-${boundary}.json", <JSON>)
```

---

## 质量门控

- [ ] 已调用 `mcp__auggie-mcp__codebase-retrieval`
- [ ] 输出 JSON 严格符合模板
- [ ] 未修改任何项目代码
