---
name: multi-model-analyzer
description: |
  【触发条件】开发工作流第二步：多模型并行分析需求，生成实施方案。
  【核心产出】输出 ${run_dir}/analysis-{model}.md，包含实施方案。
  【不触发】上下文检索（用 context-retriever）、原型生成（用 prototype-generator）。
  【先问什么】context.md 缺失时，询问是否先执行上下文检索
  【强制工具】必须调用 codex-cli 或 gemini-cli Skill，禁止 Claude 自行分析。
allowed-tools:
  - Read
  - Write
  - Skill
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: model
    type: string
    required: true
    description: 模型类型（codex 或 gemini）
---

# Multi-Model Analyzer - 多模型分析原子技能

## 🚨 CRITICAL: 必须调用 codex-cli 或 gemini-cli Skill

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ 禁止：Claude 自己做分析（跳过外部模型）                       │
│  ❌ 禁止：直接 Bash 调用 codeagent-wrapper                       │
│  ✅ 必须：通过 Skill 工具调用 codex-cli 或 gemini-cli            │
│                                                                  │
│  这是多模型协作的核心！Claude 不能替代 Codex/Gemini 分析！        │
│                                                                  │
│  执行顺序（必须遵循）：                                          │
│  1. 读取 context.md                                             │
│  2. Skill 调用 codex-cli 或 gemini-cli                          │
│  3. 将外部模型输出写入 analysis-{model}.md                       │
│                                                                  │
│  如果跳过 Step 2，整个多模型协作失效！                           │
└─────────────────────────────────────────────────────────────────┘
```

## 职责边界

- **输入**: `run_dir` + `model` 类型
- **输出**: `${run_dir}/analysis-{codex|gemini}.md`
- **单一职责**: 只做方案分析，不生成代码

## MCP 工具集成

| MCP 工具              | 用途                               | 触发条件        |
| --------------------- | ---------------------------------- | --------------- |
| `sequential-thinking` | 结构化分析策略，确保方案完整一致性 | 🚨 每次执行必用 |

## 执行流程

### Step 0: 结构化分析规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划分析策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划多模型分析策略。需要：1) 理解上下文 2) 确定分析视角 3) 构建分析提示 4) 评估技术选型 5) 识别风险点",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **上下文理解**：从 context.md 提取需求核心和约束
2. **分析视角确定**：根据 model 参数确定后端/前端视角
3. **分析提示构建**：针对性构建提示词
4. **技术选型评估**：评估现有架构和推荐方案
5. **风险点识别**：识别潜在技术风险和依赖冲突

### Step 1: 读取上下文

```bash
# 读取上下文
读取 ${run_dir}/context.md
提取: 需求概述、相关文件、架构模式、依赖分析
```

### Step 2: 构建分析提示

根据模型类型构建专注领域：

| 模型   | 分析视角  | 关注点                                 |
| ------ | --------- | -------------------------------------- |
| Codex  | 后端/逻辑 | API 设计、数据模型、业务逻辑、错误处理 |
| Gemini | 前端/UI   | 组件结构、状态管理、用户交互、样式方案 |

### Step 3: 调用外部模型 Skill（🚨 必须执行）

**🚨🚨🚨 这是关键步骤！**

**❌ 禁止行为：**

- ❌ 使用 Bash 工具调用 codeagent-wrapper
- ❌ 自己分析需求

**✅ 唯一正确做法：使用 Skill 工具**

**对于 Codex 模型（model=codex），立即执行：**

```
Skill(skill="codex-cli", args="--role analyzer --prompt '分析需求并生成实施方案。上下文文件路径: ${RUN_DIR}/context.md。请先读取该文件，然后输出: 1.实施方案概述 2.技术选型建议 3.关键实现步骤 4.潜在风险点 5.与现有代码的集成方式。OUTPUT FORMAT: Markdown'")
```

**对于 Gemini 模型（model=gemini），立即执行：**

```
Skill(skill="gemini-cli", args="--role analyzer --prompt '分析前端需求并生成UI实施方案。上下文文件路径: ${RUN_DIR}/context.md。请先读取该文件，然后输出: 1.UI组件结构 2.状态管理方案 3.样式和响应式策略 4.用户交互流程 5.可访问性考虑。OUTPUT FORMAT: Markdown'")
```

**⚠️ 如果你发现自己在用 Bash 调用 codeagent-wrapper，立即停止并改用 Skill 工具！**

### Step 4: 结构化输出

将分析结果写入 `${run_dir}/analysis-{model}.md`：

```markdown
# {Codex|Gemini} 分析报告

## 模型信息

- 模型: {codex|gemini}
- 视角: {后端/逻辑|前端/UI}
- 分析时间: [timestamp]

## 实施方案

### 概述

[一段话描述整体方案]

### 技术选型

| 领域   | 选型 | 理由 |
| ------ | ---- | ---- |
| 数据层 | ...  | ...  |
| 逻辑层 | ...  | ...  |
| 接口层 | ...  | ...  |

### 实现步骤

1. **步骤1**: [描述]
   - 涉及文件: [文件列表]
   - 关键代码: [伪代码或接口]

2. **步骤2**: [描述]
   ...

### 风险评估

| 风险 | 等级     | 缓解措施 |
| ---- | -------- | -------- |
| ...  | 高/中/低 | ...      |

### 集成方案

- 与现有模块 X 的集成: [描述]
- API 契约: [接口定义]

---

基于上下文: context.md
下一步: 综合分析后调用 prototype-generator
```

## 并行执行（后台模式）

支持多模型并行分析，由编排器使用 Task 工具协调：

```
# 编排器中的调用
Task(skill="multi-model-analyzer", args="run_dir=${RUN_DIR} model=codex", run_in_background=true) &
Task(skill="multi-model-analyzer", args="run_dir=${RUN_DIR} model=gemini", run_in_background=true) &
wait
```

## 返回值

执行完成后，返回：

```
{模型} 分析完成。
输出文件: ${run_dir}/analysis-{model}.md
方案概述: [一句话]
风险等级: [高/中/低]

下一步: 等待所有分析完成后综合评估
```

## 质量门控

- ✅ 方案与上下文匹配
- ✅ 步骤可执行（有具体文件和接口）
- ✅ 风险已识别并有缓解措施
- ✅ 集成方案明确

## 约束

- 不做上下文检索（交给 context-retriever）
- 不生成实际代码（交给 prototype-generator）
- 分析必须基于 context.md 的实际情况
- 外部模型输出视为参考，需 Claude 最终审核

## 🚨 强制工具验证

**执行此 Skill 后，必须满足以下条件：**

| 检查项              | 要求 | 验证方式                            |
| ------------------- | ---- | ----------------------------------- |
| Skill 调用          | 必须 | 检查 codex-cli 或 gemini-cli 被调用 |
| 外部模型输出        | 必须 | analysis-{model}.md 包含模型响应    |
| Claude 自行分析     | 禁止 | 不能跳过 Skill 直接写结果           |
| 直接 Bash codeagent | 禁止 | 必须通过 Skill 工具调用             |

**如果没有调用 codex-cli 或 gemini-cli Skill，此 Skill 执行失败！**
