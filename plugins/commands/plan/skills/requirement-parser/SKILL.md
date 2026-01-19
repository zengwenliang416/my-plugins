---
name: requirement-parser
description: |
  【触发条件】plan 工作流第一步：解析用户需求，结构化输出
  【核心产出】输出 ${run_dir}/requirements.md
  【不触发】直接分析（用 architecture-analyzer）
  【先问什么】需求模糊时，询问功能边界和约束条件
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Requirement Parser - 需求解析原子技能

## 职责边界

- **输入**: `run_dir` + `${run_dir}/input.md` 中的功能需求
- **输出**: `${run_dir}/requirements.md`
- **单一职责**: 只做需求解析和结构化，不做架构分析

## MCP 工具集成

| MCP 工具              | 用途                             | 触发条件           |
| --------------------- | -------------------------------- | ------------------ |
| `sequential-thinking` | 结构化需求分析，确保覆盖所有维度 | 🚨 每次执行必用    |
| `auggie-mcp`          | 检索现有代码，理解技术约束       | 需求涉及现有系统时 |

## 执行流程

### Step 0: 结构化需求分析规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划分析策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "分析用户需求。需要识别：1) 功能需求 2) 非功能需求 3) UI/UX 需求 4) 约束条件 5) 任务类型",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **需求分类**：识别功能/非功能/UI/约束
2. **边界定义**：确定功能边界和范围
3. **优先级排序**：P1/P2/P3 划分
4. **验收标准**：定义可验证的验收条件
5. **歧义检测**：识别需要澄清的问题

### Step 1: 读取输入

```bash
# run_dir 由 orchestrator 传入
FEATURE=$(cat "${run_dir}/input.md")
```

### Step 2: 需求分类

根据用户描述，识别需求类型：

| 需求类型          | 识别特征                   | 处理方式          |
| ----------------- | -------------------------- | ----------------- |
| 功能需求（FR）    | 动词开头：实现、添加、创建 | 提取用户故事      |
| 非功能需求（NFR） | 性能、安全、可用性相关     | 归类到 NFR 清单   |
| UI/UX 需求        | 界面、交互、样式相关       | 提取视觉/交互规格 |
| 约束条件          | 技术栈、兼容性、时间限制   | 记录为约束        |

### Step 3: 歧义澄清

如果需求存在以下问题，使用 AskUserQuestion 询问：

- 边界不清：功能边界在哪里？
- 约束不明：有哪些技术或业务约束？
- 优先级不明：哪些是必须实现的？
- 验收标准不明：如何验证完成？

### Step 4: 任务类型判断

根据需求内容判断任务类型：

| 类型      | 判断依据             | 权重分配   |
| --------- | -------------------- | ---------- |
| frontend  | 仅涉及 UI/样式/交互  | 前端 100%  |
| backend   | 仅涉及 API/数据/逻辑 | 后端 100%  |
| fullstack | 同时涉及前后端       | 按需求分配 |

### Step 5: 结构化输出

将解析结果写入 `${run_dir}/requirements.md`：

```markdown
# 需求规格

## 元信息

- 解析时间: [timestamp]
- 任务类型: [frontend|backend|fullstack]
- 前端权重: [0-100]%
- 后端权重: [0-100]%

## 需求概述

[一句话描述核心需求]

## 功能需求

| ID     | 需求描述 | 优先级   | 验收标准 |
| ------ | -------- | -------- | -------- |
| FR-001 |          | P1/P2/P3 |          |
| FR-002 |          |          |          |

## 非功能需求

| ID      | 类别 | 约束描述          |
| ------- | ---- | ----------------- |
| NFR-001 | 性能 | API 响应 < 200ms  |
| NFR-002 | 安全 | OWASP Top 10 合规 |

## UI/UX 需求（如适用）

| ID     | 组件/页面 | 交互描述 | 视觉规格 |
| ------ | --------- | -------- | -------- |
| UX-001 |           |          |          |

## 约束条件

- **技术约束**: [技术栈、版本要求]
- **业务约束**: [时间、预算、合规]
- **兼容约束**: [浏览器、设备、API 版本]

## 假设与依赖

- 假设: [隐含的假设]
- 依赖: [外部依赖]

## 待澄清事项

- [ ] [需要进一步确认的问题]

---

下一步: 调用 plan-context-retriever 检索上下文
```

## 返回值

执行完成后，返回：

```
需求解析完成。
输出文件: ${run_dir}/requirements.md
任务类型: [type]
功能需求: X 个
非功能需求: Y 个

下一步: 使用 plan:plan-context-retriever 检索上下文
```

## 质量门控

- ✅ 提取了明确的功能需求
- ✅ 识别了非功能需求
- ✅ 判断了任务类型和权重
- ✅ 记录了约束条件
- ✅ 澄清了歧义（如有）

## 约束

- 不做架构分析（交给 architecture-analyzer）
- 不做代码检索（交给 plan-context-retriever）
- 需求不清时必须询问，不能假设
