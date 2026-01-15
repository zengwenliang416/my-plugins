---
name: workflow-run-initializer
description: |
  运行初始化器 - 创建独立运行环境，生成 state.json V2 格式。
  所有 Orchestrator 的第一步，确保状态隔离和可追溯性。
allowed-tools:
  - Bash
skill_type: atomic
domain: shared/workflow
category: infrastructure
output_format: json
arguments:
  - name: domain
    type: string
    required: true
    description: 工作流域名（如 committing, debugging, developing）
  - name: goal
    type: string
    required: true
    description: 本次运行的目标描述（如 "创建规范提交"）
  - name: phases
    type: string
    required: true
    description: JSON 数组格式的阶段列表（如 '["precheck","collector","analyzer"]'）
  - name: options
    type: string
    required: false
    description: JSON 格式的初始选项（如 '{"emoji": true}'）
  - name: parent_dir
    type: string
    required: false
    description: 父目录路径（默认 .claude）
returns:
  success: boolean
  run_id: string (UTC 时间戳格式 YYYYMMDDTHHMMSSZ)
  run_dir: string (完整路径)
  mode: string (new | resume)
  created_files: array (创建的文件列表)
  error: string (失败时的错误信息)
---

# run-initializer - 运行初始化器

创建独立的运行环境目录，初始化 state.json V2 格式，确保每次工作流执行都有隔离的状态空间。

## 核心职责

1. **生成 run-id**: UTC 时间戳格式（`YYYYMMDDTHHMMSSZ`）
2. **创建目录结构**: `.claude/{domain}/runs/{run-id}/`
3. **初始化 state.json**: V2 格式，包含 phases、steps、options、artifacts
4. **返回 JSON 输出**: 供 Orchestrator 使用的结构化信息

## 参数说明

### domain (必需)

工作流域名，决定运行目录的位置。

**示例**:

```
committing   → .claude/committing/runs/{run-id}/
debugging    → .claude/debugging/runs/{run-id}/
developing   → .claude/developing/runs/{run-id}/
testing      → .claude/testing/runs/{run-id}/
```

### goal (必需)

本次运行的目标描述，记录在 state.json 中。

**示例**:

```
"创建规范提交"
"调试登录问题"
"实现用户认证功能"
"生成单元测试"
```

### phases (必需)

JSON 数组格式的阶段列表，定义工作流的执行步骤。

**示例**:

```bash
# 完整流程（含预检查）
phases='["precheck","change-collector","change-analyzer","message-generator","commit-executor"]'

# 纯 Git 流程（无预检查）
phases='["change-collector","change-analyzer","message-generator","commit-executor"]'

# 调试流程
phases='["symptom-collector","hypothesis-generator","fix-implementer","verification"]'
```

### options (可选)

JSON 格式的初始选项，记录用户传入的配置。

**示例**:

```bash
options='{"emoji": true, "no_verify": false}'
options='{"scope": "api", "type": "feat", "breaking": true}'
```

### parent_dir (可选)

父目录路径，默认为 `.claude`。

**用途**: 测试环境或特殊场景下使用非标准路径。

## 输出格式

### 成功场景

```json
{
  "success": true,
  "run_id": "20260114T103000Z",
  "run_dir": ".claude/committing/runs/20260114T103000Z",
  "mode": "new",
  "created_files": [".claude/committing/runs/20260114T103000Z/state.json"]
}
```

### 失败场景

```json
{
  "success": false,
  "error": "Failed to create directory: Permission denied",
  "run_dir": ".claude/committing/runs/20260114T103000Z"
}
```

## state.json V2 格式

初始化时创建的 state.json 结构：

```json
{
  "workflow_version": "2.0",
  "domain": "committing",
  "run_id": "20260114T103000Z",
  "goal": "创建规范提交",
  "created_at": "2026-01-14T10:30:00Z",
  "updated_at": "2026-01-14T10:30:00Z",
  "current_phase": null,
  "status": "pending",
  "phases": [
    "precheck",
    "change-collector",
    "change-analyzer",
    "message-generator",
    "commit-executor"
  ],
  "steps": {
    "precheck": {
      "status": "pending"
    },
    "change-collector": {
      "status": "pending"
    },
    "change-analyzer": {
      "status": "pending"
    },
    "message-generator": {
      "status": "pending"
    },
    "commit-executor": {
      "status": "pending"
    }
  },
  "options": {
    "emoji": true
  },
  "artifacts": {}
}
```

**字段说明**:

| 字段             | 类型   | 说明                                 |
| ---------------- | ------ | ------------------------------------ |
| workflow_version | string | 固定为 "2.0"                         |
| domain           | string | 工作流域名                           |
| run_id           | string | UTC 时间戳格式                       |
| goal             | string | 本次运行目标                         |
| created_at       | string | ISO 8601 格式的创建时间              |
| updated_at       | string | ISO 8601 格式的最后更新时间          |
| current_phase    | string | 当前执行阶段（初始为 null）          |
| status           | string | pending/in_progress/completed/failed |
| phases           | array  | 阶段名称列表                         |
| steps            | object | 每个阶段的详细状态                   |
| options          | object | 用户传入的选项                       |
| artifacts        | object | 各阶段产出的文件名映射               |

## 实现逻辑

```bash
#!/bin/bash
set -euo pipefail

# ==================== 参数解析 ====================

DOMAIN="${domain:-}"
GOAL="${goal:-}"
PHASES="${phases:-[]}"
OPTIONS="${options:-{}}"
PARENT_DIR="${parent_dir:-.claude}"

# 验证必需参数
if [ -z "$DOMAIN" ]; then
    echo '{"success": false, "error": "Missing required argument: domain"}' >&2
    exit 1
fi

if [ -z "$GOAL" ]; then
    echo '{"success": false, "error": "Missing required argument: goal"}' >&2
    exit 1
fi

# 验证 phases 是 JSON 数组
if ! echo "$PHASES" | jq -e 'type == "array"' > /dev/null 2>&1; then
    echo '{"success": false, "error": "Invalid phases format: must be JSON array"}' >&2
    exit 1
fi

# ==================== 生成 run-id ====================

# UTC 时间戳格式: YYYYMMDDTHHMMSSZ
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)

# ==================== 创建目录结构 ====================

RUN_DIR="${PARENT_DIR}/${DOMAIN}/runs/${RUN_ID}"

# 确保父目录存在
if ! mkdir -p "$RUN_DIR" 2>/dev/null; then
    echo "{\"success\": false, \"error\": \"Failed to create directory: $RUN_DIR\"}" >&2
    exit 1
fi

# ==================== 生成 state.json ====================

CREATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# 构建 steps 对象（每个 phase 初始化为 pending）
STEPS_JSON=$(echo "$PHASES" | jq -r '
  map({
    key: .,
    value: {
      status: "pending"
    }
  }) | from_entries
')

# 生成完整 state.json
STATE_JSON=$(jq -n \
  --arg domain "$DOMAIN" \
  --arg run_id "$RUN_ID" \
  --arg goal "$GOAL" \
  --arg created_at "$CREATED_AT" \
  --argjson phases "$PHASES" \
  --argjson steps "$STEPS_JSON" \
  --argjson options "$OPTIONS" \
  '{
    workflow_version: "2.0",
    domain: $domain,
    run_id: $run_id,
    goal: $goal,
    created_at: $created_at,
    updated_at: $created_at,
    current_phase: null,
    status: "pending",
    phases: $phases,
    steps: $steps,
    options: $options,
    artifacts: {}
  }')

# 写入 state.json
STATE_FILE="${RUN_DIR}/state.json"
echo "$STATE_JSON" > "$STATE_FILE"

# ==================== 输出结果 ====================

# 输出 JSON 格式（供 Orchestrator 解析）
jq -n \
  --arg run_id "$RUN_ID" \
  --arg run_dir "$RUN_DIR" \
  --arg state_file "$STATE_FILE" \
  '{
    success: true,
    run_id: $run_id,
    run_dir: $run_dir,
    mode: "new",
    created_files: [$state_file]
  }'

exit 0
```

## 在 Orchestrator 中的使用

### Command 层调用

```bash
# 在 Command 层调用 run-initializer
Skill("workflow-run-initializer",
     args="domain=committing goal=\"创建规范提交\" phases='[\"precheck\",\"change-collector\",\"change-analyzer\",\"message-generator\",\"commit-executor\"]' options='{\"emoji\": true}'")
```

### 解析输出

```bash
# 假设 Skill() 输出存储在变量中
INIT_OUTPUT=$(Skill("workflow-run-initializer", ...))

# 提取 run_dir 和 run_id
run_dir=$(echo "$INIT_OUTPUT" | jq -r '.run_dir')
run_id=$(echo "$INIT_OUTPUT" | jq -r '.run_id')
success=$(echo "$INIT_OUTPUT" | jq -r '.success')

if [ "$success" != "true" ]; then
    error=$(echo "$INIT_OUTPUT" | jq -r '.error')
    echo "❌ 初始化失败: $error"
    exit 1
fi

echo "📂 运行环境: $run_dir"
echo "🆔 运行ID: $run_id"

# 委托给 Orchestrator
Skill("committing:commit-orchestrator",
     args="run_dir=${run_dir} options='{\"emoji\": true}'")
```

## 调用示例

### 示例 1: 标准 commit 流程

```bash
Skill("workflow-run-initializer",
     args='domain=committing goal="创建规范提交" phases='\''["precheck","change-collector","change-analyzer","message-generator","commit-executor"]'\''')
```

**输出**:

```json
{
  "success": true,
  "run_id": "20260114T103000Z",
  "run_dir": ".claude/committing/runs/20260114T103000Z",
  "mode": "new",
  "created_files": [".claude/committing/runs/20260114T103000Z/state.json"]
}
```

### 示例 2: 纯 Git commit 流程（无预检查）

```bash
Skill("workflow-run-initializer",
     args='domain=committing goal="Git规范提交" phases='\''["change-collector","change-analyzer","message-generator","commit-executor"]'\''')
```

### 示例 3: 调试流程

```bash
Skill("workflow-run-initializer",
     args='domain=debugging goal="调试登录问题" phases='\''["symptom-collector","hypothesis-generator","fix-implementer","verification"]'\'' options='\''{"verbose": true}'\'')
```

### 示例 4: 开发流程

```bash
Skill("workflow-run-initializer",
     args='domain=developing goal="实现用户认证" phases='\''["context-retrieval","analysis","prototype","implementation","review"]'\'' options='\''{"multi_model": true}'\'')
```

## 目录结构示例

执行后创建的目录结构：

```
.claude/
└── committing/
    └── runs/
        ├── 20260114T103000Z/
        │   └── state.json
        ├── 20260114T105530Z/
        │   └── state.json
        └── 20260114T110245Z/
            └── state.json
```

每个 run_dir 独立存储：

- state.json（工作流状态）
- 各阶段输出文件（由 Skills 生成）

## 错误处理

### 错误场景 1: 目录创建失败

**原因**: 权限不足或磁盘空间不足

**输出**:

```json
{
  "success": false,
  "error": "Failed to create directory: Permission denied"
}
```

**恢复**: 检查文件系统权限

### 错误场景 2: 参数格式错误

**原因**: phases 不是 JSON 数组

**输出**:

```json
{
  "success": false,
  "error": "Invalid phases format: must be JSON array"
}
```

**恢复**: 修正 phases 参数格式

### 错误场景 3: 缺少必需参数

**原因**: domain 或 goal 未提供

**输出**:

```json
{
  "success": false,
  "error": "Missing required argument: domain"
}
```

**恢复**: 补充缺失的参数

## 设计原则

1. **幂等性**: 每次调用生成唯一 run-id，不会覆盖已有运行
2. **隔离性**: 每个运行独立目录，互不干扰
3. **可追溯性**: run-id 包含时间戳，便于排序和查找
4. **可扩展性**: state.json V2 格式支持新字段
5. **原子性**: 目录创建和文件写入要么全部成功，要么全部失败

## 约束和限制

1. **时间精度**: run-id 精确到秒，同一秒内多次调用会覆盖
2. **磁盘空间**: 每次运行创建新目录，需定期清理旧运行
3. **JSON 格式**: phases 和 options 必须是有效 JSON
4. **路径安全**: domain 不应包含特殊字符（/、..、~）

## 测试建议

### 单元测试

```bash
# 测试 1: 标准调用
Skill("workflow-run-initializer",
     args='domain=test goal="测试运行" phases='\''["phase1","phase2"]'\''')

# 验证: 检查 run_dir 是否存在
ls -la .claude/test/runs/*/state.json

# 测试 2: 带选项
Skill("workflow-run-initializer",
     args='domain=test goal="测试运行" phases='\''["phase1"]'\'' options='\''{"key": "value"}'\'')

# 验证: 检查 state.json 的 options 字段
cat .claude/test/runs/*/state.json | jq '.options'

# 测试 3: 错误场景 - 缺少参数
Skill("workflow-run-initializer",
     args='goal="测试运行"')
# 预期: 返回 success: false, error: "Missing required argument: domain"
```

## 性能指标

| 指标       | 目标   | 说明                 |
| ---------- | ------ | -------------------- |
| 执行时间   | < 50ms | 目录创建 + JSON 生成 |
| 磁盘占用   | ~1KB   | 空 state.json 大小   |
| 并发安全性 | 是     | 每次生成唯一 run-id  |

## 版本历史

- v2.0: 重写为 V2 Contract 标准，支持完整 state.json 格式
- v1.0: 初始实现（已归档）

## 参考文档

| 文档                                      | 用途                       |
| ----------------------------------------- | -------------------------- |
| `docs/orchestrator-contract.md`           | V2 Contract 规范           |
| `skills/shared/workflow/STATE_FILE_V2.md` | state.json V2 格式详细说明 |
