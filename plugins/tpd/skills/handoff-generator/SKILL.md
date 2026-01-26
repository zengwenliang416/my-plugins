---
name: handoff-generator
description: |
  【触发条件】thinking 工作流 Phase 6：生成交接摘要与结构化产物
  【核心产出】输出 ${run_dir}/handoff.md 与 ${run_dir}/handoff.json
  【不触发】无
  【先问什么】无需询问，自动执行
  【🚨 强制】必须读取 input.md/synthesis.md/conclusion.md/state.json
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径
---

# Handoff Generator - 交接产物生成原子技能

## MCP 工具集成

| MCP 工具              | 用途                     | 触发条件        |
| --------------------- | ------------------------ | --------------- |
| `sequential-thinking` | 结构化抽取交接要素       | 🚨 每次执行必用 |

## 职责边界

将 thinking 的结论与整合结果转化为可交接的**约束集 + 可验证判据**，用于后续 plan 阶段。

- **输入**: `${run_dir}/input.md`、`${run_dir}/synthesis.md`、`${run_dir}/conclusion.md`、`${run_dir}/state.json`
- **输出**: `${run_dir}/handoff.md`、`${run_dir}/handoff.json`
- **核心能力**: 约束提炼、非目标澄清、成功判据与验收标准结构化
- **写入范围**: 允许写入 `openspec/` 规范文件；禁止修改项目代码

---

## 🚨 CRITICAL: 强制工具使用规则

```
┌─────────────────────────────────────────────────────────────────┐
│  🤝 交接产物                                                     │
│     ✅ 必须使用: mcp__sequential-thinking__sequentialthinking   │
│     ❌ 禁止行为: 直接输出结论不提炼交接要素                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 执行流程

### Step 0: 结构化提炼规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划提炼策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划交接提炼策略。需要：1) 读取输入与结论 2) 提炼约束 3) 明确非目标 4) 生成成功判据 5) 定义验收标准 6) 生成英文任务名与 proposal_id 7) 生成 OpenSpec 规范并写入 openspec/（不修改业务代码）",
  thoughtNumber: 1,
  totalThoughts: 7,
  nextThoughtNeeded: true
})
```

### Step 1: 读取输入与状态

```
Read("${run_dir}/state.json")
Read("${run_dir}/input.md")
Read("${run_dir}/synthesis.md")
Read("${run_dir}/conclusion.md")
Read("${run_dir}/boundaries.json")
Read("${run_dir}/explore-<boundary>.json")
Read("${run_dir}/clarifications.md")
```

### Step 2: 提炼交接要素（sequential-thinking）

```
mcp__sequential-thinking__sequentialthinking({
  thought: "第 1 步：从 explore-*.json 与 synthesis 中提炼【约束】与其来源（硬/软约束）。",
  thoughtNumber: 2,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 2 步：识别【非目标】与明确排除项，避免后续阶段扩散。",
  thoughtNumber: 3,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 3 步：形成【成功判据】（可观察结果），强调可验证性。",
  thoughtNumber: 4,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 4 步：定义【验收标准】（可执行检查），与成功判据区分。",
  thoughtNumber: 5,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 5 步：补充待确认问题与风险（若存在），保持简洁。",
  thoughtNumber: 6,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 6 步：生成或复用英文任务名与 proposal_id（动词开头、kebab-case）。若 state.json 已存在 proposal_id，需校验并复用。",
  thoughtNumber: 7,
  totalThoughts: 7,
  nextThoughtNeeded: true
})

mcp__sequential-thinking__sequentialthinking({
  thought: "第 7 步：生成 OpenSpec 规范并写入 openspec/changes（不修改业务代码）。",
  thoughtNumber: 7,
  totalThoughts: 7,
  nextThoughtNeeded: false
})
```

### Step 3: 生成或复用英文任务名与 proposal_id（规则）

**规则**：

- 动词前缀选择（按语义）：
  - 新增/添加/支持 → `add`
  - 更新/修改/优化 → `update`
  - 删除/移除 → `remove`
  - 重构/整理 → `refactor`
  - 迁移/替换 → `migrate`
  - 集成/接入 → `integrate`
  - 修复/纠错 → `fix`
- 生成英文短语（2-6 词），以名词短语为主
- 组合为 `verb-noun-phrase`，全小写，kebab-case
- 允许使用结论摘要中的英文关键词
- 校验正则：`^[a-z][a-z0-9-]{2,50}$`
- 若 state.json 已存在 `proposal_id`：必须复用，并校验正则 `^[a-z][a-z0-9-]{2,50}$`
- 若缺失且无法生成：`add-{{short_id}}`（仅作为 fallback，short_id 为 4-6 位随机字母数字）

**输出**：

- `proposal_title`（英文标题）
- `proposal_id`（kebab-case）

### Step 4: 生成 OpenSpec 规范（写入 openspec/）

**原则**：thinking 阶段**直接写入项目 `openspec/` 目录**，不修改业务代码。

**前置检查**：

```
if [ ! -d "openspec" ]; then
  echo "OpenSpec not initialized. 请先执行 /tpd:init"
  exit 1
fi
```

**目标路径**：

- `openspec/project.md`
- `openspec/AGENTS.md`
- `openspec/changes/{{proposal_id}}/proposal.md`
- `openspec/changes/{{proposal_id}}/tasks.md`
- `openspec/changes/{{proposal_id}}/specs/{{capability_id}}/spec.md`

**capability_id 默认规则**：

- 未显式指定时，`capability_id = proposal_id`

**模板**：使用 `assets/openspec.*.template.md`

### Step 5: 生成 handoff.md

**输出路径**：`${run_dir}/handoff.md`

**模板**：参考 `assets/handoff.template.md`

### Step 6: 生成 handoff.json

**输出路径**：`${run_dir}/handoff.json`

**同时更新 state.json**：写入 `proposal_id`

```bash
tmp_file="${run_dir}/state.json.tmp"
jq --arg proposal_id "$proposal_id" '.proposal_id=$proposal_id' "${run_dir}/state.json" > "$tmp_file" && mv "$tmp_file" "${run_dir}/state.json"
```

**JSON 结构**：

```json
{
  "source": "thinking",
  "proposal_id": "add-some-feature",
  "summary": "一句话结论",
  "summary_en": "add some feature",
  "约束": {
    "硬约束": ["..."],
    "软约束": ["..."]
  },
  "非目标": ["..."],
  "成功判据": ["..."],
  "验收标准": ["..."],
  "constraints": {
    "hard": ["..."],
    "soft": ["..."]
  },
  "non_goals": ["..."],
  "success_criteria": ["..."],
  "acceptance_criteria": ["..."],
  "open_questions": ["..."],
  "risks": ["..."],
  "paths": {
    "openspec_root": "openspec",
    "openspec_proposal": "openspec/changes/<proposal_id>/proposal.md",
    "openspec_tasks": "openspec/changes/<proposal_id>/tasks.md",
    "openspec_spec": "openspec/changes/<proposal_id>/specs/<capability_id>/spec.md"
  }
}
```

---

## 质量门控

### 工具使用验证

- [ ] 调用了 `mcp__sequential-thinking__sequentialthinking` 至少 7 次
- [ ] 读取了 input/synthesis/conclusion/state 四个文件
- [ ] 产出 handoff.md 与 handoff.json
- [ ] index.json 已更新 latest 指针
