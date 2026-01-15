# 工作流 V3 迁移指南

> 从黑盒 Orchestrator 架构迁移到三层可见架构

## 概述

V3 架构将工作流从"黑盒"模式改为三层可见架构，用户可实时看到执行进度。

### 架构对比

| 方面     | V2（旧架构）                  | V3（新架构）              |
| -------- | ----------------------------- | ------------------------- |
| Command  | 直接调用 Orchestrator         | 展示计划 + 轮询进度       |
| Agent    | 同步执行                      | 后台执行（phase-runner）  |
| 状态文件 | steps 对象 + YAML frontmatter | phases 数组 + JSON        |
| 进度展示 | 无（黑盒）                    | 实时进度条                |
| 断点续传 | 通过 .local.md                | 通过 runs/{id}/state.json |

## 迁移步骤

### 1. 更新 Command 文件

**旧格式**（commands/debug.md）:

```markdown
---
description: 调试工作流
allowed-tools: ["Read", "Write", "Bash", "Skill"]
---

调用 debug-orchestrator 执行调试。
```

**新格式**:

```markdown
---
description: 调试工作流：症状收集 → 假设生成(并行) → 根因分析 → 修复方案
allowed-tools: ["Read", "Write", "Bash", "Task", "Skill", "AskUserQuestion"]
---

# /debug - 调试工作流命令

## 步骤 1: 展示流程规划

📋 执行计划:
┌────┬────────────────────┬──────────────┐
│ # │ 阶段 │ 执行者 │
├────┼────────────────────┼──────────────┤
│ 1 │ 症状收集 │ collector │
│ 2 │ 假设生成 │ Codex+Gemini │
...

## 步骤 2: 初始化运行环境

创建 state.json（统一格式）

## 步骤 3: 委托给 Orchestrator

Task(subagent_type="debug-orchestrator", ...)

## 步骤 4: 进度轮询

Skill("progress-display", args="run_dir=${RUN_DIR}")
```

### 2. 更新 Agent 文件

**关键变更**:

1. 使用 `phase-runner` 后台执行各阶段
2. 引用统一的 `state.json` 格式
3. 添加硬停止点（AskUserQuestion）

**示例**:

```markdown
### Phase 1: 症状收集 (symptom-collector)

**后台执行**:

Task(
subagent_type="phase-runner",
description="Execute symptom-collector phase",
prompt="run_dir=${RUN_DIR} phase_id=symptom-collector skill_name=symptom-collector",
run_in_background=true
) → task_id_1

**等待完成**:

TaskOutput(task_id=task_id_1, block=true, timeout=600000)

**Gate 1 检查**: symptoms.md 存在且非空
```

### 3. 更新状态文件格式

**旧格式**（YAML frontmatter in .local.md）:

```yaml
---
workflow_version: "1.0"
current_phase: hypothesis_generation
steps:
  symptom_collection: completed
  hypothesis_generation: running
---
```

**新格式**（JSON in runs/{id}/state.json）:

```json
{
  "domain": "debugging",
  "workflow_id": "20260115T100000Z",
  "phases": [
    { "id": "symptom-collector", "name": "症状收集", "status": "completed" },
    {
      "id": "hypothesis-codex",
      "name": "Codex 假设",
      "status": "running",
      "task_id": "abc"
    }
  ],
  "progress": { "total_phases": 5, "completed_phases": 1, "percentage": 20 },
  "parallel_execution": { "max_concurrency": 8, "active_tasks": 1 }
}
```

### 4. 更新产物目录结构

**旧结构**:

```
.claude/debugging/
├── debugging.local.md    # 状态文件
├── symptoms.md
└── hypotheses.md
```

**新结构**:

```
.claude/debugging/runs/20260115T100000Z/
├── state.json            # 状态文件
├── problem.md            # 输入
├── symptoms.md           # Phase 1 输出
├── hypotheses-codex.md   # Phase 2 输出
├── hypotheses-gemini.md  # Phase 2 输出
├── hypotheses.md         # Phase 2 合并
├── root-cause.md         # Phase 3 输出
└── fix-proposal.md       # Phase 4 输出
```

## 迁移清单

### 已完成

- [x] 基础设施
  - [x] STATE_FILE.md（统一格式）
  - [x] progress-display Skill
  - [x] phase-runner Agent
- [x] 核心工作流（P0）
  - [x] commands/plan.md
  - [x] commands/dev.md
  - [x] agents/plan-orchestrator.md
  - [x] agents/dev-orchestrator.md
- [x] 扩展工作流（P1）
  - [x] commands/debug.md
  - [x] commands/test.md
  - [x] commands/review.md
  - [x] agents/debug-orchestrator.md
  - [x] agents/test-orchestrator.md
  - [x] agents/review-orchestrator.md
- [x] 文档更新
  - [x] ARCHITECTURE.md
  - [x] AGENTS.md
  - [x] 迁移指南

### 已完成（P2）

- [x] 其余工作流
  - [x] social-post-orchestrator
  - [x] image-orchestrator
  - [x] commit-orchestrator

## 兼容性说明

### 断点续传

旧 `.local.md` 状态文件仍可读取，但新运行使用 `runs/{id}/state.json`。

### 命令别名

旧命令（如 `/ccg:bugfix`）仍可用，内部重定向到新命令。

## 常见问题

### Q: 如何恢复旧运行？

使用 `--run-id` 参数：

```bash
/debug --run-id=20260115T100000Z
```

### Q: 进度不更新？

检查 `state.json` 是否被正确更新。phase-runner 应在每个阶段开始/完成时更新状态。

### Q: 多模型并行超时？

检查 `parallel_execution.max_concurrency` 设置，默认最多 8 个并发任务。

## 相关文档

- [三层架构说明](../skills/ARCHITECTURE.md)
- [状态文件格式](../skills/shared/workflow/STATE_FILE.md)
- [阶段运行器](../agents/phase-runner.md)
