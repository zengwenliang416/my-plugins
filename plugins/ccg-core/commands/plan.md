---
description: 规划工作流：任务规划 → 素材研究 → 内容编写 → 文档审查（并行）→ 文档润色
argument-hint: [--deep|--analyze|--loop] [--run-id=xxx] <任务描述>
allowed-tools: ["Read", "Write", "Bash", "Task", "Skill"]
---

# /plan - 规划工作流命令

## 使用方式

```bash
/plan <任务描述>                    # 标准规划
/plan --deep <分析主题>             # 深度分析（双模型并行）
/plan --loop <任务描述>             # 规划后自动执行
/plan --run-id=20260114T143000Z    # 断点续传
```

## 执行流程

### 步骤 1: 展示流程规划

**向用户展示即将执行的工作流**:

```
📋 执行计划:
┌────┬────────────────────┬──────────────┬────────────┐
│ #  │ 阶段               │ 执行者       │ 模式       │
├────┼────────────────────┼──────────────┼────────────┤
│ 1  │ 任务规划           │ task-planner │ 前台       │
│ 2  │ 素材研究           │ researcher   │ 后台       │
│ 3  │ 内容编写           │ writer       │ 后台       │
│ 4  │ 文档审查           │ Codex+Gemini │ 并行后台   │
│ 5  │ 文档润色           │ polisher     │ 后台       │
└────┴────────────────────┴──────────────┴────────────┘

预计总耗时: 15-25 分钟

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### 步骤 2: 初始化运行环境

**参数解析**:

```bash
OPTIONS='{}'
[[ "$ARGUMENTS" =~ --deep ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {mode: "deep"}')
[[ "$ARGUMENTS" =~ --analyze ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {mode: "analyze"}')
[[ "$ARGUMENTS" =~ --loop ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {loop: true}')

GOAL=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
```

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/planning/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/planning/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

**创建状态文件（统一格式）**:

```bash
if [ "$MODE" = "new" ]; then
    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "planning",
  "workflow_id": "${RUN_ID}",
  "goal": "${GOAL}",
  "phases": [
    {"id": "task-planner", "name": "任务规划", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "context-researcher", "name": "素材研究", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "content-writer", "name": "内容编写", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "codex-reviewer", "name": "Codex 审查", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "gemini-reviewer", "name": "Gemini 审查", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "document-polisher", "name": "文档润色", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null}
  ],
  "progress": {"total_phases": 6, "completed_phases": 0, "running_phases": 0, "failed_phases": 0, "percentage": 0, "elapsed_seconds": 0, "estimated_remaining": null},
  "parallel_execution": {"max_concurrency": 8, "active_tasks": 0, "completed_tasks": 0, "failed_tasks": 0},
  "sessions": {"codex": {"current": null, "history": []}, "gemini": {"current": null, "history": []}},
  "checkpoint": {"last_successful_phase": null},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
fi
```

### 步骤 3: 委托给 Orchestrator

```
Task(
  subagent_type="plan-orchestrator",
  description="Execute planning workflow",
  prompt="执行规划工作流。
RUN_DIR: ${RUN_DIR}
RUN_ID: ${RUN_ID}
MODE: ${MODE}
GOAL: ${GOAL}

按照 plan-orchestrator.md 执行各阶段，使用 phase-runner 后台运行。
完成后返回结果。"
)
```

### 步骤 4: 进度轮询

每 5 秒调用 progress-display Skill 展示进度：

```
Skill("progress-display", args="run_dir=${RUN_DIR}")
```

## 输出示例

### 执行中

```
┌─────────────────────────────────────────┐
│ 🔄 工作流进度 (planning)                │
├─────────────────────────────────────────┤
│ [✅] 任务规划           2m 15s          │
│ [✅] 素材研究           5m 30s          │
│ [🔄] 内容编写           3m 45s...       │
│ [⏳] Codex 审查         等待            │
│ [⏳] Gemini 审查        等待            │
│ [⏳] 文档润色           等待            │
├─────────────────────────────────────────┤
│ 总进度: 2/6 (33%)  已用时: 11m 30s      │
│ 预计剩余: ~10 分钟                      │
└─────────────────────────────────────────┘
```

### 完成

```
📋 规划完成！

任务: ${GOAL}
耗时: 18 分钟

📁 产物:
  - outline.md (大纲)
  - materials.md (素材)
  - chapter-*.md (章节)
  - review-report.md (审查)
  - final.md (最终)

🔄 后续:
  - 断点续传: /plan --run-id=${RUN_ID}
  - 开始实施: /dev <plan内容>
```

## 运行目录结构

```
.claude/planning/runs/20260114T143000Z/
├── state.json           # 工作流状态
├── outline.md           # 任务大纲
├── materials.md         # 素材库
├── chapter-*.md         # 章节内容
├── review-codex.md      # Codex 审查
├── review-gemini.md     # Gemini 审查
├── review-report.md     # 合并审查
└── final.md             # 最终文档
```

## 参考资源

- Agent: `agents/plan-orchestrator.md`
- Skills: `skills/planning/`
- 状态文件: `skills/shared/workflow/STATE_FILE.md`
