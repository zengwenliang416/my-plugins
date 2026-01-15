---
name: workflow-state-manager
description: |
  状态管理器 - 原子性读写 state.json，支持并发安全的状态更新。
  解决多模型并发写入的竞态条件，确保状态一致性。
allowed-tools:
  - Bash
skill_type: atomic
domain: shared/workflow
category: infrastructure
output_format: json
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（包含 state.json）
  - name: operation
    type: string
    required: true
    description: 操作类型（read/update-step/set-phase/set-status/add-artifact）
  - name: step
    type: string
    required: false
    description: 步骤名称（update-step 时必需）
  - name: status
    type: string
    required: false
    description: 状态值（pending/in_progress/done/failed，update-step 或 set-status 时必需）
  - name: phase
    type: string
    required: false
    description: 阶段名称（set-phase 时必需）
  - name: artifact_key
    type: string
    required: false
    description: 产物键名（add-artifact 时必需）
  - name: artifact_value
    type: string
    required: false
    description: 产物文件名（add-artifact 时必需）
  - name: error
    type: string
    required: false
    description: 错误信息（update-step status=failed 时可选）
  - name: output
    type: string
    required: false
    description: 输出文件路径（update-step status=done 时可选）
returns:
  success: boolean (操作是否成功)
  state: object (当前完整状态)
  error: string (失败时的错误信息)
---

# state-manager - 状态管理器

原子性管理 state.json 文件的读写，提供并发安全的状态更新操作。

## 核心职责

1. **原子读取**: 读取当前 state.json
2. **原子更新**: 带文件锁的写入操作
3. **步骤管理**: 更新步骤状态、时间戳、输出路径
4. **阶段跟踪**: 设置当前执行阶段
5. **产物记录**: 添加产物文件映射

## 并发安全设计

### 文件锁机制

使用 `flock` 确保同一时刻只有一个进程写入 state.json：

```bash
exec 200>"${STATE_FILE}.lock"
flock -x 200
# 临界区：读取、修改、写入 state.json
flock -u 200
```

### 重试策略

- 最多重试 3 次
- 每次间隔 100ms
- 超时后返回错误

## 操作类型

### 1. read - 读取状态

**用途**: 获取当前完整状态

**参数**:

- `run_dir`: 运行目录
- `operation`: "read"

**返回**:

```json
{
  "success": true,
  "state": {
    "workflow_version": "2.0",
    "domain": "committing",
    "run_id": "20260114T103000Z",
    "current_phase": "change-collector",
    "status": "in_progress",
    ...
  }
}
```

**调用示例**:

```bash
Skill("workflow-state-manager",
     args="run_dir=.claude/committing/runs/20260114T103000Z operation=read")
```

### 2. update-step - 更新步骤状态

**用途**: 更新指定步骤的状态、时间戳、输出路径

**参数**:

- `run_dir`: 运行目录
- `operation`: "update-step"
- `step`: 步骤名称（如 "change-collector"）
- `status`: 新状态（pending/in_progress/done/failed）
- `output` (可选): 输出文件路径（status=done 时）
- `error` (可选): 错误信息（status=failed 时）

**行为**:

- `status=in_progress`: 设置 `started_at` 为当前时间
- `status=done`: 设置 `completed_at` 和 `output`
- `status=failed`: 设置 `completed_at` 和 `error`
- 自动更新 `updated_at` 时间戳

**返回**:

```json
{
  "success": true,
  "state": {
    ...
    "steps": {
      "change-collector": {
        "status": "done",
        "started_at": "2026-01-14T10:30:00Z",
        "completed_at": "2026-01-14T10:30:15Z",
        "output": ".claude/committing/runs/20260114T103000Z/changes-raw.json"
      },
      ...
    },
    "updated_at": "2026-01-14T10:30:15Z"
  }
}
```

**调用示例**:

```bash
# 开始步骤
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=update-step step=change-collector status=in_progress")

# 完成步骤
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=update-step step=change-collector status=done output=${RUN_DIR}/changes-raw.json")

# 失败步骤
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=update-step step=precheck status=failed error='lint failed'")
```

### 3. set-phase - 设置当前阶段

**用途**: 更新 `current_phase` 字段

**参数**:

- `run_dir`: 运行目录
- `operation`: "set-phase"
- `phase`: 阶段名称（或 "done" 表示完成）

**返回**:

```json
{
  "success": true,
  "state": {
    ...
    "current_phase": "change-analyzer",
    "updated_at": "2026-01-14T10:30:20Z"
  }
}
```

**调用示例**:

```bash
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=set-phase phase=change-analyzer")

# 标记完成
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=set-phase phase=done")
```

### 4. set-status - 设置总体状态

**用途**: 更新工作流总体 `status` 字段

**参数**:

- `run_dir`: 运行目录
- `operation`: "set-status"
- `status`: 状态值（pending/in_progress/completed/failed/cancelled）

**返回**:

```json
{
  "success": true,
  "state": {
    ...
    "status": "completed",
    "updated_at": "2026-01-14T10:35:00Z"
  }
}
```

**调用示例**:

```bash
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=set-status status=completed")
```

### 5. add-artifact - 添加产物映射

**用途**: 在 `artifacts` 对象中添加产物文件映射

**参数**:

- `run_dir`: 运行目录
- `operation`: "add-artifact"
- `artifact_key`: 产物键名（如 "changes-raw"）
- `artifact_value`: 文件名（如 "changes-raw.json"）

**返回**:

```json
{
  "success": true,
  "state": {
    ...
    "artifacts": {
      "precheck-result": "precheck-result.json",
      "changes-raw": "changes-raw.json"
    },
    "updated_at": "2026-01-14T10:30:15Z"
  }
}
```

**调用示例**:

```bash
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=add-artifact artifact_key=changes-raw artifact_value=changes-raw.json")
```

## 实现逻辑

```bash
#!/bin/bash
set -euo pipefail

# ==================== 参数解析 ====================

RUN_DIR="${run_dir:-}"
OPERATION="${operation:-}"
STEP="${step:-}"
STATUS="${status:-}"
PHASE="${phase:-}"
ARTIFACT_KEY="${artifact_key:-}"
ARTIFACT_VALUE="${artifact_value:-}"
ERROR="${error:-}"
OUTPUT="${output:-}"

# 验证必需参数
if [ -z "$RUN_DIR" ]; then
    echo '{"success": false, "error": "Missing required argument: run_dir"}' >&2
    exit 1
fi

if [ -z "$OPERATION" ]; then
    echo '{"success": false, "error": "Missing required argument: operation"}' >&2
    exit 1
fi

STATE_FILE="${RUN_DIR}/state.json"
LOCK_FILE="${STATE_FILE}.lock"

# 检查 state.json 存在
if [ ! -f "$STATE_FILE" ]; then
    echo "{\"success\": false, \"error\": \"state.json not found: $STATE_FILE\"}" >&2
    exit 1
fi

# ==================== 文件锁函数 ====================

acquire_lock() {
    local max_retries=3
    local retry=0

    while [ $retry -lt $max_retries ]; do
        if exec 200>"$LOCK_FILE" && flock -x -w 1 200; then
            return 0
        fi
        retry=$((retry + 1))
        sleep 0.1
    done

    echo '{"success": false, "error": "Failed to acquire lock after 3 retries"}' >&2
    exit 1
}

release_lock() {
    flock -u 200 2>/dev/null || true
}

# ==================== 操作：read ====================

if [ "$OPERATION" = "read" ]; then
    STATE=$(cat "$STATE_FILE")
    echo "$STATE" | jq -c '{success: true, state: .}'
    exit 0
fi

# ==================== 原子更新操作 ====================

acquire_lock

# 读取当前状态
STATE=$(cat "$STATE_FILE")
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# 根据操作类型修改状态
case "$OPERATION" in
    "update-step")
        if [ -z "$STEP" ] || [ -z "$STATUS" ]; then
            release_lock
            echo '{"success": false, "error": "update-step requires: step, status"}' >&2
            exit 1
        fi

        # 更新步骤状态
        STATE=$(echo "$STATE" | jq \
            --arg step "$STEP" \
            --arg status "$STATUS" \
            --arg timestamp "$TIMESTAMP" \
            --arg output "$OUTPUT" \
            --arg error "$ERROR" \
            '
            .steps[$step].status = $status |
            .updated_at = $timestamp |
            if $status == "in_progress" then
                .steps[$step].started_at = $timestamp
            elif $status == "done" then
                .steps[$step].completed_at = $timestamp |
                if $output != "" then .steps[$step].output = $output else . end
            elif $status == "failed" then
                .steps[$step].completed_at = $timestamp |
                if $error != "" then .steps[$step].error = $error else . end
            else . end
            ')
        ;;

    "set-phase")
        if [ -z "$PHASE" ]; then
            release_lock
            echo '{"success": false, "error": "set-phase requires: phase"}' >&2
            exit 1
        fi

        STATE=$(echo "$STATE" | jq \
            --arg phase "$PHASE" \
            --arg timestamp "$TIMESTAMP" \
            '.current_phase = $phase | .updated_at = $timestamp')
        ;;

    "set-status")
        if [ -z "$STATUS" ]; then
            release_lock
            echo '{"success": false, "error": "set-status requires: status"}' >&2
            exit 1
        fi

        STATE=$(echo "$STATE" | jq \
            --arg status "$STATUS" \
            --arg timestamp "$TIMESTAMP" \
            '.status = $status | .updated_at = $timestamp')
        ;;

    "add-artifact")
        if [ -z "$ARTIFACT_KEY" ] || [ -z "$ARTIFACT_VALUE" ]; then
            release_lock
            echo '{"success": false, "error": "add-artifact requires: artifact_key, artifact_value"}' >&2
            exit 1
        fi

        STATE=$(echo "$STATE" | jq \
            --arg key "$ARTIFACT_KEY" \
            --arg value "$ARTIFACT_VALUE" \
            --arg timestamp "$TIMESTAMP" \
            '.artifacts[$key] = $value | .updated_at = $timestamp')
        ;;

    *)
        release_lock
        echo "{\"success\": false, \"error\": \"Unknown operation: $OPERATION\"}" >&2
        exit 1
        ;;
esac

# 写回文件（原子写入：先写临时文件，再 mv）
TEMP_FILE="${STATE_FILE}.tmp.$$"
echo "$STATE" > "$TEMP_FILE"
mv -f "$TEMP_FILE" "$STATE_FILE"

release_lock

# 返回更新后的状态
echo "$STATE" | jq -c '{success: true, state: .}'

exit 0
```

## 在 Orchestrator 中的使用

### 典型工作流模式

```yaml
Phase N 开始:
  1. set-phase: 标记当前阶段
  2. update-step: 设置 status=in_progress
  3. 调用 Skill 执行任务
  4. 验证输出（file-validator）
  5. update-step: 设置 status=done/failed
  6. add-artifact: 记录产物文件
  7. set-phase: 进入下一阶段

完成:
  8. set-phase: phase=done
  9. set-status: status=completed
```

### 集成示例（commit-orchestrator）

```bash
# Phase 1 开始
echo "开始 Phase 1: 收集变更"

# 1. 标记阶段
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=set-phase phase=change-collector")

# 2. 标记步骤开始
Skill("workflow-state-manager",
     args="run_dir=${RUN_DIR} operation=update-step step=change-collector status=in_progress")

# 3. 执行任务
Skill("committing:change-collector", args="run_dir=${RUN_DIR}")

# 4. 验证输出
validation=$(Skill("workflow-file-validator",
                   args="file_path=${RUN_DIR}/changes-raw.json required_fields='[\"branch\",\"staged\"]'"))

valid=$(echo "$validation" | jq -r '.valid')

if [ "$valid" = "true" ]; then
    # 5. 标记步骤完成
    Skill("workflow-state-manager",
         args="run_dir=${RUN_DIR} operation=update-step step=change-collector status=done output=${RUN_DIR}/changes-raw.json")

    # 6. 记录产物
    Skill("workflow-state-manager",
         args="run_dir=${RUN_DIR} operation=add-artifact artifact_key=changes-raw artifact_value=changes-raw.json")

    echo "✅ Phase 1 完成"
else
    # 5. 标记步骤失败
    errors=$(echo "$validation" | jq -r '.errors | join(", ")')
    Skill("workflow-state-manager",
         args="run_dir=${RUN_DIR} operation=update-step step=change-collector status=failed error='${errors}'")

    # 询问用户
    AskUserQuestion: "Phase 1 失败: ${errors}. 重试/跳过/中止？"
fi
```

## 错误处理

### 错误场景 1: state.json 不存在

**输出**:

```json
{
  "success": false,
  "error": "state.json not found: .claude/committing/runs/xxx/state.json"
}
```

### 错误场景 2: 获取锁失败

**输出**:

```json
{
  "success": false,
  "error": "Failed to acquire lock after 3 retries"
}
```

**原因**: 其他进程持有锁超过 3 秒（并发冲突）

### 错误场景 3: 缺少必需参数

**输出**:

```json
{
  "success": false,
  "error": "update-step requires: step, status"
}
```

### 错误场景 4: 未知操作

**输出**:

```json
{
  "success": false,
  "error": "Unknown operation: invalid-op"
}
```

## 并发场景

### 场景 1: 双模型并行审查

```
Codex Agent:  update-step review-backend in_progress  (加锁 → 写入 → 解锁)
   ↓ (同时)
Gemini Agent: update-step review-frontend in_progress (等待锁 → 加锁 → 写入 → 解锁)
```

### 场景 2: 主编排器 + 子模块同时写入

```
Orchestrator: set-phase phase=analyzer        (加锁 → 写入 → 解锁)
   ↓ (几乎同时)
Analyzer Skill: (内部调用 state-manager)     (等待锁 → 更新 → 解锁)
```

**结果**: 文件锁确保顺序写入，避免数据损坏

## 状态查询辅助函数

### 从输出中提取状态字段

```bash
# 获取当前阶段
current_phase=$(Skill("workflow-state-manager",
                      args="run_dir=${RUN_DIR} operation=read") | jq -r '.state.current_phase')

# 获取步骤状态
step_status=$(Skill("workflow-state-manager",
                    args="run_dir=${RUN_DIR} operation=read") | jq -r '.state.steps["change-collector"].status')

# 获取产物路径
artifact_path=$(Skill("workflow-state-manager",
                      args="run_dir=${RUN_DIR} operation=read") | jq -r '.state.artifacts["changes-raw"]')
```

## 设计原则

1. **原子性**: 使用文件锁和临时文件确保写入原子性
2. **并发安全**: flock 机制防止竞态条件
3. **重试策略**: 获取锁失败自动重试
4. **最小粒度**: 每个操作只更新必要的字段
5. **时间戳一致性**: 所有更新自动刷新 `updated_at`

## 约束和限制

1. **依赖 flock**: Linux/macOS 原生支持，Windows 需要 WSL
2. **锁超时**: 最长等待 3 秒（可能不足以应对极慢的 I/O）
3. **单文件锁**: 同一 run_dir 的所有操作共享一个锁（可能过度串行化）
4. **不支持事务**: 多个操作不能作为一个原子单元执行

## 测试建议

### 单元测试

```bash
# 测试 1: 读取状态
result=$(Skill("workflow-state-manager",
               args="run_dir=.claude/committing/runs/20260114T103000Z operation=read"))
echo "$result" | jq '.state.domain'
# 预期: "committing"

# 测试 2: 更新步骤状态
Skill("workflow-state-manager",
     args="run_dir=.claude/committing/runs/20260114T103000Z operation=update-step step=precheck status=in_progress")

# 测试 3: 设置阶段
Skill("workflow-state-manager",
     args="run_dir=.claude/committing/runs/20260114T103000Z operation=set-phase phase=change-collector")

# 测试 4: 添加产物
Skill("workflow-state-manager",
     args="run_dir=.claude/committing/runs/20260114T103000Z operation=add-artifact artifact_key=test artifact_value=test.json")
```

### 并发测试

```bash
# 启动 10 个并发写入
for i in {1..10}; do
    (Skill("workflow-state-manager",
           args="run_dir=.claude/test/runs/xxx operation=add-artifact artifact_key=test$i artifact_value=file$i.json")) &
done
wait

# 验证：所有 10 个产物都应成功写入
cat .claude/test/runs/xxx/state.json | jq '.artifacts | length'
# 预期: 10
```

## 性能指标

| 指标         | 目标   | 说明                       |
| ------------ | ------ | -------------------------- |
| 读取时间     | < 10ms | 无锁，直接读文件           |
| 写入时间     | < 50ms | 加锁、修改、写入、解锁     |
| 锁等待时间   | < 1s   | 正常情况下几乎无等待       |
| 并发冲突率   | < 5%   | 10 个并发写入，<1 个需重试 |
| 状态文件大小 | < 10KB | 典型 5-phase 工作流        |

## 版本历史

- v2.0: 初始实现，V2 Contract 标准，文件锁并发控制

## 参考文档

| 文档                                      | 用途                |
| ----------------------------------------- | ------------------- |
| `docs/orchestrator-contract.md`           | V2 Contract 规范    |
| `skills/shared/workflow/STATE_FILE_V2.md` | state.json V2 格式  |
| `docs/orchestrator-to-skills-mapping.md`  | Orchestrator 映射表 |
