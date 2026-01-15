---
description: 代码审查工作流：安全扫描 → 质量分析 → 多模型审查(并行) → 报告生成
argument-hint: [<path>] [--mode=full|security-only|quality-only|quick] [--run-id=xxx]
allowed-tools: ["Read", "Write", "Bash", "Task", "Skill", "AskUserQuestion"]
---

# /review - 代码审查工作流命令

## 使用方式

```bash
/review                                       # 审查 git diff
/review src/services/                         # 审查指定路径
/review --mode=security-only                  # 仅安全扫描
/review --run-id=20260115T100000Z             # 断点续传
```

## 执行流程

### 步骤 1: 展示流程规划

**向用户展示即将执行的工作流**:

```
📋 执行计划:
┌────┬────────────────────┬──────────────┬────────────┐
│ #  │ 阶段               │ 执行者       │ 模式       │
├────┼────────────────────┼──────────────┼────────────┤
│ 1  │ 安全扫描           │ scanner      │ 后台       │
│ 2  │ 质量分析           │ analyzer     │ 后台       │
│ 3  │ 代码审查           │ Codex+Gemini │ 并行后台   │
│ 4  │ 报告生成           │ generator    │ 后台       │
└────┴────────────────────┴──────────────┴────────────┘

预计总耗时: 5-10 分钟

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### 步骤 2: 初始化运行环境

**参数解析**:

```bash
OPTIONS='{}'
[[ "$ARGUMENTS" =~ --mode=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg m "${BASH_REMATCH[1]}" '. + {mode: $m}')

TARGET=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
# 无参数时，默认使用 git diff
[ -z "$TARGET" ] && TARGET="git-diff"
```

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/reviewing/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/reviewing/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

**创建状态文件（统一格式）**:

```bash
if [ "$MODE" = "new" ]; then
    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "reviewing",
  "workflow_id": "${RUN_ID}",
  "goal": "${TARGET}",
  "phases": [
    {"id": "security-scanner", "name": "安全扫描", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "quality-analyzer", "name": "质量分析", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "review-codex", "name": "Codex 审查", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "review-gemini", "name": "Gemini 审查", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "report-generator", "name": "报告生成", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null}
  ],
  "progress": {"total_phases": 5, "completed_phases": 0, "running_phases": 0, "failed_phases": 0, "percentage": 0, "elapsed_seconds": 0, "estimated_remaining": null},
  "parallel_execution": {"max_concurrency": 8, "active_tasks": 0, "completed_tasks": 0, "failed_tasks": 0},
  "checkpoint": {"last_successful_phase": null},
  "options": ${OPTIONS},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    # 写入审查目标
    echo "$TARGET" > "${RUN_DIR}/target.txt"
fi
```

### 步骤 3: 委托给 Orchestrator

```
Task(
  subagent_type="review-orchestrator",
  description="Execute code review workflow",
  prompt="执行代码审查工作流。
RUN_DIR: ${RUN_DIR}
RUN_ID: ${RUN_ID}
MODE: ${MODE}
TARGET: ${TARGET}

按照 review-orchestrator.md 执行各阶段，使用 phase-runner 后台运行。
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
│ 🔄 工作流进度 (reviewing)                │
├─────────────────────────────────────────┤
│ [✅] 安全扫描           1m 30s          │
│ [✅] 质量分析           2m 15s          │
│ [🔄] Codex 审查         运行中...       │
│ [🔄] Gemini 审查        运行中...       │
│ [⏳] 报告生成           等待            │
├─────────────────────────────────────────┤
│ 总进度: 2/5 (40%)  已用时: 3m 45s       │
│ 预计剩余: ~5 分钟                       │
└─────────────────────────────────────────┘
```

### 完成

```
🎉 代码审查完成！

📋 审查目标: ${TARGET}
⏱️ 耗时: 8 分钟
📊 模式: full

📊 审查结果:
- Critical: X
- High: X
- Medium: X
- Low: X

📋 结论: ✅ APPROVE | 🔄 REQUEST_CHANGES | 💬 COMMENT

📁 产物:
  - security-findings.json (安全)
  - quality-findings.json (质量)
  - review-codex.md, review-gemini.md (审查)
  - report.md (报告)

🔄 后续:
  - 断点续传: /review --run-id=${RUN_ID}
  - 查看报告: cat ${RUN_DIR}/report.md
  - 应用修复: /dev "修复代码审查发现的问题"
```

## 运行目录结构

```
.claude/reviewing/runs/20260115T100000Z/
├── state.json              # 工作流状态
├── target.txt              # 审查目标
├── security-findings.json  # Phase 1: 安全扫描
├── quality-findings.json   # Phase 2: 质量分析
├── review-codex.md         # Phase 3: Codex 审查
├── review-gemini.md        # Phase 3: Gemini 审查
├── external-reviews.json   # Phase 3: 合并索引
└── report.md               # Phase 4: 最终报告
```

## 审查模式

| 模式          | 说明       | 包含阶段              |
| ------------- | ---------- | --------------------- |
| full          | 完整审查   | 安全 + 质量 + 外部    |
| security-only | 仅安全扫描 | 安全                  |
| quality-only  | 仅质量分析 | 质量                  |
| quick         | 快速审查   | 安全 + 质量（无外部） |

## 参考资源

- Agent: `agents/review-orchestrator.md`
- Skills: `skills/reviewing/`
- 状态文件: `skills/shared/workflow/STATE_FILE.md`
