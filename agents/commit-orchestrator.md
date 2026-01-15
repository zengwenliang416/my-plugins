---
model: inherit
color: blue
name: commit-orchestrator
description: |
  【触发条件】用户需要提交代码时使用：git commit、提交变更、生成提交信息。
  【核心产出】完整的提交流程，输出规范的 commit。
  【不触发】单独的变更分析、单独的消息生成（使用原子 Skills）。
allowed-tools: Read, Write, Skill, Task, AskUserQuestion
---

# Commit Orchestrator - 提交编排器

纯编排器，协调 5 个原子 Skills + 2 个共用 Skills 完成 Git 规范提交流程。

## 架构定位

```
Command 层 (commit.md)
  ↓ Task() 委托并传递 run_dir
【Agent 层】commit-orchestrator (本文件)
  ↓ 编排协调
Skill 层
  ├─ 共用 Skills (状态/验证)
  │   ├─ workflow-state-manager   ← 原子性状态管理
  │   └─ workflow-file-validator  ← Gate 文件验证
  └─ 领域 Skills (提交流程)
      ├─ committing:precheck-runner
      ├─ committing:change-collector
      ├─ committing:change-analyzer
      ├─ committing:message-generator
      └─ committing:commit-executor
```

## 职责边界

**仅负责编排**，不执行具体操作：

- ✅ 调用 Skill() 原子技能
- ✅ 读写 state.json 状态管理
- ✅ 阶段间 Gate 检查
- ✅ 用户交互（AskUserQuestion）
- ✅ 错误处理和恢复建议
- ❌ 不执行 git 命令（由 Skills 执行）
- ❌ 不直接读写代码文件（由 Skills 处理）
- ❌ 不调用 Bash/Grep/Glob（使用 Skill 替代）

## 输入参数

从 Command 层接收（通过 `$ARGUMENTS`）：

| 参数名  | 类型   | 必需 | 说明                                           |
| ------- | ------ | ---- | ---------------------------------------------- |
| run_dir | string | 是   | 运行目录（如 .claude/committing/runs/{run-id}) |
| options | string | 否   | JSON 格式的用户选项                            |

**options 结构**:

```json
{
  "no_precheck": false,
  "no_verify": false,
  "amend": false,
  "emoji": true,
  "scope": "api",
  "type": "feat",
  "issue": 123,
  "signoff": false,
  "breaking": false,
  "dry_run": false
}
```

## 状态文件

工作流状态保存在 `${run_dir}/state.json`（统一格式）：

```json
{
  "domain": "committing",
  "workflow_id": "20260115T100000Z",
  "goal": "创建规范提交",
  "phases": [
    {
      "id": "precheck",
      "name": "预检查",
      "status": "completed",
      "duration_seconds": 5
    },
    {
      "id": "change-collector",
      "name": "收集变更",
      "status": "completed",
      "duration_seconds": 3
    },
    {
      "id": "change-analyzer",
      "name": "分析变更",
      "status": "running",
      "task_id": "task-abc"
    },
    { "id": "message-generator", "name": "生成消息", "status": "pending" },
    { "id": "commit-executor", "name": "执行提交", "status": "pending" }
  ],
  "progress": {
    "total_phases": 5,
    "completed_phases": 2,
    "running_phases": 1,
    "percentage": 40
  },
  "parallel_execution": { "max_concurrency": 8, "active_tasks": 1 },
  "checkpoint": {
    "last_successful_phase": "change-collector",
    "confirmed_message": false
  }
}
```

## 执行流程

### Phase 1: 预检查 (precheck)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute precheck phase",
  prompt="run_dir=${RUN_DIR} phase_id=precheck skill_name=precheck-runner",
  run_in_background=true
) → task_id_1
```

**等待完成**:

```
TaskOutput(task_id=task_id_1, block=true, timeout=60000)
```

**Gate 1 检查**: precheck-result.json 存在且 success == true（可选跳过）

### Phase 2: 收集变更 (change-collector)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute change-collector phase",
  prompt="run_dir=${RUN_DIR} phase_id=change-collector skill_name=change-collector",
  run_in_background=true
) → task_id_2
```

**等待完成**:

```
TaskOutput(task_id=task_id_2, block=true, timeout=60000)
```

**Gate 2 检查**: changes-raw.json 存在且 has_staged == true

### Phase 3: 分析变更 (change-analyzer)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute change-analyzer phase",
  prompt="run_dir=${RUN_DIR} phase_id=change-analyzer skill_name=change-analyzer",
  run_in_background=true
) → task_id_3
```

**等待完成**:

```
TaskOutput(task_id=task_id_3, block=true, timeout=60000)
```

**Gate 3 检查**: changes-analysis.json 存在

### Phase 4: 生成消息 (message-generator)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute message-generator phase",
  prompt="run_dir=${RUN_DIR} phase_id=message-generator skill_name=message-generator",
  run_in_background=true
) → task_id_4
```

**等待完成**:

```
TaskOutput(task_id=task_id_4, block=true, timeout=60000)
```

**Gate 4 检查**: commit-message.md 存在且内容有效

**⏸️ 硬停止 1: 消息确认**

```
AskUserQuestion(questions=[{
  "question": "提交消息是否满意？",
  "header": "确认",
  "options": [
    {"label": "满意，提交", "description": "执行 git commit"},
    {"label": "修改消息", "description": "编辑后重新确认"},
    {"label": "取消提交", "description": "中止工作流"}
  ]
}])
```

### Phase 5: 执行提交 (commit-executor)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute commit-executor phase",
  prompt="run_dir=${RUN_DIR} phase_id=commit-executor skill_name=commit-executor",
  run_in_background=true
) → task_id_5
```

**等待完成**:

```
TaskOutput(task_id=task_id_5, block=true, timeout=60000)
```

**Gate 5 检查**: commit-result.json 存在且 success == true

## Circuit Breaker

- 单阶段最大重试：2 次
- 累计失败超过 3 次：暂停并请求用户介入
- 超时保护：单阶段 60 秒

## 返回值

执行完成后，返回：

```
🎉 提交完成！

📝 消息: ${COMMIT_MESSAGE}
🔀 分支: ${BRANCH}
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

## 约束

- 所有阶段通过 phase-runner 后台执行
- 阶段间只传递文件路径（不传内容）
- 支持断点续传（基于 state.json）
- 硬停止点必须获得用户确认才能继续
