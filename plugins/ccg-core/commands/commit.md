---
description: 规范提交工作流：收集 → 分析 → 生成消息 → 执行
argument-hint: [--no-verify] [--amend] [--emoji] [--scope <scope>] [--type <type>] [--run-id=xxx]
allowed-tools: [Read, Write, Bash, Task, Skill, AskUserQuestion]
---

# /commit - 规范提交命令

## 使用方式

```bash
# 基本用法
/commit

# 跳过预检查和 git hooks
/commit --no-verify

# 指定类型和作用域
/commit --type feat --scope api

# 修改上次提交
/commit --amend

# 断点续传
/commit --run-id=20260114T103000Z

# 模拟执行（不实际提交）
/commit --dry-run
```

## 职责

这是一个轻量级入口 Command，负责：

1. 参数解析和验证
2. 创建运行目录结构（`runs/`）
3. 初始化状态文件（`state.json`）
4. 委托给 `commit-orchestrator` Agent 执行

**不负责**：具体的变更收集、分析、消息生成等任务（由 Agent 和 Skills 完成）。

## 执行流程

### 步骤 1: 展示流程规划

**向用户展示即将执行的工作流**:

```
📋 执行计划:
┌────┬────────────────────┬──────────────┬────────────┐
│ #  │ 阶段               │ 执行者       │ 模式       │
├────┼────────────────────┼──────────────┼────────────┤
│ 1  │ 预检查             │ precheck     │ 后台       │
│ 2  │ 收集变更           │ collector    │ 后台       │
│ 3  │ 分析变更           │ analyzer     │ 后台       │
│ 4  │ 消息确认           │ 用户         │ 硬停止     │
│ 5  │ 生成消息           │ generator    │ 后台       │
│ 6  │ 执行提交           │ executor     │ 后台       │
└────┴────────────────────┴──────────────┴────────────┘

🔧 选项: ${OPTIONS}
预计总耗时: 1-2 分钟

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### 步骤 2: 参数解析

**选项解析**:

| 选项               | 说明                           | 默认值 |
| ------------------ | ------------------------------ | ------ |
| `--no-verify`      | 跳过预检查和 git hooks         | false  |
| `--amend`          | 修改上次提交                   | false  |
| `--emoji`          | 使用 emoji 前缀                | true   |
| `--scope <name>`   | 指定作用域                     | auto   |
| `--type <type>`    | 强制提交类型（feat/fix/docs等) | auto   |
| `--issue <number>` | 关联 issue                     | -      |
| `--signoff`        | 添加 Signed-off-by             | false  |
| `--breaking`       | 标记为 Breaking Change         | false  |
| `--dry-run`        | 模拟执行，不实际提交           | false  |
| `--run-id=<id>`    | 使用指定 run-id（断点续传）    | -      |

**解析逻辑**:

```bash
# 初始化选项对象
OPTIONS='{}'

# 解析各选项
[[ "$ARGUMENTS" =~ --no-verify ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {no_verify: true}')
[[ "$ARGUMENTS" =~ --amend ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {amend: true}')
[[ "$ARGUMENTS" =~ --no-emoji ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {emoji: false}') || OPTIONS=$(echo "$OPTIONS" | jq '. + {emoji: true}')
[[ "$ARGUMENTS" =~ --signoff ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {signoff: true}')
[[ "$ARGUMENTS" =~ --breaking ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {breaking: true}')
[[ "$ARGUMENTS" =~ --dry-run ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {dry_run: true}')

# 解析带值选项
[[ "$ARGUMENTS" =~ --scope[[:space:]]+([^[:space:]-]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg v "${BASH_REMATCH[1]}" '. + {scope: $v}')
[[ "$ARGUMENTS" =~ --type[[:space:]]+([^[:space:]-]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg v "${BASH_REMATCH[1]}" '. + {type: $v}')
[[ "$ARGUMENTS" =~ --issue[[:space:]]+([0-9]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --argjson v "${BASH_REMATCH[1]}" '. + {issue: $v}')
```

### 步骤 3: 初始化运行环境

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/committing/runs/${RUN_ID}"
    if [ ! -d "$RUN_DIR" ]; then
        echo "❌ 错误: 运行目录不存在: $RUN_DIR"
        exit 1
    fi
    MODE="resume"
    echo "🔄 恢复工作目录: $RUN_DIR"
else
    MODE="new"
fi
```

**创建状态文件（统一格式）**:

```bash
if [ "$MODE" = "new" ]; then
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/committing/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"

    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "committing",
  "workflow_id": "${RUN_ID}",
  "goal": "创建规范提交",
  "phases": [
    {"id": "precheck", "name": "预检查", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "change-collector", "name": "收集变更", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "change-analyzer", "name": "分析变更", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "message-generator", "name": "生成消息", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "commit-executor", "name": "执行提交", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null}
  ],
  "progress": {"total_phases": 5, "completed_phases": 0, "running_phases": 0, "failed_phases": 0, "percentage": 0, "elapsed_seconds": 0, "estimated_remaining": null},
  "parallel_execution": {"max_concurrency": 8, "active_tasks": 0, "completed_tasks": 0, "failed_tasks": 0},
  "checkpoint": {"last_successful_phase": null, "confirmed_message": false},
  "options": ${OPTIONS},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    echo "📂 创建工作目录: $RUN_DIR"
    echo "🔧 初始化状态: state.json"
fi
```

### 步骤 4: 委托给 Orchestrator

```
Task(
  subagent_type="commit-orchestrator",
  description="Execute commit workflow",
  prompt="执行提交工作流。
RUN_DIR: ${RUN_DIR}
RUN_ID: ${RUN_ID}
MODE: ${MODE}
OPTIONS: ${OPTIONS}

按照 commit-orchestrator.md 执行各阶段，使用 phase-runner 后台运行。
完成后返回结果。"
)
```

### 步骤 5: 进度轮询

每 5 秒调用 progress-display Skill 展示进度：

```
Skill("progress-display", args="run_dir=${RUN_DIR}")
```

## 输出示例

### 执行中

```
┌─────────────────────────────────────────┐
│ 🔄 工作流进度 (committing)               │
├─────────────────────────────────────────┤
│ [✅] 预检查               0m 05s        │
│ [✅] 收集变更             0m 03s        │
│ [🔄] 分析变更             运行中...     │
│ [⏳] 生成消息             等待          │
│ [⏳] 执行提交             等待          │
├─────────────────────────────────────────┤
│ 总进度: 2/5 (40%)  已用时: 0m 15s       │
│ 预计剩余: ~20 秒                        │
└─────────────────────────────────────────┘
```

### 完成

```
🎉 提交完成！

📝 消息: feat(api): ✨ 新增用户认证接口
🔀 分支: feature/auth
⏱️ 耗时: 35 秒
📊 变更: 3 个文件，+120/-0 行

📁 产物:
  - precheck-result.json (预检查)
  - changes-raw.json (变更收集)
  - changes-analysis.json (分析)
  - commit-message.md (消息)
  - commit-result.json (结果)

🔄 后续:
  - 断点续传: /commit --run-id=${RUN_ID}
  - 推送代码: git push
  - 创建 PR: /ccg:pr
```

## 运行目录结构

每次调用创建独立的运行目录：

```
.claude/committing/runs/20260114T103000Z/
├── state.json                 # 工作流状态
├── precheck-result.json       # Phase 1: 预检查结果
├── changes-raw.json           # Phase 2: 原始变更数据
├── changes-analysis.json      # Phase 3: 变更分析结果
├── commit-message.md          # Phase 4: 生成的提交信息
└── commit-result.json         # Phase 5: 提交执行结果
```

## 工作流阶段映射

| 阶段 | 原子技能          | 输入                  | 输出                  |
| ---- | ----------------- | --------------------- | --------------------- |
| 0    | precheck-runner   | run_dir               | precheck-result.json  |
| 1    | change-collector  | run_dir               | changes-raw.json      |
| 2    | change-analyzer   | changes-raw.json      | changes-analysis.json |
| 3    | message-generator | changes-analysis.json | commit-message.md     |
| 4    | commit-executor   | commit-message.md     | commit-result.json    |

## 错误处理

### run-id 不存在

```
❌ 错误: 运行目录不存在: .claude/committing/runs/20260114T999999Z
提示: 使用 /commit 创建新工作流
```

### state.json 损坏

```
⚠️  警告: 状态文件损坏或格式不正确
建议:
1. 手动修复 .claude/committing/runs/20260114T103000Z/state.json
2. 或创建新工作流: /commit
```

## 注意事项

1. **委托模式**: Command 不执行具体任务，只负责初始化和委托
2. **状态隔离**: 每个 run-id 有独立的目录和状态文件
3. **幂等性**: 相同 run-id 多次调用应安全（由 orchestrator 处理）
4. **路径传递**: 传递 RUN_DIR 和 RUN_ID，不传递文件内容

## 参考资源

- Agent: `agents/commit-orchestrator.md`
- Skills: `skills/committing/`
- 状态文件: `skills/shared/workflow/STATE_FILE.md`
