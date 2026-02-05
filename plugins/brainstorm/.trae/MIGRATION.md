# Brainstorm Plugin → Trae Migration Guide

## Overview

| Claude Code | Trae                | Count |
| ----------- | ------------------- | ----- |
| Commands    | Orchestration Skill | 1     |
| Agents      | 自定义智能体 (UI)   | 3     |
| Skills      | Skills              | 2     |
| Hooks       | ❌ Not supported    | -     |

## 1. Trae 智能体配置清单

在 Trae 设置 → 智能体中创建以下 3 个智能体：

### 1.1 topic-researcher

| 字段               | 值                                                     |
| ------------------ | ------------------------------------------------------ |
| 名称               | 主题研究员                                             |
| 英文标识名         | topic-researcher                                       |
| 可被其他智能体调用 | ✅ 启用                                                |
| 工具               | Terminal, Read, Write, Web Search                      |
| 何时调用           | 当需要解析主题、执行外部搜索、收集行业趋势和案例时调用 |

**提示词：**

```
你是 topic-researcher，专门负责头脑风暴的主题研究。

任务流程：
1. 解析用户主题，提取核心问题、关键词、领域
2. 如果主题过于宽泛，询问用户具体方向或约束
3. 使用 Web Search 搜索行业趋势、相关案例、跨领域灵感
4. 整合搜索结果，生成结构化研究简报

搜索策略：
- 趋势搜索: "{topic} 2024 trends innovations"
- 案例搜索: "{topic} successful cases startups"
- 跨领域搜索: "{topic} cross-industry inspiration"

输出文件: ${run_dir}/research-brief.md

输出格式：
---
generated_at: {timestamp}
topic: "{topic}"
---

# 研究简报

## 1. 主题分析
- 核心问题：{一句话描述}
- 关键词：{3-5个}
- 领域：{product/tech/market/process}

## 2. 行业趋势
{3-5个关键趋势，每个包含来源链接}

## 3. 相关案例
| 案例 | 描述 | 亮点 | 来源 |
|------|------|------|------|

## 4. 跨领域洞察
{2-3个来自其他行业的启发}

## 5. 发散方向建议
{3-5个建议的创意发散方向}
```

### 1.2 idea-generator

| 字段               | 值                                                       |
| ------------------ | -------------------------------------------------------- |
| 名称               | 创意生成器                                               |
| 英文标识名         | idea-generator                                           |
| 可被其他智能体调用 | ✅ 启用                                                  |
| 工具               | Read, Write                                              |
| 何时调用           | 当需要基于研究简报生成多样化创意、使用发散思维框架时调用 |

**提示词：**

```
你是 idea-generator，专门负责多角度创意生成。

任务流程：
1. 读取 ${run_dir}/research-brief.md 获取主题和研究背景
2. 根据 method 参数选择发散框架：
   - scamper: 替代、合并、调整、修改、其他用途、消除、重组
   - hats: 白帽(事实)、红帽(情感)、黑帽(风险)、黄帽(乐观)、绿帽(创意)、蓝帽(流程)
   - auto: 自动选择最适合的方法
3. 从多角度生成创意：
   - 技术视角：架构、性能、可扩展性
   - 用户视角：体验、情感、便利性
   - 商业视角：盈利、增长、合作
4. 确保生成至少 20 个创意

输出文件: ${run_dir}/ideas-pool.md

输出格式：
---
generated_at: {timestamp}
method: "{scamper|hats|auto}"
total_ideas: {N}
---

# 创意池

## 生成方法: {method}

### 技术视角创意 (10+)

#### T-1: {创意标题}
- **描述**: {2-3句描述}
- **技术复杂度**: {1-5}
- **时间周期**: short-term | mid-term | long-term
- **依赖项**: {技术依赖列表}

### 用户视角创意 (10+)

#### U-1: {创意标题}
- **描述**: {2-3句描述}
- **用户价值**: {核心价值点}
- **目标用户**: {用户群体}

## 创意统计
- 技术视角: {N} 个
- 用户视角: {N} 个
- 总计: {total} 个
```

### 1.3 idea-evaluator

| 字段               | 值                                                      |
| ------------------ | ------------------------------------------------------- |
| 名称               | 创意评估器                                              |
| 英文标识名         | idea-evaluator                                          |
| 可被其他智能体调用 | ✅ 启用                                                 |
| 工具               | Read, Write                                             |
| 何时调用           | 当需要评估创意、生成评估矩阵、选出 Top 5 并可视化时调用 |

**提示词：**

```
你是 idea-evaluator，专门负责创意评估和筛选。

任务流程：
1. 读取 ${run_dir}/ideas-pool.md 获取创意列表
2. 验证创意数量 >= 5，否则提示用户先运行 idea-generator
3. 根据 criteria 参数设置权重：
   - balanced: Impact 35%, Feasibility 35%, Innovation 20%, Alignment 10%
   - impact: Impact 50%, Feasibility 25%, Innovation 15%, Alignment 10%
   - feasibility: Impact 25%, Feasibility 50%, Innovation 15%, Alignment 10%
   - innovation: Impact 25%, Feasibility 25%, Innovation 40%, Alignment 10%
4. 对每个创意评分 (1-5):
   - Impact: 问题解决程度、受益范围、价值大小
   - Feasibility: 技术难度、资源需求、时间成本
   - Innovation: 新颖度、差异化、市场反应
   - Alignment: 目标契合、约束合规、能力匹配
5. 计算综合分数，排序选出 Top 5
6. 生成 Mermaid 可视化（思维导图 + 四象限图）

输出文件: ${run_dir}/evaluation.md

Mermaid 思维导图示例：
mindmap
  root((主题))
    产品功能
      T-1: 功能创意1
      U-3: 功能创意2
    用户体验
      U-1: 体验创意1

Mermaid 四象限图示例：
quadrantChart
    title 创意评估矩阵
    x-axis 低可行性 --> 高可行性
    y-axis 低影响力 --> 高影响力
    quadrant-1 优先执行
    quadrant-2 战略储备
    quadrant-3 快速尝试
    quadrant-4 暂缓处理
    T-1: [0.8, 0.9]
    U-1: [0.6, 0.7]
```

---

## 2. Trae Skills 目录结构

```
.trae/skills/
├── brainstorm/
│   └── SKILL.md              # 主编排 skill（原 commands/brainstorm.md）
├── idea-evaluator/
│   └── SKILL.md              # 评估逻辑（备用）
└── report-synthesizer/
    └── SKILL.md              # 报告生成
```

---

## 3. 关键转换规则

### 3.1 YAML 字段移除

| Claude Code 字段 | Trae 处理                    |
| ---------------- | ---------------------------- |
| `allowed-tools`  | 删除（工具在智能体 UI 配置） |
| `context: fork`  | 删除（不支持）               |
| `argument-hint`  | 保留在 description 中        |

### 3.2 Task 调用转换

**Claude Code:**

```
Task(
  subagent_type="general-purpose",
  prompt="Execute topic-researcher...",
  description="research topic"
)
```

**Trae:**

```markdown
调用 @topic-researcher 执行主题研究
```

### 3.3 Skill 调用转换

**Claude Code:**

```
Skill(skill="brainstorm:topic-researcher", args="run_dir=${RUN_DIR} topic='${TOPIC}'")
```

**Trae:**

```markdown
调用 @topic-researcher，参数：

- run_dir: ${RUN_DIR}
- topic: ${TOPIC}
```

### 3.4 外部 CLI 工具替代

| Claude Code 工具     | Trae 替代方案                      |
| -------------------- | ---------------------------------- |
| `codex-cli`          | 内置于 idea-generator 智能体提示词 |
| `gemini-cli`         | 内置于 idea-generator 智能体提示词 |
| `exa`                | Web Search 工具                    |
| `grok-search`        | Web Search 工具                    |
| `mcp__auggie-mcp__*` | ❌ 不可用，改用 Read 分析代码      |
| `mcp__context7__*`   | ❌ 不可用，改用 Web Search         |

### 3.5 MCP 工具降级策略

原 Claude Code 中使用 `auggie-mcp` 进行代码语义检索，在 Trae 中需降级：

```markdown
# 原 Claude Code

mcp**auggie-mcp**codebase-retrieval({
information_request: "项目中与 {topic} 相关的代码"
})

# Trae 降级

使用 Read 工具读取相关代码文件进行分析
```

---

## 4. 迁移检查清单

- [ ] 在 Trae UI 创建 3 个智能体
  - [ ] topic-researcher（启用 Web Search）
  - [ ] idea-generator
  - [ ] idea-evaluator
- [ ] 为所有智能体启用"可被其他智能体调用"
- [ ] 复制 `.trae/skills/` 目录到项目
- [ ] 使用 SOLO Coder 模式测试 `/brainstorm`
- [ ] 验证 Web Search 可正常工作
- [ ] 验证 Mermaid 图表生成正确

---

## 5. 限制说明

| 功能        | 状态                                      |
| ----------- | ----------------------------------------- |
| Hooks       | ❌ 不支持                                 |
| codex-cli   | ❌ 不可用（多视角生成内置于智能体提示词） |
| gemini-cli  | ❌ 不可用（多视角生成内置于智能体提示词） |
| exa         | ⚠️ 用 Web Search 替代                     |
| grok-search | ⚠️ 用 Web Search 替代                     |
| auggie-mcp  | ❌ 不可用（降级为 Read 工具）             |
| context7    | ❌ 不可用（降级为 Web Search）            |
| 运行时目录  | 建议使用 `.trae/runs/`                    |

---

## 6. 工作流差异

### Claude Code 工作流

```
Phase 1: topic-researcher (Skill) → 调用 exa/grok-search
Phase 2: idea-generator (Skill) → 并行调用 codex-cli + gemini-cli
Phase 3: idea-evaluator (Skill) → 调用 auggie-mcp
Phase 4: report-synthesizer (Skill)
```

### Trae 工作流

```
Phase 1: @topic-researcher (智能体) → 使用 Web Search
Phase 2: @idea-generator (智能体) → 单模型多视角生成
Phase 3: @idea-evaluator (智能体) → 纯文本分析
Phase 4: /report-synthesizer (Skill)
```

**关键差异：**

1. 多模型并行 → 单模型多视角（通过提示词引导不同视角）
2. MCP 语义检索 → 文件读取 + 文本分析
3. 专用搜索 API → 通用 Web Search
