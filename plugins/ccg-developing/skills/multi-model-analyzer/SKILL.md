---
name: multi-model-analyzer
description: |
  【触发条件】开发工作流第二步：多模型并行分析需求，生成实施方案。
  【核心产出】输出 ${run_dir}/analysis-{model}.md，包含实施方案。
  【不触发】上下文检索（用 context-retriever）、原型生成（用 prototype-generator）。
allowed-tools: Read, Write, Bash, Task
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

## 职责边界

- **输入**: `run_dir` + `model` 类型
- **输出**: `${run_dir}/analysis-{codex|gemini}.md`
- **单一职责**: 只做方案分析，不生成代码

## 执行流程

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

### Step 3: 调用外部模型

```bash
~/.claude/bin/codeagent-wrapper {codex|gemini} \
  --role analyzer \
  --workdir $PROJECT_DIR \
  --prompt "
分析需求并生成实施方案。

上下文文件路径: .claude/developing/context.md
请先读取该文件获取需求概述、相关文件、架构模式、依赖分析。

请输出:
1. 实施方案概述
2. 技术选型建议
3. 关键实现步骤
4. 潜在风险点
5. 与现有代码的集成方式

OUTPUT FORMAT: Markdown
"
```

### Step 4: 结构化输出

将分析结果写入 `.claude/developing/analysis-{model}.md`：

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

## 并行执行

支持多模型并行分析（由编排器协调）：

```bash
# 编排器中的调用
Task(multi-model-analyzer, model=codex, run_in_background=true) &
Task(multi-model-analyzer, model=gemini, run_in_background=true) &
wait
```

## 返回值

执行完成后，返回：

```
{模型} 分析完成。
输出文件: .claude/developing/analysis-{model}.md
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
