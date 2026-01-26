---
description: "深度思考工作流：复杂度评估 → 上下文边界探索 → 约束整合 → 结论生成 → 交接摘要。支持 auto/light/deep/ultra。"
argument-hint: "[--depth=auto|light|deep|ultra] [--parallel] [--verbose] <问题描述>"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Write
  - Bash
  - Task
  - mcp__sequential-thinking__sequentialthinking
  - mcp__auggie-mcp__codebase-retrieval
---

# /tpd:thinking - 深度思考工作流命令

## 概述

整合 Claude Code ultrathink、Codex-CLI reasoning 和 Gemini Deep Think 三种思考模式，提供多层次、多视角的深度分析能力。

**核心特性**：

- **智能路由**：根据问题复杂度自动选择思考深度
- **多边界并行**：按上下文边界并行探索，形成约束集合
- **多模型补充**：Codex/Gemini 提供约束与风险补充视角
- **思考可视化**：完整展示推理链和思考过程
- **结论整合**：综合多模型输出，生成高质量结论

---

## 核心哲学（对齐 GudaSpec Research）

- **产物是约束集**：输出“约束集合 + 可验证成功判据”，不是信息堆砌
- **收敛方向**：约束用于“排除方向”，让后续 plan 能零决策执行
- **不做架构决策**：只暴露约束、风险与待确认问题
- **OpenSpec 规则**：thinking 阶段**直接写入 `openspec/` 规范**，不修改项目代码

## Guardrails（必须遵守）

- **禁止按角色拆分子代理**（例如“架构师/安全专家”）
- **必须按上下文边界拆分**（模块/目录/域）
- **必须使用 `mcp__auggie-mcp__codebase-retrieval`** 做语义检索
- **子代理输出必须统一 JSON 模板**（见 Phase 3）
- **禁止修改项目代码**（允许写入 `openspec/` 规范文件）

---

## 🚨🚨🚨 强制执行规则（不可跳过）

**你必须按照下面的 Phase 顺序，使用 Skill 工具调用对应的 skill。**

**禁止行为（违反则工作流失败）：**

- ❌ 跳过 Skill 调用，自己直接分析
- ❌ 省略任何 Phase
- ❌ 未按上下文边界进行探索（deep/ultra 必须并行）
- ❌ 不使用 sequential-thinking 进行结构化推理
- ❌ 修改项目业务代码（允许写入 `openspec/` 规范文件）

**每个 Phase 你必须：**

1. 调用指定的 Skill（使用 Skill 工具）
2. 等待 Skill 执行完成
3. **验证输出文件存在**
4. 再进入下一个 Phase

### 执行模型

```
┌─────────────────────────────────────────────────────────────────┐
│  自动执行（无需询问）    │  硬停止（必须询问）                  │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1 → Phase 2      │  ⏸️ Phase 2: 深度确认（可选）        │
│  Phase 3 → Phase 4      │  ⏸️ Phase 4: 约束澄清（如有疑问）     │
│  Phase 4 → Phase 5      │  ⏸️ Phase 5: 结论确认（ultra 模式）  │
│  Phase 5 → Phase 6      │                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 阶段流程

```
Phase 1: 初始化        → 创建 THINKING_DIR，解析参数
Phase 2: 复杂度评估    → Skill("complexity-analyzer")
                       → 如未指定 --depth，自动路由或询问用户
Phase 3: 上下文探索    → 语义检索 + 边界拆分 + 子代理并行探索 + 多模型约束分析
Phase 4: 约束整合      → Skill("thought-synthesizer")
                       → 汇总约束/风险/依赖/成功判据
Phase 5: 结论生成      → Skill("conclusion-generator")
                       → 生成推理链和最终结论
Phase 6: 交付          → 输出思考报告
```

> 如需完整推理链或原始输出，请使用 `--verbose` 或直接查看 run_dir 内文件。

---

## Phase 1: 初始化

### 参数解析

| 选项            | 说明                         | 默认值 |
| --------------- | ---------------------------- | ------ |
| `--depth=value` | 思考深度 (auto/light/deep/ultra) | auto |
| `--parallel`    | 强制多模型并行（即使 light） | false  |
| `--verbose`     | 详细输出思考过程             | false  |

### 解析逻辑

```bash
# 初始化选项
DEPTH="auto"
PARALLEL=false
VERBOSE=false

# 解析各选项
[[ "$ARGUMENTS" =~ --depth=([^ ]+) ]] && DEPTH="${BASH_REMATCH[1]}"
[[ "$ARGUMENTS" =~ --parallel ]] && PARALLEL=true
[[ "$ARGUMENTS" =~ --verbose ]] && VERBOSE=true

# 提取问题描述
QUESTION=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
```

### OpenSpec 状态检查（必须）

在 thinking 阶段也必须绑定 OpenSpec：

```bash
openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
```

若未初始化 OpenSpec：

- 提示用户先执行 `/tpd:init`
- 完成后再继续 Phase 2

### 生成 proposal_id（仅用于产物路径，不作为流程串联）

```bash
RAW_SLUG=$(echo "$QUESTION" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g')
SHORT_ID=$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 6)

if [[ -n "$RAW_SLUG" ]] && [[ "$RAW_SLUG" =~ ^[a-z][a-z0-9-]{2,50}$ ]]; then
  PROPOSAL_ID="$RAW_SLUG"
else
  PROPOSAL_ID="add-${SHORT_ID}"
fi
```

### 运行目录创建（固定路径，位于 OpenSpec 之下）

```bash
THINKING_ID=$(date -u +%Y%m%dT%H%M%SZ)
THINKING_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/thinking"
mkdir -p "$THINKING_DIR"

```
**说明**：THINKING_ID 仅写入 state.json 作为记录，不参与路径与流程串联

### 创建状态文件

```bash
cat > "${THINKING_DIR}/state.json" << EOF
{
  "domain": "thinking",
  "workflow_id": "${THINKING_ID}",
  "proposal_id": "${PROPOSAL_ID}",
  "question": "${QUESTION}",
  "options": {
    "depth": "${DEPTH}",
    "parallel": ${PARALLEL},
    "verbose": ${VERBOSE}
  },
  "phases": [
    {"id": "initialization", "status": "completed"},
    {"id": "complexity-analysis", "status": "pending"},
    {"id": "multi-model-thinking", "status": "pending"},
    {"id": "thought-synthesis", "status": "pending"},
    {"id": "conclusion-generation", "status": "pending"},
    {"id": "delivery", "status": "pending"}
  ],
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "$QUESTION" > "${THINKING_DIR}/input.md"
```

**🚨 完成后立即执行 Phase 2！**

---

## Phase 2: 复杂度评估

### 🚨🚨🚨 强制执行 🚨🚨🚨

**立即调用 Skill：**

```
Skill(skill="tpd:complexity-analyzer", args="run_dir=${THINKING_DIR}")
```

**Skill 执行内容**：

1. 使用 `mcp__sequential-thinking__sequentialthinking` 分析问题
2. 评估复杂度维度：
   - 问题长度和结构
   - 领域深度
   - 推理步骤数
   - 歧义程度
3. 输出复杂度评分和建议深度

**验证**：确认 `${THINKING_DIR}/complexity-analysis.md` 已生成

### 深度路由规则（仅当 `DEPTH=auto` 时生效）

| 复杂度评分 | 建议深度 | 触发条件                             |
| ---------- | -------- | ------------------------------------ |
| 1-3        | light    | 简单问答、事实查询、单步骤任务       |
| 4-6        | deep     | 需要推理、对比分析、中等复杂度设计   |
| 7-10       | ultra    | 复杂架构、多步骤推理、需要多领域知识 |

### 关键词触发（覆盖自动路由）

| 用户输入关键词                       | 强制深度 |
| ------------------------------------ | -------- |
| "想一想"、"think"、"简单分析"        | light    |
| "仔细想"、"think hard"、"深入分析"   | deep     |
| "深度分析"、"ultrathink"、"全面分析" | ultra    |

### ⏸️ 可选硬停止

**如果 `--depth=auto` 且复杂度评分在 4-6 之间**，使用 AskUserQuestion：

```
问题: 建议使用 Deep 思考模式，是否确认？
选项:
  - Deep 思考（推荐）- 多模型并行，30-60秒
  - Light 思考 - 快速响应，5-15秒
  - Ultra 思考 - 最深度分析，60-180秒
```

**🚨 确认后立即执行 Phase 3！**

---

## Phase 3: 上下文边界探索 + 多模型分析（对齐 Research）

### 🚨🚨🚨 强制执行 - 核心阶段 🚨🚨🚨

**目标**：按上下文边界探索代码库，输出**约束集合**，并用多模型补充约束/风险/成功判据。

### Step 3.1 初步评估（必须使用 auggie）

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "快速识别本项目的主要模块/目录边界、核心领域与配置范围，用于拆分上下文边界探索。"
})
```

### Step 3.2 定义上下文边界（禁止按角色拆分）

**边界示例（仅示例，必须结合代码库）：**

- user-domain（用户相关模型/服务/UI）
- auth-session（鉴权/会话/中间件）
- config-infra（配置/部署/构建脚本）

**将边界列表写入**：`${THINKING_DIR}/boundaries.json`

示例结构：

```json
{
  "boundaries": [
    { "id": "user-domain", "scope": "用户相关模型/服务/UI" },
    { "id": "auth-session", "scope": "鉴权/会话/中间件" }
  ]
}
```

**决策原则**：

- 若代码跨多个子目录/模块 → **必须并行**拆分边界
- 若规模很小/单目录 → 可仅保留 1 个核心边界

### Step 3.3 子代理并行探索（统一 JSON 模板）

**统一输出模板（必须一致）**：

```json
{
  "module_name": "string - context boundary explored",
  "existing_structures": ["..."],
  "existing_conventions": ["..."],
  "constraints_discovered": ["..."],
  "open_questions": ["..."],
  "dependencies": ["..."],
  "risks": ["..."],
  "success_criteria_hints": ["..."]
}
```

#### Light 模式（单边界）

```
Skill(skill="tpd:context-explorer", args="run_dir=${THINKING_DIR} boundary=<boundaries[0].id>")
```

#### Deep/Ultra 模式（多边界并行）

> 以下仅示例，实际边界必须以 `boundaries.json` 为准。

```
Task(
  subagent_type="general-purpose",
  description="Explore boundary: user-domain",
  prompt="Skill(skill=\\\"tpd:context-explorer\\\", args=\\\"run_dir=${THINKING_DIR} boundary=user-domain scope=用户相关模型/服务/UI\\\")",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Explore boundary: auth-session",
  prompt="Skill(skill=\\\"tpd:context-explorer\\\", args=\\\"run_dir=${THINKING_DIR} boundary=auth-session scope=鉴权/会话/中间件\\\")",
  run_in_background=true
)

Task(
  subagent_type=\"general-purpose\",
  description=\"Explore boundary: config-infra\",
  prompt=\"Skill(skill=\\\"tpd:context-explorer\\\", args=\\\"run_dir=${THINKING_DIR} boundary=config-infra scope=配置/部署/构建脚本\\\")\",
  run_in_background=true
)
```

### Step 3.4 多模型约束分析（Deep/Ultra 必须执行）

**原则**：仅做约束/风险/成功判据分析，**禁止生成代码或修改项目**。

```
Task(
  subagent_type="general-purpose",
  description="Codex constraints analysis",
  prompt="Skill(skill=\\\"tpd:codex-thinker\\\", args=\\\"run_dir=${THINKING_DIR} level=low\\\")",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Gemini constraints analysis",
  prompt="Skill(skill=\\\"tpd:gemini-thinker\\\", args=\\\"run_dir=${THINKING_DIR} level=medium\\\")",
  run_in_background=true
)
```

Light 模式可跳过；如需多模型补充，使用 `--parallel` 强制执行。

### 验证检查清单

**Phase 3 完成后，验证：**

- [ ] `${THINKING_DIR}/boundaries.json` 已生成
- [ ] `${THINKING_DIR}/explore-*.json` 至少 1 个
- [ ] Deep/Ultra：`${THINKING_DIR}/codex-thought.md` 与 `${THINKING_DIR}/gemini-thought.md` 已生成
- [ ] 输出 JSON 符合模板

**🚨 验证通过后立即执行 Phase 4！**

---

## Phase 4: 约束整合

### 🚨🚨🚨 强制执行 🚨🚨🚨

**立即调用 Skill：**

```
Skill(skill="tpd:thought-synthesizer", args="run_dir=${THINKING_DIR} depth=${DEPTH}")
```

**Skill 执行内容**：

1. 读取 `${THINKING_DIR}/explore-*.json`（核心输入）
2. 如存在 \*-thought.md，可作为补充视角
3. 使用 sequential-thinking 进行结构化整合：
   - 汇总硬/软约束
   - 归纳开放问题与歧义点
   - 汇总依赖与风险
   - 形成可验证成功判据线索
4. 生成整合报告（synthesis.md）

**验证**：确认 `${THINKING_DIR}/synthesis.md` 已生成

**⏸️ 约束澄清硬停止**：

- 若 synthesis.md 中存在 open_questions，必须使用 AskUserQuestion 进行澄清
- 将用户回答写入 `${THINKING_DIR}/clarifications.md`

**🚨 确认后执行 Phase 5！**

---

## Phase 5: 结论生成

### 🚨🚨🚨 强制执行 🚨🚨🚨

**立即调用 Skill：**

```
Skill(skill="tpd:conclusion-generator", args="run_dir=${THINKING_DIR}")
```

**Skill 执行内容**：

1. 基于整合结果生成最终结论
2. 构建完整推理链
3. 标注置信度
4. 列出关键假设和限制

**验证**：确认 `${THINKING_DIR}/conclusion.md` 已生成

### ⏸️ Ultra 模式硬停止

**如果是 Ultra 模式**，展示结论摘要并询问：

```
问题: 深度分析完成，是否需要进一步探索某个方向？
选项:
  - 接受当前结论
  - 深入分析分歧点
  - 探索替代方案
```

**🚨 确认后执行 Phase 6！**

---

## Phase 6: 交接与交付

### 🚨🚨🚨 强制执行 🚨🚨🚨

**立即调用 Skill：**

```
Skill(skill="tpd:handoff-generator", args="run_dir=${THINKING_DIR}")
```

**验证**：确认 `${THINKING_DIR}/handoff.md` 与 `${THINKING_DIR}/handoff.json` 已生成

---

### 输出完成摘要（默认简洁，避免占用上下文）

```
🧠 深度思考完成！

📋 问题: ${QUESTION}
📋 提案: ${PROPOSAL_ID}
🔬 思考深度: ${DEPTH}
⏱️ 耗时: ${ELAPSED_TIME}

📊 思考指标:
- 模型参与: ${MODEL_COUNT} 个
- 推理步骤: ${REASONING_STEPS} 步
- 置信度: ${CONFIDENCE}%

🎯 核心结论:
${CONCLUSION_SUMMARY}

📦 交接摘要:
- 约束: 见 ${THINKING_DIR}/handoff.md
- 非目标: 见 ${THINKING_DIR}/handoff.md
- 成功判据: 见 ${THINKING_DIR}/handoff.md
- 验收标准: 见 ${THINKING_DIR}/handoff.md

➡️ 下一阶段建议:
1) /tpd:plan
2) OpenSpec 路径与 proposal_id 见 ${THINKING_DIR}/handoff.json（已写入 openspec/）
3) 计划完成后进入 /tpd:dev 或 /refactor

💡 控制上下文建议: 完成 thinking 后可使用 `/clear` 开启新会话再进入 plan。

📁 产物:
  ${THINKING_DIR}/
  ├── input.md                # 原始问题
  ├── complexity-analysis.md  # 复杂度评估
  ├── boundaries.json         # 边界列表
  ├── explore-*.json           # 边界探索输出（多份）
  ├── synthesis.md            # 约束整合
  ├── clarifications.md       # 用户澄清（若有）
  ├── codex-thought.md        # Codex 约束补充（deep/ultra）
  ├── gemini-thought.md       # Gemini 约束补充（deep/ultra）
  ├── conclusion.md           # 最终结论
  ├── handoff.md              # 交接摘要
  └── handoff.json            # 交接结构化数据
```

OpenSpec 规范会写入：

```
openspec/changes/${PROPOSAL_ID}/
```

---

## 思考深度对比

| 特性         | Light           | Deep               | Ultra                  |
| ------------ | --------------- | ------------------ | ---------------------- |
| 边界数量     | 1               | 2-3                | 3-5                    |
| 并行子代理   | 无/少量         | 中等并行           | 高并行                 |
| 预期耗时     | 5-15s           | 30-60s             | 60-180s                |
| 适用场景     | 简单需求/小改动 | 中等复杂度需求     | 复杂架构/多模块需求     |

---

## 运行目录结构

```
openspec/changes/<proposal_id>/artifacts/thinking/
├── state.json               # 工作流状态
├── input.md                 # 原始问题
├── complexity-analysis.md   # Phase 2 产出
├── claude-thought.md        # Phase 3 产出
├── codex-thought.md         # Phase 3 产出（deep/ultra）
├── gemini-thought.md        # Phase 3 产出（deep/ultra）
├── synthesis.md             # Phase 4 产出
├── conclusion.md            # Phase 5 产出
├── handoff.md               # Phase 6 产出
└── handoff.json             # Phase 6 产出
```

---

## 错误处理

### 模型调用失败

```
⚠️ ${MODEL} 思考失败

错误: ${ERROR_MESSAGE}

处理:
- 使用其他模型结果继续
- 在 synthesis.md 中标注缺失视角
```

### 思考超时

```
⚠️ 思考超时

已完成模型: ${COMPLETED_MODELS}
超时模型: ${TIMEOUT_MODELS}

建议:
1. 降低思考深度
2. 简化问题
3. 分步骤思考
```

---

## 约束

- 不跳过复杂度评估（Phase 2）
- Deep/Ultra 模式必须多模型并行
- 每个 Phase 必须调用对应的 Skill
- 使用 sequential-thinking 进行结构化推理
- 最终结论必须标注置信度
