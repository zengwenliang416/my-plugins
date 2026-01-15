# Orchestrator 统一契约规范

**版本**: 2.0
**基于**: Phase 1 writer-orchestrator 成功模式
**适用范围**: 所有 orchestrator (commit, debug, dev, test, review, plan, image, social, ui-ux, migration-init)

## 1. 三层架构模式

```
Command 层（入口）
    ↓ 传递参数
Agent 层（编排）
    ↓ 调用 Skill
Skill 层（执行）
```

### 1.1 Command 层职责

**必须做**:

- 参数解析和验证
- 创建 run-id（UTC 时间戳格式：`YYYYMMDDTHHMMSSZ`）
- 初始化运行目录结构（`runs/`）
- 初始化状态文件（`state.json`）
- 委托给对应的 Orchestrator Agent

**不能做**:

- 执行具体业务逻辑
- 调用 Skill
- 管理状态更新

**标准模板**:

```yaml
---
description: {工作流描述}
argument-hint: <required-args> [--run-id=xxx] [--options]
allowed-tools: ["Read", "Write", "Bash", "Task"]
---

# /{command-name} - {工作流名称}

## 使用方式
/{command-name} <args> [--run-id=xxx]

## 执行流程
1. 参数解析
2. 生成/解析 run-id
3. 创建运行目录：.claude/{domain}/runs/${RUN_ID}/
4. 初始化 state.json
5. 委托给 {domain}-orchestrator
```

### 1.2 Agent 层职责（Orchestrator）

**必须做**:

- 编排工作流的多个 Phase
- 管理 state.json 的读写和更新
- 处理断点续传逻辑
- 协调并行任务（如适用）
- 处理错误和用户交互

**不能做**:

- 直接执行具体任务（必须通过 Skill 调用）
- 直接读写业务文件（通过 Skill）
- 绕过状态管理

**标准模板**:

```yaml
---
name: {domain}-orchestrator
description: |
  【触发条件】由 /{command} 调用，负责编排 {domain} 工作流。
  【核心产出】完整的 runs/ 目录，包含所有中间产物和最终结果。
  【不触发】用户直接调用单个 Skill，或非 {domain} 类任务。
model: inherit
color: {color}
tools: ["Read", "Write", "Bash", "Skill", "Task", "AskUserQuestion"]
---

# {Domain} Orchestrator

## 职责
编排 {domain} 工作流的 N 个阶段，管理状态文件，处理断点续传。

## 输入
从 /{command} Command 接收：
- ${RUN_DIR}: 工作目录路径
- ${RUN_DIR}/input.md: 输入数据
- ${RUN_DIR}/state.json: 状态文件

## 工作流阶段
### Phase 1: {phase-name}
- 调用: Skill("{domain}:{skill-name}")
- 输入: ${RUN_DIR}/{input-file}
- 输出: ${RUN_DIR}/{output-file}
- 成功标准: {criteria}
- 失败处理: {strategy}
```

### 1.3 Skill 层职责

**必须做**:

- 接收文件路径作为输入（不接收文件内容）
- 处理单一、原子化的任务
- 输出结果到指定文件路径
- 返回输出文件路径

**不能做**:

- 管理状态文件
- 调用其他 Skill（除非明确设计为组合 Skill）
- 处理工作流逻辑

**标准模板**:

```yaml
---
name: {skill-name}
description: {单一职责描述}
arguments:
  - name: input_path
    type: string
    description: 输入文件路径
  - name: output_path
    type: string
    description: 输出文件路径
---

# {Skill Name}

## 输入
- input_path: 输入文件的完整路径

## 处理
{具体处理逻辑}

## 输出
- output_path: 输出文件的完整路径
- 返回值: 输出文件路径
```

## 2. 标准输入/输出契约

### 2.1 Command → Agent

**传递内容**:

```json
{
  "RUN_DIR": ".claude/{domain}/runs/{run-id}/",
  "RUN_ID": "{run-id}",
  "MODE": "new|resume",
  "OPTIONS": {
    "option1": "value1",
    "option2": "value2"
  }
}
```

**传递方式**:

- 通过 Task tool 的 prompt 参数
- 使用模板字符串明确标识变量

**示例**:

```
Task(
  subagent_type="{domain}-orchestrator",
  prompt="请执行 {domain} 工作流。

  运行参数:
  - RUN_DIR: ${RUN_DIR}
  - RUN_ID: ${RUN_ID}
  - MODE: ${MODE}

  状态文件位置: ${RUN_DIR}/state.json
  输入文件位置: ${RUN_DIR}/input.md

  请按照 {domain}-orchestrator 的规范执行各阶段..."
)
```

### 2.2 Agent → Skill

**传递内容**: 仅文件路径，不传递文件内容

**标准格式**:

```
Skill("{domain}:{skill-name}",
     args="input_path=${RUN_DIR}/input.md output_path=${RUN_DIR}/output.md")
```

**禁止**:

```
# ❌ 错误：传递文件内容
content = Read(${RUN_DIR}/input.md)
Skill("{domain}:{skill-name}", args="content=${content}")

# ✅ 正确：传递文件路径
Skill("{domain}:{skill-name}", args="input_path=${RUN_DIR}/input.md")
```

### 2.3 Skill → Agent

**返回内容**:

- 输出文件路径
- 可选：元数据（如字数统计、处理时长）

**标准格式**:

```json
{
  "output_path": "${RUN_DIR}/output.md",
  "metadata": {
    "word_count": 2000,
    "processing_time": "3.5s"
  }
}
```

## 3. run_dir 标准结构

### 3.1 目录层级

```
.claude/
└── {domain}/                    # 领域目录
    └── runs/                    # 运行记录目录
        └── {run-id}/            # 单次运行目录（UTC 时间戳）
            ├── state.json       # 状态文件（必需）
            ├── input.md         # 输入文件（必需）
            ├── {phase1-output}.md
            ├── {phase2-output}.md
            ├── ...
            └── final.md         # 最终输出（如适用）
```

### 3.2 run-id 格式

**标准**: UTC 时间戳格式 `YYYYMMDDTHHMMSSZ`

**生成方式**:

```bash
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
```

**示例**: `20260114T103000Z`

**用途**:

- 唯一标识一次工作流运行
- 按时间排序
- 支持断点续传

### 3.3 文件命名规范

| 文件类型     | 命名规则                          | 示例                        |
| ------------ | --------------------------------- | --------------------------- |
| 输入文件     | `input.md`                        | `input.md`                  |
| 状态文件     | `state.json`                      | `state.json`                |
| Phase 输出   | `{phase-name}.md`                 | `analysis.md`, `outline.md` |
| 并行任务输出 | `{phase-name}-{variant}.md`       | `draft-a.md`, `draft-b.md`  |
| 最终输出     | `final.md` 或 `{domain}-final.md` | `final.md`                  |

## 4. state.json 标准格式（V2）

基于 `skills/shared/workflow/STATE_FILE_V2.md`。

### 4.1 核心字段

```json
{
  "run_id": "20260114T103000Z",
  "run_dir": ".claude/{domain}/runs/20260114T103000Z",
  "created_at": "2026-01-14T10:30:00Z",
  "updated_at": "2026-01-14T10:35:00Z",
  "domain": "{domain}",
  "goal": "用户目标描述",
  "current_phase": "{phase-name}",
  "steps": {
    "{step-id}": {
      "status": "pending|in_progress|completed|failed",
      "started_at": "2026-01-14T10:30:00Z",
      "completed_at": "2026-01-14T10:32:00Z",
      "output": "{output-file}",
      "error": "错误信息（如失败）"
    }
  }
}
```

### 4.2 步骤状态流转

```
pending → in_progress → completed
                      ↘ failed
```

**状态定义**:

- `pending`: 待执行
- `in_progress`: 执行中
- `completed`: 成功完成
- `failed`: 执行失败

### 4.3 并行执行扩展（可选）

```json
{
  "parallel_execution": {
    "max_concurrency": 8,
    "active_tasks": 2,
    "completed_tasks": 0,
    "failed_tasks": 0
  },
  "subtasks": [
    {
      "id": "{task-id}",
      "status": "pending|running|completed|failed",
      "task_id": "{background-task-id}",
      "output": "{output-file}"
    }
  ]
}
```

## 5. 错误分类体系

### 5.1 错误类型

| 类型                | 描述       | 处理策略             |
| ------------------- | ---------- | -------------------- |
| `recoverable`       | 可自动恢复 | 自动重试（max 3 次） |
| `user_intervention` | 需用户干预 | 询问用户决策         |
| `fatal`             | 致命错误   | 终止工作流，保留状态 |

### 5.2 错误处理流程

```yaml
on_error:
  1. 更新 state.json: status = "failed", error = "{message}"
  2. 根据错误类型：
     - recoverable:
         if iterations < max_iterations:
           重试当前 phase
         else:
           转为 user_intervention
     - user_intervention:
         AskUserQuestion: [重试, 跳过, 手动修复, 中止]
     - fatal:
         展示错误信息
         保存状态文件
         终止工作流
  3. 记录错误日志到 ${RUN_DIR}/errors.log
```

### 5.3 常见错误示例

```json
{
  "error_catalog": {
    "skill_not_found": {
      "type": "fatal",
      "message": "Skill '{skill-name}' 不存在",
      "recovery": null
    },
    "file_not_found": {
      "type": "user_intervention",
      "message": "输入文件 '{file}' 不存在",
      "recovery": "用户提供文件或重新生成"
    },
    "timeout": {
      "type": "recoverable",
      "message": "任务超时（{duration}s）",
      "recovery": "自动重试，增加超时时间"
    },
    "validation_failed": {
      "type": "user_intervention",
      "message": "输出验证失败：{reason}",
      "recovery": "用户确认是否继续"
    }
  }
}
```

## 6. 交互点规范

### 6.1 何时询问用户

**必须询问**:

- Phase 失败后的处理选择
- 多个选项需要用户选择（如多个草稿版本）
- 关键决策点（如是否应用修复方案）
- 检测到潜在风险（如大量文件删除）

**不应询问**:

- 可自动恢复的错误
- 明确的流程步骤
- 已有明确规则的决策

### 6.2 交互格式

**使用 AskUserQuestion 工具**:

```
AskUserQuestion({
  "questions": [
    {
      "question": "Phase 3 写作失败，如何处理？",
      "header": "失败处理",
      "options": [
        {
          "label": "重试（推荐）",
          "description": "使用相同参数重新执行"
        },
        {
          "label": "跳过",
          "description": "跳过此步骤，继续后续流程"
        },
        {
          "label": "中止",
          "description": "终止工作流，保留当前状态"
        }
      ],
      "multiSelect": false
    }
  ]
})
```

### 6.3 Hard Stop 点

**定义**: 必须等待用户确认才能继续的检查点

**标记方式**:

```yaml
### Phase N: {phase-name}
- **Hard Stop**: 展示 {artifact}，用户确认是否正确
```

**实现**:

```
# 展示结果
展示 ${RUN_DIR}/{output}.md 的摘要

# 询问用户
AskUserQuestion({
  "question": "请确认 {output} 是否正确？",
  "options": [
    {"label": "确认", "description": "结果正确，继续"},
    {"label": "修改", "description": "手动编辑后继续"},
    {"label": "重做", "description": "重新执行此阶段"}
  ]
})
```

## 7. 并行执行约束

### 7.1 适用场景

- 多个独立的 Skill 调用（无依赖）
- 多模型协作（Codex + Gemini）
- 多变体生成（如 3 个不同风格的草稿）

### 7.2 实现模式

**使用 Task tool 的 run_in_background=true**:

```
# 并行启动
task1_id = Task(
  subagent_type="writer-agent",
  prompt="生成风格A草稿...",
  run_in_background=true
)

task2_id = Task(
  subagent_type="writer-agent",
  prompt="生成风格B草稿...",
  run_in_background=true
)

# 等待完成
TaskOutput(task1_id, block=true)
TaskOutput(task2_id, block=true)
```

### 7.3 并发控制

**全局约束**:

```json
{
  "parallel_execution": {
    "max_concurrency": 8 // 最多同时运行 8 个后台任务
  }
}
```

**实现逻辑**:

```python
active_tasks = len([t for t in subtasks if t.status == "running"])
if active_tasks >= max_concurrency:
    wait_for_any_task_to_complete()
else:
    launch_new_task()
```

### 7.4 文件隔离

**并行任务输出必须隔离**:

```
# ✅ 正确：不同文件名
draft-a.md
draft-b.md
draft-c.md

# ❌ 错误：同名文件（会冲突）
draft.md  (被 3 个任务同时写入)
```

## 8. 断点续传

### 8.1 检测逻辑

```python
if state.json 存在:
    for step in steps:
        if step.status == "completed" and output_file_exists:
            跳过此步骤
        elif step.status == "failed":
            询问用户：重试 or 跳过 or 中止
        elif step.status == "in_progress":
            检查输出文件:
                存在 → 标记为 completed
                不存在 → 重新执行
        else:  # pending
            执行此步骤
```

### 8.2 输出文件验证

**即使 status = "completed"，也验证输出文件**:

```python
def validate_step_output(step):
    if step.status == "completed":
        if not file_exists(step.output):
            log("输出文件缺失，重新执行")
            step.status = "pending"
        elif not validate_file_content(step.output):
            log("输出文件无效，重新执行")
            step.status = "pending"
```

### 8.3 用户交互

```
📋 检查工作流状态: ${RUN_DIR}

✅ Phase 1: analyzer - 已完成 (analysis.md)
✅ Phase 2: outliner - 已完成 (outline.md)
❌ Phase 3: writer-1 - 失败 (草稿生成超时)
⏳ Phase 3: writer-2 - 进行中...
⏸️  Phase 4: polisher - 待执行

🔧 操作建议:
1. 重试 writer-1？[Y/n]
2. 等待 writer-2 完成后继续？[Y/n]
```

## 9. 命名规范

### 9.1 Domain 命名

| Orchestrator                | Domain         | 产物目录                |
| --------------------------- | -------------- | ----------------------- |
| commit-orchestrator         | `committing`   | `.claude/committing/`   |
| debug-orchestrator          | `debugging`    | `.claude/debugging/`    |
| dev-orchestrator            | `developing`   | `.claude/developing/`   |
| test-orchestrator           | `testing`      | `.claude/testing/`      |
| review-orchestrator         | `reviewing`    | `.claude/reviewing/`    |
| plan-orchestrator           | `planning`     | `.claude/planning/`     |
| image-orchestrator          | `imaging`      | `.claude/imaging/`      |
| social-post-orchestrator    | `writing`      | `.claude/writing/`      |
| ui-ux-design-orchestrator   | `ui-ux-design` | `.claude/ui-ux-design/` |
| migration-init-orchestrator | `migration`    | `.claude/migration/`    |

### 9.2 Skill 命名

**格式**: `{domain}:{skill-name}`

**示例**:

- `writing:analyzer`
- `writing:outliner`
- `writing:writer`
- `debugging:symptom-collector`
- `debugging:hypothesis-generator`

## 10. 验收清单

每个 Orchestrator 实施完成后，必须通过以下检查：

- [ ] Command 层正确初始化 run-id 和 state.json
- [ ] Agent 层只编排不执行，所有任务通过 Skill 调用
- [ ] Skill 层只接收/返回文件路径，不接收文件内容
- [ ] state.json 格式符合 V2 规范
- [ ] 支持断点续传（中断后重新运行能继续）
- [ ] 错误处理正确分类（recoverable/user_intervention/fatal）
- [ ] 并行任务（如适用）使用 run_in_background
- [ ] 并行任务输出文件隔离（不同文件名）
- [ ] Hard Stop 点正确实现（AskUserQuestion）
- [ ] 输出文件验证（即使 status=completed 也检查文件）

## 11. 参考资源

- Phase 1 成功案例: `commands/article.md`, `agents/writer-orchestrator.md`
- 状态文件规范: `skills/shared/workflow/STATE_FILE_V2.md`
- 错误处理: `skills/_shared/error/`
- 并行执行: `docs/parallel-execution-guide.md`
- 模板: `skills/shared/workflow/ORCHESTRATOR_TEMPLATE.md`（即将更新）
