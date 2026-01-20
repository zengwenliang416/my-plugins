---
description: "深度思考工作流：复杂度评估 → 智能路由 → 多模型并行思考 → 思考整合 → 结论生成。支持三种思考深度（light/deep/ultra）。"
argument-hint: "[--depth=light|deep|ultra] [--parallel] [--verbose] <问题描述>"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Write
  - Bash
  - Task
  - mcp__sequential-thinking__sequentialthinking
---

# /thinking - 深度思考工作流命令

## 概述

整合 Claude Code ultrathink、Codex-CLI reasoning 和 Gemini Deep Think 三种思考模式，提供多层次、多视角的深度分析能力。

**核心特性**：

- **智能路由**：根据问题复杂度自动选择思考深度
- **多模型并行**：获得 Claude、Codex、Gemini 三种不同视角
- **思考可视化**：完整展示推理链和思考过程
- **结论整合**：综合多模型输出，生成高质量结论

---

## 🚨🚨🚨 强制执行规则（不可跳过）

**你必须按照下面的 Phase 顺序，使用 Skill 工具调用对应的 skill。**

**禁止行为（违反则工作流失败）：**

- ❌ 跳过 Skill 调用，自己直接分析
- ❌ 省略任何 Phase
- ❌ 在 deep/ultra 模式下跳过多模型并行思考
- ❌ 不使用 sequential-thinking 进行结构化推理

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
│  Phase 3 → Phase 4      │  ⏸️ Phase 6: 结论确认（ultra 模式）  │
│  Phase 4 → Phase 5      │                                      │
│  Phase 5 → Phase 6      │                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 阶段流程

```
Phase 1: 初始化        → 创建 RUN_DIR，解析参数
Phase 2: 复杂度评估    → Skill("complexity-analyzer")
                       → 如未指定 --depth，自动路由或询问用户
Phase 3: 多模型思考    → 根据深度并行执行：
                       │ Light: Claude 默认思考
                       │ Deep:  Claude megathink + Codex low + Gemini medium
                       │ Ultra: Claude ultrathink + Codex high + Gemini high
Phase 4: 思考整合      → Skill("thought-synthesizer")
                       → 整合多模型输出
Phase 5: 结论生成      → Skill("conclusion-generator")
                       → 生成推理链和最终结论
Phase 6: 交付          → 输出思考报告
```

---

## Phase 1: 初始化

### 参数解析

| 选项            | 说明                         | 默认值 |
| --------------- | ---------------------------- | ------ |
| `--depth=value` | 思考深度 (light/deep/ultra)  | ultra  |
| `--parallel`    | 强制多模型并行（即使 light） | false  |
| `--verbose`     | 详细输出思考过程             | false  |
| `--run-id=<id>` | 使用指定 run-id（断点续传）  | -      |

### 解析逻辑

```bash
# 初始化选项
DEPTH="ultra"
PARALLEL=false
VERBOSE=false

# 解析各选项
[[ "$ARGUMENTS" =~ --depth=([^ ]+) ]] && DEPTH="${BASH_REMATCH[1]}"
[[ "$ARGUMENTS" =~ --parallel ]] && PARALLEL=true
[[ "$ARGUMENTS" =~ --verbose ]] && VERBOSE=true

# 提取问题描述
QUESTION=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
```

### 运行目录创建

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/thinking/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/thinking/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

### 创建状态文件

```bash
if [ "$MODE" = "new" ]; then
    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "thinking",
  "workflow_id": "${RUN_ID}",
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

    echo "$QUESTION" > "${RUN_DIR}/input.md"
fi
```

**🚨 完成后立即执行 Phase 2！**

---

## Phase 2: 复杂度评估

### 🚨🚨🚨 强制执行 🚨🚨🚨

**立即调用 Skill：**

```
Skill(skill="thinking:complexity-analyzer", args="run_dir=${RUN_DIR}")
```

**Skill 执行内容**：

1. 使用 `mcp__sequential-thinking__sequentialthinking` 分析问题
2. 评估复杂度维度：
   - 问题长度和结构
   - 领域深度
   - 推理步骤数
   - 歧义程度
3. 输出复杂度评分和建议深度

**验证**：确认 `${RUN_DIR}/complexity-analysis.md` 已生成

### 深度路由规则

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

## Phase 3: 多模型并行思考

### 🚨🚨🚨 强制执行 - 核心阶段 🚨🚨🚨

**根据确定的深度，执行不同的思考策略：**

### Light 模式

**单模型快速思考**：

```
# 使用 sequential-thinking 进行结构化推理
mcp__sequential-thinking__sequentialthinking({
  thought: "分析问题：${QUESTION}...",
  thoughtNumber: 1,
  totalThoughts: 3,
  nextThoughtNeeded: true
})
```

**产出**：`${RUN_DIR}/claude-thought.md`

### Deep 模式

**三模型并行思考**：

```
# 并行启动三个思考任务
Task(
  subagent_type="general-purpose",
  description="Claude megathink analysis",
  prompt="Skill(skill=\"thinking:codex-thinker\", args=\"run_dir=${RUN_DIR} level=low\")",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Gemini deep think analysis",
  prompt="Skill(skill=\"thinking:gemini-thinker\", args=\"run_dir=${RUN_DIR} level=medium\")",
  run_in_background=true
)

# Claude 主线程使用 megathink（10k tokens）
# 在 prompt 中包含 "think hard" 或 "仔细想" 触发
```

**产出**：

- `${RUN_DIR}/claude-thought.md`
- `${RUN_DIR}/codex-thought.md`
- `${RUN_DIR}/gemini-thought.md`

### Ultra 模式

**三模型最大深度并行**：

```
# 并行启动，使用最高配置
Task(
  subagent_type="general-purpose",
  description="Codex high reasoning",
  prompt="Skill(skill=\"thinking:codex-thinker\", args=\"run_dir=${RUN_DIR} level=high\")",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Gemini high deep think",
  prompt="Skill(skill=\"thinking:gemini-thinker\", args=\"run_dir=${RUN_DIR} level=high\")",
  run_in_background=true
)

# Claude 主线程使用 ultrathink（32k tokens）
# 在 prompt 中包含 "ultrathink" 或 "深度分析" 触发
```

### 验证检查清单

**Phase 3 完成后，验证：**

- [ ] Light: `${RUN_DIR}/claude-thought.md` 存在
- [ ] Deep/Ultra: 上述 + `codex-thought.md` + `gemini-thought.md`

**🚨 验证通过后立即执行 Phase 4！**

---

## Phase 4: 思考整合

### 🚨🚨🚨 强制执行 🚨🚨🚨

**立即调用 Skill：**

```
Skill(skill="thinking:thought-synthesizer", args="run_dir=${RUN_DIR} depth=${DEPTH}")
```

**Skill 执行内容**：

1. 读取所有 \*-thought.md 文件
2. 使用 sequential-thinking 进行结构化整合：
   - 提取各模型核心观点
   - 识别一致性结论（高置信度）
   - 标记分歧点
   - 分析分歧原因
3. 生成整合报告

**验证**：确认 `${RUN_DIR}/synthesis.md` 已生成

**🚨 验证通过后立即执行 Phase 5！**

---

## Phase 5: 结论生成

### 🚨🚨🚨 强制执行 🚨🚨🚨

**立即调用 Skill：**

```
Skill(skill="thinking:conclusion-generator", args="run_dir=${RUN_DIR}")
```

**Skill 执行内容**：

1. 基于整合结果生成最终结论
2. 构建完整推理链
3. 标注置信度
4. 列出关键假设和限制

**验证**：确认 `${RUN_DIR}/conclusion.md` 已生成

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

## Phase 6: 交付

输出完成摘要：

```
🧠 深度思考完成！

📋 问题: ${QUESTION}
🔬 思考深度: ${DEPTH}
⏱️ 耗时: ${ELAPSED_TIME}

📊 思考指标:
- 模型参与: ${MODEL_COUNT} 个
- 推理步骤: ${REASONING_STEPS} 步
- 置信度: ${CONFIDENCE}%

🎯 核心结论:
${CONCLUSION_SUMMARY}

📁 产物:
  ${RUN_DIR}/
  ├── input.md                # 原始问题
  ├── complexity-analysis.md  # 复杂度评估
  ├── claude-thought.md       # Claude 思考
  ├── codex-thought.md        # Codex 思考（deep/ultra）
  ├── gemini-thought.md       # Gemini 思考（deep/ultra）
  ├── synthesis.md            # 思考整合
  └── conclusion.md           # 最终结论

💡 推理链:
${REASONING_CHAIN}
```

---

## 思考深度对比

| 特性         | Light     | Deep            | Ultra             |
| ------------ | --------- | --------------- | ----------------- |
| Claude token | 4k (默认) | 10k (megathink) | 32k (ultrathink)  |
| Codex        | 跳过      | Low reasoning   | High reasoning    |
| Gemini       | 跳过      | Medium thinking | High + budget     |
| 预期耗时     | 5-15s     | 30-60s          | 60-180s           |
| 适用场景     | 简单问答  | 中等复杂分析    | 复杂架构/深度推理 |

---

## 运行目录结构

```
.claude/thinking/runs/20260120T100000Z/
├── state.json               # 工作流状态
├── input.md                 # 原始问题
├── complexity-analysis.md   # Phase 2 产出
├── claude-thought.md        # Phase 3 产出
├── codex-thought.md         # Phase 3 产出（deep/ultra）
├── gemini-thought.md        # Phase 3 产出（deep/ultra）
├── synthesis.md             # Phase 4 产出
└── conclusion.md            # Phase 5 产出
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
