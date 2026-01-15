---
description: 测试工作流：测试分析 → 用例设计(并行) → 代码编写 → 执行验证
argument-hint: <target-path> [--mode=coverage|tdd] [--framework=jest|pytest|vitest|go] [--run-id=xxx]
allowed-tools: ["Read", "Write", "Bash", "Task", "Skill", "AskUserQuestion"]
---

# /test - 测试工作流命令

## 使用方式

```bash
/test src/services/user.ts                    # 标准测试
/test src/services/ --mode=tdd                # TDD 模式
/test --framework=jest src/components/        # 指定框架
/test --run-id=20260115T100000Z               # 断点续传
```

## 执行流程

### 步骤 1: 展示流程规划

**向用户展示即将执行的工作流**:

```
📋 执行计划:
┌────┬────────────────────┬──────────────┬────────────┐
│ #  │ 阶段               │ 执行者       │ 模式       │
├────┼────────────────────┼──────────────┼────────────┤
│ 1  │ 测试分析           │ analyzer     │ 后台       │
│ 2  │ 用例设计           │ Codex+Gemini │ 并行后台   │
│ 3  │ 测试编写           │ writer       │ 后台       │
│ 4  │ 测试执行           │ runner       │ 后台       │
│ 5  │ 用例确认           │ 用户         │ 硬停止     │
└────┴────────────────────┴──────────────┴────────────┘

预计总耗时: 8-15 分钟

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### 步骤 2: 初始化运行环境

**参数解析**:

```bash
OPTIONS='{}'
[[ "$ARGUMENTS" =~ --mode=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg m "${BASH_REMATCH[1]}" '. + {mode: $m}')
[[ "$ARGUMENTS" =~ --framework=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg f "${BASH_REMATCH[1]}" '. + {framework: $f}')

TARGET=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
```

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/testing/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/testing/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

**创建状态文件（统一格式）**:

```bash
if [ "$MODE" = "new" ]; then
    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "testing",
  "workflow_id": "${RUN_ID}",
  "goal": "${TARGET}",
  "phases": [
    {"id": "test-analyzer", "name": "测试分析", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "test-cases-codex", "name": "Codex 用例", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "test-cases-gemini", "name": "Gemini 用例", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "test-writer", "name": "测试编写", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "test-runner", "name": "测试执行", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null}
  ],
  "progress": {"total_phases": 5, "completed_phases": 0, "running_phases": 0, "failed_phases": 0, "percentage": 0, "elapsed_seconds": 0, "estimated_remaining": null},
  "parallel_execution": {"max_concurrency": 8, "active_tasks": 0, "completed_tasks": 0, "failed_tasks": 0},
  "checkpoint": {"last_successful_phase": null},
  "options": ${OPTIONS},
  "quality_gates": {"pass_rate": 0, "line_coverage": 0, "branch_coverage": 0},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    # 写入测试目标
    echo "$TARGET" > "${RUN_DIR}/target.txt"
fi
```

### 步骤 3: 委托给 Orchestrator

```
Task(
  subagent_type="test-orchestrator",
  description="Execute testing workflow",
  prompt="执行测试工作流。
RUN_DIR: ${RUN_DIR}
RUN_ID: ${RUN_ID}
MODE: ${MODE}
TARGET: ${TARGET}

按照 test-orchestrator.md 执行各阶段，使用 phase-runner 后台运行。
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
│ 🔄 工作流进度 (testing)                  │
├─────────────────────────────────────────┤
│ [✅] 测试分析           2m 15s          │
│ [✅] Codex 用例         3m 20s          │
│ [✅] Gemini 用例        2m 45s          │
│ [🔄] 测试编写           运行中...       │
│ [⏳] 测试执行           等待            │
├─────────────────────────────────────────┤
│ 总进度: 3/5 (60%)  已用时: 8m 20s       │
│ 预计剩余: ~5 分钟                       │
└─────────────────────────────────────────┘
```

### 完成

```
🎉 测试任务完成！

📋 目标: ${TARGET}
⏱️ 耗时: 12 分钟
📊 模式: coverage | tdd

📊 测试结果:
- 总用例: X
- 通过: Y
- 失败: Z

📈 覆盖率:
- 行覆盖率: 85% ✅
- 分支覆盖率: 78% ✅
- 函数覆盖率: 90% ✅

📁 产物:
  - analysis.md (分析)
  - test-cases-codex.md, test-cases-gemini.md (用例)
  - test-code.md (代码)
  - results.md (结果)

🔄 后续:
  - 断点续传: /test --run-id=${RUN_ID}
  - 运行测试: npm test
  - 查看覆盖率: npm run coverage
```

## 运行目录结构

```
.claude/testing/runs/20260115T100000Z/
├── state.json              # 工作流状态
├── target.txt              # 测试目标
├── analysis.md             # Phase 1: 测试分析
├── test-cases-codex.md     # Phase 2: Codex 用例
├── test-cases-gemini.md    # Phase 2: Gemini 用例
├── test-cases.md           # Phase 2: 合并用例
├── test-code.md            # Phase 3: 测试代码
└── results.md              # Phase 4: 执行结果
```

## 测试模式

| 模式     | 说明     | 流程                      |
| -------- | -------- | ------------------------- |
| coverage | 覆盖模式 | 分析 → 设计 → 编写 → 执行 |
| tdd      | TDD 模式 | 红 → 绿 → 重构循环        |

## 参考资源

- Agent: `agents/test-orchestrator.md`
- Skills: `skills/testing/`
- 状态文件: `skills/shared/workflow/STATE_FILE.md`
