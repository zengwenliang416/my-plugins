---
name: task-planner
description: |
  【触发条件】规划工作流第一步：生成任务大纲，明确目标和范围。
  【核心产出】输出 ${run_dir}/outline.md，包含任务分解和依赖关系。
  【不触发】素材研究（用 context-researcher）、内容编写（用 content-writer）。
allowed-tools: Read, Write, Bash, Task, mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Task Planner - 任务规划原子技能

## 职责边界

- **输入**: `${run_dir}` + 任务描述
- **输出**: `${run_dir}/outline.md`
- **单一职责**: 只做任务规划和分解，不做素材研究或内容编写

## 执行流程

### Step 1: 分析任务

```bash
解析任务描述
识别: 任务类型（frontend/backend/fullstack）、复杂度、关键需求
```

### Step 2: 并行调用外部模型

**Codex 规划 (后端/逻辑视角)**:

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role architect \
  --workdir $PROJECT_DIR \
  --prompt "为以下任务生成实施大纲: <任务描述>

Requirements:
1. 分解为可执行的子任务（后端视角）
2. 标注每个子任务的依赖关系
3. 估算复杂度 (1-5)
4. 识别潜在技术风险

OUTPUT FORMAT:
## 子任务列表（后端）
1. [复杂度] 任务名 - 描述
   - 依赖: [前置任务]
   - 风险: [风险描述]
"
```

**Gemini 规划 (前端/UI 视角)**:

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role frontend \
  --workdir $PROJECT_DIR \
  --prompt "为以下任务生成实施大纲: <任务描述>

Requirements:
1. 分解为可执行的子任务（前端视角）
2. 标注 UI/UX 考量
3. 估算复杂度 (1-5)
4. 识别用户体验风险

OUTPUT FORMAT:
## 子任务列表（前端）
1. [复杂度] 任务名 - 描述
   - UX考量: [描述]
   - 风险: [风险描述]
"
```

### Step 3: 综合大纲

Claude 作为 Orchestrator：

1. **交叉验证** - 识别一致点和分歧点
2. **综合大纲** - 合并后端/前端视角
3. **风险整合** - 汇总技术和UX风险

### Step 4: 输出大纲

将结果写入 `${run_dir}/outline.md`：

```markdown
# 任务大纲: <任务名>

## 元信息

- 任务类型: frontend | backend | fullstack
- 预估复杂度: X/5
- 规划时间: [timestamp]

## 目标

<明确的目标描述>

## 范围

- 包含: ...
- 不包含: ...

## 子任务列表

### 后端任务

| #   | 任务名 | 复杂度 | 依赖 | 风险 |
| --- | ------ | ------ | ---- | ---- |
| 1   | ...    | X/5    | -    | ...  |

### 前端任务

| #   | 任务名 | 复杂度 | UX考量 | 风险 |
| --- | ------ | ------ | ------ | ---- |
| 1   | ...    | X/5    | ...    | ...  |

## 关键路径

A → B → C → D

## 风险汇总

| 风险 | 类型    | 影响     | 缓解措施 |
| ---- | ------- | -------- | -------- |
| ...  | 技术/UX | 高/中/低 | ...      |

---

下一步: 调用 context-researcher 收集素材
```

## 返回值

执行完成后，返回：

```
任务规划完成。
输出文件: ${run_dir}/outline.md

📋 大纲概要:
- 任务类型: {frontend|backend|fullstack}
- 总子任务数: X
- 预估复杂度: Y/5
- 关键路径: A → B → C

下一步: 使用 /planning:context-researcher 收集素材
```

## 质量门控 (Gate 1)

| 维度     | 标准               | 阈值 |
| -------- | ------------------ | ---- |
| 目标清晰 | 目标是否明确可衡量 | ≥4/5 |
| 范围合理 | 范围是否边界清晰   | ≥4/5 |
| 任务完整 | 是否覆盖所有需求   | ≥4/5 |

- 评分 ≥ 4: 通过，继续下一阶段
- 评分 < 4: 迭代改进
- 迭代 > 3: 触发断路器

## 约束

- 不做素材研究（交给 context-researcher）
- 不做内容编写（交给 content-writer）
- 必须使用双模型并行规划
- 外部模型输出需要 Claude 综合验证
