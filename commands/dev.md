---
description: 开发工作流：上下文 → 分析(并行) → 原型 → 实施 → 审计(并行)
argument-hint: <feature-description> [--task-type=frontend|backend|fullstack] [--run-id=xxx]
allowed-tools: ["Read", "Write", "Bash", "Task", "Skill", "AskUserQuestion"]
---

# /dev - 开发工作流命令

## 使用方式

```bash
/dev <功能描述>                       # 标准开发
/dev --task-type=frontend <描述>     # 前端任务（主用 Gemini）
/dev --task-type=backend <描述>      # 后端任务（主用 Codex）
/dev --run-id=20260115T100000Z       # 断点续传
```

## 执行流程

### 步骤 1: 展示流程规划

**向用户展示即将执行的工作流**:

```
📋 执行计划:
┌────┬────────────────────┬──────────────┬────────────┐
│ #  │ 阶段               │ 执行者       │ 模式       │
├────┼────────────────────┼──────────────┼────────────┤
│ 1  │ 上下文检索         │ retriever    │ 后台       │
│ 2  │ 需求分析           │ Codex+Gemini │ 并行后台   │
│ 3  │ 原型生成           │ prototype    │ 后台       │
│ 4  │ 代码实施           │ implementer  │ 后台       │
│ 5  │ 代码审计           │ Codex+Gemini │ 并行后台   │
│ 6  │ 交付确认           │ 用户         │ 硬停止     │
└────┴────────────────────┴──────────────┴────────────┘

预计总耗时: 10-20 分钟

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### 步骤 2: 初始化运行环境

**参数解析**:

```bash
OPTIONS='{}'
[[ "$ARGUMENTS" =~ --task-type=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg t "${BASH_REMATCH[1]}" '. + {task_type: $t}')
[[ "$ARGUMENTS" =~ --no-parallel ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {parallel: false}')

FEATURE=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
```

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/developing/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/developing/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

**创建状态文件（统一格式）**:

```bash
if [ "$MODE" = "new" ]; then
    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "developing",
  "workflow_id": "${RUN_ID}",
  "goal": "${FEATURE}",
  "phases": [
    {"id": "context-retriever", "name": "上下文检索", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "analyzer-codex", "name": "Codex 分析", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "analyzer-gemini", "name": "Gemini 分析", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "prototype-generator", "name": "原型生成", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "code-implementer", "name": "代码实施", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "audit-codex", "name": "Codex 审计", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "audit-gemini", "name": "Gemini 审计", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null}
  ],
  "progress": {"total_phases": 7, "completed_phases": 0, "running_phases": 0, "failed_phases": 0, "percentage": 0, "elapsed_seconds": 0, "estimated_remaining": null},
  "parallel_execution": {"max_concurrency": 8, "active_tasks": 0, "completed_tasks": 0, "failed_tasks": 0},
  "sessions": {"codex": {"current": null, "history": []}, "gemini": {"current": null, "history": []}},
  "checkpoint": {"last_successful_phase": null},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    # 写入功能描述
    echo "$FEATURE" > "${RUN_DIR}/input.md"
fi
```

### 步骤 3: 委托给 Orchestrator

```
Task(
  subagent_type="dev-orchestrator",
  description="Execute development workflow",
  prompt="执行开发工作流。
RUN_DIR: ${RUN_DIR}
RUN_ID: ${RUN_ID}
MODE: ${MODE}
FEATURE: ${FEATURE}

按照 dev-orchestrator.md 执行各阶段，使用 phase-runner 后台运行。
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
│ 🔄 工作流进度 (developing)              │
├─────────────────────────────────────────┤
│ [✅] 上下文检索         1m 30s          │
│ [✅] Codex 分析         3m 20s          │
│ [✅] Gemini 分析        2m 45s          │
│ [🔄] 原型生成           运行中...       │
│ [⏳] 代码实施           等待            │
│ [⏳] Codex 审计         等待            │
│ [⏳] Gemini 审计        等待            │
├─────────────────────────────────────────┤
│ 总进度: 3/7 (43%)  已用时: 7m 35s       │
│ 预计剩余: ~8 分钟                       │
└─────────────────────────────────────────┘
```

### 完成

```
🎉 开发任务完成！

📋 任务: ${FEATURE}
⏱️ 耗时: 15 分钟
🔀 任务类型: fullstack

📊 审计结果:
- Codex 评分: 4/5 (安全/性能)
- Gemini 评分: 4/5 (UX/可访问性)
- Critical: 0 | Major: 1 | Minor: 3

📁 产物:
  - context.md (上下文)
  - analysis-codex.md, analysis-gemini.md (分析)
  - prototype.diff (原型)
  - changes.md (变更)
  - audit-codex.md, audit-gemini.md (审计)

🔄 后续:
  - 断点续传: /dev --run-id=${RUN_ID}
  - 提交代码: /commit
  - 创建 PR: gh pr create
```

## 运行目录结构

```
.claude/developing/runs/20260115T100000Z/
├── state.json              # 工作流状态
├── input.md                # 功能描述
├── context.md              # Phase 1: 上下文
├── analysis-codex.md       # Phase 2: Codex 分析
├── analysis-gemini.md      # Phase 2: Gemini 分析
├── prototype.diff          # Phase 3: 原型
├── changes.md              # Phase 4: 变更记录
├── audit-codex.md          # Phase 5: Codex 审计
└── audit-gemini.md         # Phase 5: Gemini 审计
```

## 任务类型说明

| 类型      | 路由            | 说明            |
| --------- | --------------- | --------------- |
| frontend  | 主要使用 Gemini | UI/UX/样式/交互 |
| backend   | 主要使用 Codex  | API/数据库/逻辑 |
| fullstack | 双模型并行      | 全栈功能        |
| auto      | 自动判断        | 根据关键词判断  |

## 参考资源

- Agent: `agents/dev-orchestrator.md`
- Skills: `skills/developing/`
- 状态文件: `skills/shared/workflow/STATE_FILE.md`
