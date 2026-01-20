---
name: idea-generator
description: |
  【触发条件】brainstorm 工作流 Phase 2：多模型并行生成创意
  【核心产出】输出 ${run_dir}/ideas-pool.md（至少 20 个创意）
  【不触发】research-brief.md 不存在
  【先问什么】method 参数缺失时，询问偏好的发散方法 (scamper/hats/auto)
  【🚨 强制】必须调用 codex-cli 和 gemini-cli 并行生成
allowed-tools:
  - Read
  - Write
  - Skill
  - Bash
  - AskUserQuestion
  - mcp__sequential-thinking__sequentialthinking
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

# Idea Generator

使用多模型并行（Codex + Gemini）基于发散框架生成创意。

## MCP 工具集成

| MCP 工具 | 用途 | 触发条件 |
|----------|------|----------|
| `sequential-thinking` | 结构化发散思维，确保覆盖所有维度 | 🚨 每次执行必用 |
| `auggie-mcp` | 检索代码结构，为技术创意提供上下文 | 🚨 每次执行必用 |
| `context7` | 查询技术文档，获取实现灵感 | 🚨 每次执行必用 |

## 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| run_dir | string | ✅ | 运行目录路径 |
| method | string | ❌ | 发散方法 (scamper/hats/auto)，默认 auto |

## 前置检查

1. 验证 `${run_dir}/research-brief.md` 存在
2. 如果不存在，提示用户先执行 topic-researcher

## 执行流程

### Step 1: 读取研究简报

```bash
research_brief=$(cat "${run_dir}/research-brief.md")
```

提取关键信息：
- 主题 (topic)
- 核心问题
- 发散方向建议
- 关键趋势和案例

### Step 2: 结构化发散规划（sequential-thinking）

🚨 **必须使用 sequential-thinking 规划发散策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划创意发散策略。主题：{topic}。需要确定发散方法、角度覆盖、创意数量目标。",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：
1. **方法选择**：根据主题特性选择最佳发散方法
2. **角度规划**：确保技术/用户/商业多角度覆盖
3. **创意目标**：设定各维度的创意数量目标
4. **盲区检查**：识别可能遗漏的创意方向
5. **质量标准**：定义有价值创意的评判标准

### Step 2.1: 代码上下文增强（auggie-mcp）

🚨 **必须执行**

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "分析项目架构和技术栈，为 {topic} 相关创意提供技术上下文：
  1. 现有模块和功能
  2. 技术约束和依赖
  3. 可扩展的接口和抽象"
})
```

### Step 2.2: 技术灵感获取（context7）

🚨 **必须执行**

```
mcp__context7__resolve-library-id({
  libraryName: "{technology_name}",
  query: "{topic} 创新实现方式和新特性"
})

mcp__context7__query-docs({
  libraryId: "{resolved_library_id}",
  query: "{topic} 高级用法、新功能、创新模式"
})
```

### Step 2.3: 确定发散方法

**如果 method = auto**：
- 产品/功能创新 → 使用 SCAMPER
- 策略/决策问题 → 使用六顶思考帽
- 混合问题 → 两种方法各生成一半

**如果 method = scamper**：
- 使用 SCAMPER 方法（详见 references/scamper.md）

**如果 method = hats**：
- 使用六顶思考帽方法（详见 references/six-hats.md）

如果 method 参数缺失，使用 AskUserQuestion 询问用户偏好。

### Step 3: 构建提示词

根据发散方法和研究简报，构建两个模型的提示词：

**CODEX_PROMPT 构建**（技术视角）：

```
CODEX_PROMPT="
## 角色
你是资深技术架构师，擅长系统设计、技术选型、可行性评估。

## 任务
基于以下研究背景，使用 ${METHOD} 方法生成技术导向的创意。

## 主题
${TOPIC}

## 研究背景
${RESEARCH_BRIEF_SUMMARY}

## 输出要求
生成至少 10 个创意，每个创意包含：
- id: 唯一标识（格式: C-1, C-2, ...）
- title: 简洁标题
- description: 2-3 句话描述
- technical_complexity: 技术复杂度 1-5
- timeline: 实现周期（短期/中期/长期）
- dependencies: 技术依赖列表
- source: \"codex\"

## 输出格式
仅输出 JSON 数组，不要其他解释：
[{...}, {...}]
"
```

**GEMINI_PROMPT 构建**（用户视角）：

```
GEMINI_PROMPT="
## 角色
你是资深用户体验设计师和创意专家，擅长用户洞察、情感设计、创新思维。

## 任务
基于以下研究背景，使用 ${METHOD} 方法生成用户导向的创意。

## 主题
${TOPIC}

## 研究背景
${RESEARCH_BRIEF_SUMMARY}

## 输出要求
生成至少 10 个创意，每个创意包含：
- id: 唯一标识（格式: G-1, G-2, ...）
- title: 简洁标题
- description: 2-3 句话描述
- user_value: 用户价值 1-5
- innovation_level: 创新程度（渐进/突破）
- emotional_appeal: 情感吸引力（实用/惊喜/愉悦/共鸣）
- source: \"gemini\"

## 输出格式
仅输出 JSON 数组，不要其他解释：
[{...}, {...}]
"
```

### Step 4: 并行调用多模型

🚨 **强制使用 Bash 后台并行执行**

**方式 1：使用 Bash 后台任务并行**

```bash
# 定义输出文件
CODEX_OUTPUT="${run_dir}/codex-ideas.json"
GEMINI_OUTPUT="${run_dir}/gemini-ideas.json"

# 并行调用（后台执行）
~/.claude/bin/codeagent-wrapper codex \
  --role brainstorm \
  --prompt "$CODEX_PROMPT" \
  --sandbox read-only > "$CODEX_OUTPUT" 2>&1 &
CODEX_PID=$!

~/.claude/bin/codeagent-wrapper gemini \
  --role brainstorm \
  --prompt "$GEMINI_PROMPT" > "$GEMINI_OUTPUT" 2>&1 &
GEMINI_PID=$!

# 等待两个任务完成
wait $CODEX_PID $GEMINI_PID
echo "两个模型调用完成"
```

**方式 2：使用 Task tool 并行（推荐）**

同时启动两个 Task，使用 `run_in_background=true`：

```
# Codex 任务
Task(
  subagent_type="Bash",
  prompt="执行 codex-cli skill：~/.claude/bin/codeagent-wrapper codex --role brainstorm --prompt '${CODEX_PROMPT}' --sandbox read-only",
  run_in_background=true
)

# Gemini 任务
Task(
  subagent_type="Bash",
  prompt="执行 gemini-cli skill：~/.claude/bin/codeagent-wrapper gemini --role brainstorm --prompt '${GEMINI_PROMPT}'",
  run_in_background=true
)
```

### Step 5: 等待并收集结果

等待两个后台任务完成，读取输出文件：

```bash
# 读取 Codex 输出
CODEX_IDEAS=$(cat "${run_dir}/codex-ideas.json")

# 读取 Gemini 输出
GEMINI_IDEAS=$(cat "${run_dir}/gemini-ideas.json")

# 验证输出是有效 JSON
echo "$CODEX_IDEAS" | jq . > /dev/null || echo "Codex 输出格式错误"
echo "$GEMINI_IDEAS" | jq . > /dev/null || echo "Gemini 输出格式错误"
```

### Step 6: 合并去重

1. 解析两个模型的 JSON 输出
2. 为每个创意添加来源标签：`[codex]` 或 `[gemini]`
3. 使用语义相似度检测去重（相似度 > 80% 的合并）
4. 重新编号：C-1, C-2, ... (Codex), G-1, G-2, ... (Gemini)

### Step 7: 生成 ideas-pool.md

```markdown
---
generated_at: {timestamp}
topic: "{topic}"
method: "{method}"
total_ideas: {N}
sources:
  codex: {N1}
  gemini: {N2}
---

# 创意池

## 统计信息

| 来源 | 数量 | 占比 |
|------|------|------|
| Codex | {N1} | {%} |
| Gemini | {N2} | {%} |
| **总计** | **{N}** | **100%** |

## 创意列表

### 来自 Codex（技术/可行性视角）

#### C-1: {创意标题}

**描述**: {描述}

**技术复杂度**: {1-5}

**实现周期**: {短期/中期/长期}

**依赖条件**: {列表}

---

### 来自 Gemini（创意/用户视角）

#### G-1: {创意标题}

**描述**: {描述}

**用户价值**: {1-5}

**创新程度**: {渐进/突破}

**情感吸引力**: {描述}

---

## 分类视图

### 按创新类型

- **功能创新**: C-1, G-3, ...
- **体验优化**: G-1, G-2, ...
- **商业模式**: C-5, ...
- **技术突破**: C-2, C-3, ...

### 按实现难度

- **快速实现（< 1周）**: G-1, C-4, ...
- **中等难度（1-4周）**: C-1, G-2, ...
- **长期投入（> 1月）**: C-2, G-5, ...
```

## 输出验证

确认：
- `${run_dir}/ideas-pool.md` 存在
- 创意总数 ≥ 20
- 两个模型都有贡献
- 每个创意有完整的元信息

## 发散方法参考

- SCAMPER: references/scamper.md
- 六顶思考帽: references/six-hats.md
- 提示词模板: references/multi-model-prompts.md
