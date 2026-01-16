# 状态文件格式规范

## 概述

工作流状态文件，支持**阶段级进度追踪**和**可视化展示**。

## 完整格式定义

```yaml
---
# === 核心元数据 ===
domain: "planning"
workflow_id: "20260115T100000Z"
goal: "实现用户认证功能"

# === 阶段详情 ===
phases:
  - id: task-planner
    name: "任务规划"
    status: completed # pending | running | completed | failed
    started_at: "2026-01-15T10:00:00Z"
    completed_at: "2026-01-15T10:02:15Z"
    duration_seconds: 135
    task_id: null # 后台任务 ID（非后台时为 null）
    output: outline.md
    error: null

  - id: context-researcher
    name: "素材研究"
    status: completed
    started_at: "2026-01-15T10:02:20Z"
    completed_at: "2026-01-15T10:07:50Z"
    duration_seconds: 330
    task_id: null
    output: materials.md
    error: null

  - id: content-writer
    name: "内容编写"
    status: running
    started_at: "2026-01-15T10:08:00Z"
    completed_at: null
    duration_seconds: null
    task_id: "task-abc123"
    output: null
    error: null

  - id: codex-reviewer
    name: "Codex 审查"
    status: pending
    started_at: null
    completed_at: null
    duration_seconds: null
    task_id: null
    output: null
    error: null

  - id: gemini-reviewer
    name: "Gemini 审查"
    status: pending
    started_at: null
    completed_at: null
    duration_seconds: null
    task_id: null
    output: null
    error: null

  - id: polisher
    name: "文档润色"
    status: pending
    started_at: null
    completed_at: null
    duration_seconds: null
    task_id: null
    output: null
    error: null

# === 进度计算 ===
progress:
  total_phases: 6
  completed_phases: 2
  running_phases: 1
  failed_phases: 0
  percentage: 33
  elapsed_seconds: 465
  estimated_remaining: 600

# === 并行执行控制 ===
parallel_execution:
  max_concurrency: 8
  active_tasks: 1
  completed_tasks: 2
  failed_tasks: 0

# === 会话管理 ===
sessions:
  codex:
    current: null
    history: []
  gemini:
    current: null
    history: []

# === 其他字段 ===
iterations: 0
max_iterations: 3
artifacts:
  outline: outline.md
  materials: materials.md
checkpoint:
  last_successful_phase: context-researcher
created_at: "2026-01-15T10:00:00Z"
updated_at: "2026-01-15T10:08:30Z"
subtasks: []
---
```

## 字段详解

### 1. phases

每个阶段的完整状态信息。

| 字段             | 类型   | 必需 | 说明                                      |
| ---------------- | ------ | ---- | ----------------------------------------- |
| id               | string | Yes  | 阶段唯一标识                              |
| name             | string | Yes  | 阶段显示名称                              |
| status           | string | Yes  | pending \| running \| completed \| failed |
| started_at       | string | -    | ISO8601 时间戳                            |
| completed_at     | string | -    | ISO8601 时间戳                            |
| duration_seconds | number | -    | 执行耗时（秒）                            |
| task_id          | string | -    | 后台任务 ID                               |
| output           | string | -    | 输出文件路径                              |
| error            | string | -    | 错误信息                                  |

### 2. progress

自动计算的进度信息。

| 字段                | 类型   | 说明               |
| ------------------- | ------ | ------------------ |
| total_phases        | number | 总阶段数           |
| completed_phases    | number | 已完成阶段数       |
| running_phases      | number | 运行中阶段数       |
| failed_phases       | number | 失败阶段数         |
| percentage          | number | 完成百分比 (0-100) |
| elapsed_seconds     | number | 已用时间（秒）     |
| estimated_remaining | number | 预估剩余时间（秒） |

**计算规则**:

```javascript
progress.percentage = Math.round(
  (progress.completed_phases / progress.total_phases) * 100,
);

progress.elapsed_seconds = now - phases.find((p) => p.started_at).started_at;

const avgDuration =
  completed.reduce((sum, p) => sum + p.duration_seconds, 0) / completed.length;
progress.estimated_remaining = avgDuration * (total - completed - running);
```

## 状态转换规则

```
[pending] ─── 开始执行 ──→ [running]
                              │
                              │ 记录 started_at, task_id
                              ↓
                        执行中...
                              │
              ┌───────────────┴───────────────┐
              ↓                               ↓
         [completed]                       [failed]
       记录 completed_at               记录 error
       计算 duration_seconds           设置 completed_at
       更新 progress                   更新 progress
```

**关键约束**:

1. 同一时刻最多 8 个 running 阶段
2. 有依赖的阶段必须等待前置完成
3. progress 在每次状态变更时自动更新

## 进度展示

```
┌─────────────────────────────────────────┐
│ 🔄 工作流进度 (plan)                    │
├─────────────────────────────────────────┤
│ [✅] task-planner       2m 15s          │
│ [✅] context-researcher 5m 30s          │
│ [🔄] content-writer     3m 45s...       │
│ [⏳] codex-reviewer     等待            │
│ [⏳] gemini-reviewer    等待            │
│ [⏳] polisher           等待            │
├─────────────────────────────────────────┤
│ 总进度: 2/6 (33%)  已用时: 11m 30s      │
│ 预计剩余: ~10 分钟                      │
└─────────────────────────────────────────┘
```

**状态图标**:

| 状态      | 图标 |
| --------- | ---- |
| pending   | ⏳   |
| running   | 🔄   |
| completed | ✅   |
| failed    | ❌   |

## 使用示例

### 更新阶段状态

```typescript
function startPhase(state, phaseId: string, taskId?: string) {
  const phase = state.phases.find((p) => p.id === phaseId);
  phase.status = "running";
  phase.started_at = new Date().toISOString();
  phase.task_id = taskId || null;
  state.progress.running_phases++;
  updateProgress(state);
  return state;
}

function completePhase(state, phaseId: string, output: string) {
  const phase = state.phases.find((p) => p.id === phaseId);
  phase.status = "completed";
  phase.completed_at = new Date().toISOString();
  phase.duration_seconds = calculateDuration(
    phase.started_at,
    phase.completed_at,
  );
  phase.output = output;
  state.progress.running_phases--;
  state.progress.completed_phases++;
  state.checkpoint.last_successful_phase = phaseId;
  updateProgress(state);
  return state;
}
```

## 验证清单

- [ ] phases 数组存在且每个阶段有完整字段
- [ ] progress 对象存在且数值正确
- [ ] running 阶段数量 ≤ 8
- [ ] 所有时间戳为 ISO8601 格式
- [ ] percentage 在 0-100 范围内

## 相关文档

- 进度展示: `skills/shared/progress-display/SKILL.md`
- 阶段运行器: `agents/phase-runner.md`
