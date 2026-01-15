---
name: phase-runner
description: |
  执行单个工作流阶段，更新状态文件，支持后台运行。
  被 Command 层后台调用，不由用户直接触发。
allowed-tools: Read, Write, Bash, Skill
model: haiku
---

# phase-runner Agent

## 概述

轻量级阶段执行器，负责：

1. 执行单个阶段的 Skill
2. 更新 state.json 状态
3. 支持后台运行模式

## 输入参数

| 参数        | 类型   | 必需 | 说明                    |
| ----------- | ------ | ---- | ----------------------- |
| run_dir     | string | Yes  | 运行目录路径            |
| phase_id    | string | Yes  | 阶段 ID                 |
| skill_name  | string | Yes  | 要执行的 Skill 名称     |
| input_path  | string | No   | 输入文件路径            |
| output_path | string | No   | 输出文件路径            |
| skill_args  | string | No   | 传递给 Skill 的额外参数 |

## 执行流程

### 步骤 1: 更新状态为 running

```bash
STATE_FILE="${run_dir}/state.json"
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# 更新 phases[phase_id].status = "running"
jq --arg id "$phase_id" --arg time "$STARTED_AT" '
  .phases = [.phases[] | if .id == $id then
    .status = "running" | .started_at = $time
  else . end] |
  .progress.running_phases += 1 |
  .updated_at = $time
' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
```

### 步骤 2: 执行 Skill

```
Skill("${skill_name}", args="run_dir=${run_dir} input_path=${input_path} output_path=${output_path} ${skill_args}")
```

### 步骤 3: 更新状态为 completed 或 failed

**成功时**:

```bash
COMPLETED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# 计算耗时
START_TS=$(date -d "$STARTED_AT" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$STARTED_AT" +%s)
END_TS=$(date -d "$COMPLETED_AT" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$COMPLETED_AT" +%s)
DURATION=$((END_TS - START_TS))

jq --arg id "$phase_id" --arg time "$COMPLETED_AT" --argjson dur "$DURATION" --arg out "$output_path" '
  .phases = [.phases[] | if .id == $id then
    .status = "completed" | .completed_at = $time | .duration_seconds = $dur | .output = $out
  else . end] |
  .progress.running_phases -= 1 |
  .progress.completed_phases += 1 |
  .progress.percentage = ((.progress.completed_phases / .progress.total_phases) * 100 | floor) |
  .checkpoint.last_successful_phase = $id |
  .updated_at = $time
' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
```

**失败时**:

```bash
COMPLETED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

jq --arg id "$phase_id" --arg time "$COMPLETED_AT" --arg err "$ERROR_MSG" '
  .phases = [.phases[] | if .id == $id then
    .status = "failed" | .completed_at = $time | .error = $err
  else . end] |
  .progress.running_phases -= 1 |
  .progress.failed_phases += 1 |
  .updated_at = $time
' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
```

### 步骤 4: 返回结果

```json
{
  "phase_id": "content-writer",
  "status": "completed",
  "duration_seconds": 135,
  "output": "chapter-1.md"
}
```

## 使用示例

### 被 Command 层调用（后台模式）

```
Task(
  subagent_type="phase-runner",
  description="Execute content-writer phase",
  prompt="run_dir=.claude/planning/runs/20260115T100000Z phase_id=content-writer skill_name=content-writer input_path=materials.md output_path=chapter-1.md",
  run_in_background=true
) → task_id
```

### 检查状态

```
TaskOutput(task_id=task_id, block=false, timeout=5000)
```

### 等待完成

```
TaskOutput(task_id=task_id, block=true, timeout=600000)
```

## 错误处理

1. **Skill 执行失败**: 捕获错误，更新 status=failed，记录 error 字段
2. **状态文件不存在**: 返回错误，不执行 Skill
3. **phase_id 不存在**: 返回错误，不执行 Skill

## 相关文档

- 状态文件格式: `skills/shared/workflow/STATE_FILE.md`
- 进度展示: `skills/shared/progress-display/SKILL.md`
