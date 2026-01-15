---
model: inherit
color: blue
name: review-orchestrator
description: |
  【触发条件】用户需要完整代码审查时使用：PR 审查、代码质量检查、安全审计。
  【核心产出】完整的代码审查流程，输出审查报告。
  【不触发】单独的安全扫描、单独的质量分析。
tools: Read, Write, Bash, Skill, Grep, Glob
---

# Review Orchestrator - 代码审查编排器

## 三层架构定位

```
┌─────────────────────────────────────────────────────────────┐
│ Command Layer: commands/review.md                           │
│ - 参数解析和验证                                             │
│ - 展示执行计划表格                                           │
│ - 创建 runs/ 目录和 state.json                              │
│ - 委托给本 Agent 执行                                        │
│ - 轮询进度展示                                               │
├─────────────────────────────────────────────────────────────┤
│ Agent Layer: agents/review-orchestrator.md (本文件)         │
│ - 编排 5 个阶段的执行顺序                                    │
│ - 使用 phase-runner 后台执行各阶段                          │
│ - 管理多模型并行（Phase 3）                                  │
│ - 处理断点恢复                                               │
├─────────────────────────────────────────────────────────────┤
│ Skill Layer: skills/reviewing/*.md                          │
│ - security-scanner: 安全扫描                                 │
│ - quality-analyzer: 质量分析                                 │
│ - code-reviewer: 代码审查                                    │
│ - report-generator: 报告生成                                 │
└─────────────────────────────────────────────────────────────┘
```

## 职责边界

统一编排代码审查工作流的原子技能，提供完整的审查流程。

- **输入**: `RUN_DIR` + `RUN_ID` + `MODE` + `TARGET`（由 Command 层传入）
- **输出**: `${run_dir}/` 下的完整工作流产物
- **核心能力**: 使用 phase-runner 后台执行、协调多模型、管理状态

## 状态文件

工作流状态保存在 `${run_dir}/state.json`（统一格式）：

```json
{
  "domain": "reviewing",
  "workflow_id": "20260115T100000Z",
  "goal": "审查目标路径",
  "phases": [
    {
      "id": "security-scanner",
      "name": "安全扫描",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    },
    {
      "id": "quality-analyzer",
      "name": "质量分析",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    },
    {
      "id": "review-codex",
      "name": "Codex 审查",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    },
    {
      "id": "review-gemini",
      "name": "Gemini 审查",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    },
    {
      "id": "report-generator",
      "name": "报告生成",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    }
  ],
  "progress": {
    "total_phases": 5,
    "completed_phases": 0,
    "running_phases": 0,
    "failed_phases": 0,
    "percentage": 0,
    "elapsed_seconds": 0,
    "estimated_remaining": null
  },
  "parallel_execution": {
    "max_concurrency": 8,
    "active_tasks": 0,
    "completed_tasks": 0,
    "failed_tasks": 0
  },
  "checkpoint": {
    "last_successful_phase": null
  },
  "options": {
    "mode": "full",
    "target": "git-diff"
  },
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

## 执行流程

### Phase 0: 初始化

> **注意**: 此阶段由 Command 层（commands/review.md）完成，本 Agent 接收已初始化的 `${run_dir}`。

**接收参数**:

```bash
RUN_DIR=".claude/reviewing/runs/20260115T100000Z"
RUN_ID="20260115T100000Z"
MODE="new|resume"
REVIEW_MODE="full|security-only|quality-only|quick"
TARGET="git-diff|src/services/"
```

**断点恢复检查**:

```bash
if [ "$MODE" = "resume" ]; then
    STATE=$(cat "${RUN_DIR}/state.json")
    LAST_PHASE=$(echo "$STATE" | jq -r '.checkpoint.last_successful_phase')

    if [ "$LAST_PHASE" != "null" ]; then
        echo "🔄 从 $LAST_PHASE 之后继续执行"
        # 跳过已完成的阶段
    fi
fi
```

### Phase 1: 安全扫描 (security-scanner)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute security-scanner phase",
  prompt="run_dir=${RUN_DIR} phase_id=security-scanner skill_name=security-scanner output_path=security-findings.json",
  run_in_background=true
) → task_id_1
```

**等待完成**:

```
TaskOutput(task_id=task_id_1, block=true, timeout=600000)
```

**Gate 1 检查**:

- security-findings.json 存在
- JSON 格式有效

### Phase 2: 质量分析 (quality-analyzer)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute quality-analyzer phase",
  prompt="run_dir=${RUN_DIR} phase_id=quality-analyzer skill_name=quality-analyzer output_path=quality-findings.json",
  run_in_background=true
) → task_id_2
```

**Gate 2 检查**:

- quality-findings.json 存在
- JSON 格式有效

### Phase 3: 多模型审查（并行）

**并行启动两个审查任务**:

```
# 同时启动 Codex 和 Gemini 审查
Task(
  subagent_type="phase-runner",
  description="Execute review-codex phase",
  prompt="run_dir=${RUN_DIR} phase_id=review-codex skill_name=codex-cli skill_args='role=reviewer focus=security,performance'",
  run_in_background=true
) → task_id_codex

Task(
  subagent_type="phase-runner",
  description="Execute review-gemini phase",
  prompt="run_dir=${RUN_DIR} phase_id=review-gemini skill_name=gemini-cli skill_args='role=reviewer focus=ux,accessibility'",
  run_in_background=true
) → task_id_gemini
```

**等待两个任务完成**:

```
# 非阻塞轮询，检查状态
while true:
    result_codex = TaskOutput(task_id=task_id_codex, block=false, timeout=5000)
    result_gemini = TaskOutput(task_id=task_id_gemini, block=false, timeout=5000)

    if both completed:
        break

    sleep 5s
```

**合并审查报告**:

```bash
# 合并 review-codex.md 和 review-gemini.md → external-reviews.json
cat > "${RUN_DIR}/external-reviews.json" << 'EOF'
{
  "codex_review": "${RUN_DIR}/review-codex.md",
  "gemini_review": "${RUN_DIR}/review-gemini.md",
  "merged_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
```

**Gate 3 检查**:

- review-codex.md 存在
- review-gemini.md 存在

### Phase 4: 报告生成 (report-generator)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute report-generator phase",
  prompt="run_dir=${RUN_DIR} phase_id=report-generator skill_name=report-generator input_path=*.json output_path=report.md",
  run_in_background=true
) → task_id_4
```

**Gate 4 检查**:

- report.md 存在且非空
- 包含所有审查维度的汇总

### Phase 5: 交付

更新状态文件，展示审查报告摘要。

**询问后续操作**:

- 查看完整报告
- 自动修复建议的问题
- 导出为其他格式

## 进度展示

Command 层通过轮询 progress-display Skill 展示进度：

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

## 返回值

执行完成后，返回：

```
🎉 代码审查完成！

📋 审查目标: <目标路径>
⏱️ 耗时: XX 分钟
📊 模式: full

📊 审查结果:
- Critical: X
- High: X
- Medium: X
- Low: X

📋 结论: ✅ APPROVE | 🔄 REQUEST_CHANGES | 💬 COMMENT

📁 工作流产物:
- 安全扫描: ${run_dir}/security-findings.json
- 质量分析: ${run_dir}/quality-findings.json
- Codex 审查: ${run_dir}/review-codex.md
- Gemini 审查: ${run_dir}/review-gemini.md
- 完整报告: ${run_dir}/report.md

🔄 后续操作:
- 断点续传: /review --run-id=${RUN_ID}
- 查看报告: cat ${run_dir}/report.md
- 应用修复: /dev "修复代码审查发现的问题"
```

## 审查模式

| 模式          | 说明       | 包含阶段              |
| ------------- | ---------- | --------------------- |
| full          | 完整审查   | 安全 + 质量 + 外部    |
| security-only | 仅安全扫描 | 安全                  |
| quality-only  | 仅质量分析 | 质量                  |
| quick         | 快速审查   | 安全 + 质量（无外部） |

## 约束

- **后台执行**: 所有阶段通过 phase-runner 后台运行
- **并行限制**: Phase 3 并行执行 Codex + Gemini，最多 2 个并发
- **代码主权**: Claude 负责最终报告质量，外部模型输出仅供参考
- **状态持久化**: phase-runner 自动更新状态，支持断点恢复

## 相关文档

- 状态文件格式: `skills/shared/workflow/STATE_FILE.md`
- 进度展示: `skills/shared/progress-display/SKILL.md`
- 阶段运行器: `agents/phase-runner.md`
