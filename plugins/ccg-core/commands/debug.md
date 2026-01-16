---
description: 调试工作流：症状收集 → 假设生成(并行) → 根因分析 → 修复方案
argument-hint: <problem-description> [--severity=critical|high|medium|low] [--run-id=xxx]
allowed-tools: ["Read", "Write", "Bash", "Task", "Skill", "AskUserQuestion"]
---

# /debug - 调试工作流命令

## 使用方式

```bash
/debug "用户登录后页面白屏"                   # 标准调试
/debug "数据库连接超时" --severity=critical   # 高优先级
/debug path/to/bug-report.md                  # 从文件输入
/debug --run-id=20260115T100000Z              # 断点续传
```

## 执行流程

### 步骤 1: 展示流程规划

**向用户展示即将执行的工作流**:

```
📋 执行计划:
┌────┬────────────────────┬──────────────┬────────────┐
│ #  │ 阶段               │ 执行者       │ 模式       │
├────┼────────────────────┼──────────────┼────────────┤
│ 1  │ 症状收集           │ collector    │ 后台       │
│ 2  │ 假设生成           │ Codex+Gemini │ 并行后台   │
│ 3  │ 假设确认           │ 用户         │ 硬停止     │
│ 4  │ 根因分析           │ analyzer     │ 后台       │
│ 5  │ 修复方案           │ proposer     │ 后台       │
│ 6  │ 方案确认           │ 用户         │ 硬停止     │
└────┴────────────────────┴──────────────┴────────────┘

预计总耗时: 10-20 分钟

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### 步骤 2: 初始化运行环境

**参数解析**:

```bash
OPTIONS='{}'
[[ "$ARGUMENTS" =~ --severity=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg s "${BASH_REMATCH[1]}" '. + {severity: $s}')

# 提取问题描述
PROBLEM=""
for arg in $ARGUMENTS; do
    if [[ ! "$arg" =~ ^-- ]]; then
        if [ -f "$arg" ]; then
            PROBLEM=$(cat "$arg")
        else
            PROBLEM="$arg"
        fi
        break
    fi
done
```

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/debugging/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/debugging/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

**创建状态文件（统一格式）**:

```bash
if [ "$MODE" = "new" ]; then
    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "debugging",
  "workflow_id": "${RUN_ID}",
  "goal": "${PROBLEM}",
  "phases": [
    {"id": "symptom-collector", "name": "症状收集", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "hypothesis-codex", "name": "Codex 假设", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "hypothesis-gemini", "name": "Gemini 假设", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "root-cause-analyzer", "name": "根因分析", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "fix-proposer", "name": "修复方案", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null}
  ],
  "progress": {"total_phases": 5, "completed_phases": 0, "running_phases": 0, "failed_phases": 0, "percentage": 0, "elapsed_seconds": 0, "estimated_remaining": null},
  "parallel_execution": {"max_concurrency": 8, "active_tasks": 0, "completed_tasks": 0, "failed_tasks": 0},
  "checkpoint": {"last_successful_phase": null, "confirmed_hypothesis": null},
  "options": ${OPTIONS},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    # 写入问题描述
    echo "$PROBLEM" > "${RUN_DIR}/problem.md"
fi
```

### 步骤 3: 委托给 Orchestrator

```
Task(
  subagent_type="debug-orchestrator",
  description="Execute debugging workflow",
  prompt="执行调试工作流。
RUN_DIR: ${RUN_DIR}
RUN_ID: ${RUN_ID}
MODE: ${MODE}
PROBLEM: ${PROBLEM}

按照 debug-orchestrator.md 执行各阶段，使用 phase-runner 后台运行。
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
│ 🔄 工作流进度 (debugging)                │
├─────────────────────────────────────────┤
│ [✅] 症状收集           1m 30s          │
│ [✅] Codex 假设         3m 20s          │
│ [✅] Gemini 假设        2m 45s          │
│ [🔄] 根因分析           运行中...       │
│ [⏳] 修复方案           等待            │
├─────────────────────────────────────────┤
│ 总进度: 3/5 (60%)  已用时: 7m 35s       │
│ 预计剩余: ~5 分钟                       │
└─────────────────────────────────────────┘
```

### 完成

```
🎉 调试任务完成！

📋 问题: ${PROBLEM}
⏱️ 耗时: 15 分钟
🔴 严重级别: medium

📊 诊断结果:
- 根因: <一句话描述>
- 位置: src/services/query.ts:50
- 置信度: 95%

📁 产物:
  - symptoms.md (症状)
  - hypotheses-codex.md, hypotheses-gemini.md (假设)
  - hypotheses.md (合并假设)
  - root-cause.md (根因)
  - fix-proposal.md (修复)

🔄 后续:
  - 断点续传: /debug --run-id=${RUN_ID}
  - 应用修复: /dev "修复 <问题>"
  - 手动修复: 按 fix-proposal.md 中的 diff
```

## 运行目录结构

```
.claude/debugging/runs/20260115T100000Z/
├── state.json              # 工作流状态
├── problem.md              # 问题描述
├── symptoms.md             # Phase 1: 症状收集
├── hypotheses-codex.md     # Phase 2: Codex 假设
├── hypotheses-gemini.md    # Phase 2: Gemini 假设
├── hypotheses.md           # Phase 2: 合并假设
├── root-cause.md           # Phase 3: 根因分析
└── fix-proposal.md         # Phase 4: 修复方案
```

## DEDUCE 方法论

工作流遵循 DEDUCE 方法论：

| 阶段 | DEDUCE              | 对应 Phase  |
| ---- | ------------------- | ----------- |
| D    | Describe - 描述问题 | Phase 1     |
| E    | Evidence - 收集证据 | Phase 1     |
| D    | Diagnose - 诊断分析 | Phase 2 + 3 |
| U    | Uncover - 发现根因  | Phase 3     |
| C    | Correct - 修正问题  | Phase 4     |
| E    | Evaluate - 评估验证 | Phase 5     |

## 参考资源

- Agent: `agents/debug-orchestrator.md`
- Skills: `skills/debugging/`
- 状态文件: `skills/shared/workflow/STATE_FILE.md`
