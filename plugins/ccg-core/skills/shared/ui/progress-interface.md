# 统一进度显示接口

## 概述

为所有 orchestrators 提供统一的进度查询和显示接口，基于 `progress.sh` 实现。

## 核心理念

- **统一性**: 所有 orchestrators 使用相同的进度显示方式
- **易用性**: 提供简单的函数调用，隐藏实现细节
- **灵活性**: 支持详细模式、简洁模式、后台监控
- **一致性**: 进度显示格式统一，易于识别

## 依赖关系

```
progress-interface.md (本文档)
    └── progress.sh (底层实现)
        └── yq, jq (YAML/JSON 解析工具)
```

## 使用场景

### 场景 1: 并行阶段开始前

在调用 `executeParallelPhase()` 前，不需要手动显示进度。后台任务适配层会自动管理进度显示。

### 场景 2: 主动查询进度

如果需要在并行执行过程中主动查询进度：

```bash
source "${CLAUDE_PLUGIN_ROOT}/skills/_shared/ui/progress.sh"

# 显示当前进度（一次性）
print_parallel_progress ".claude/developing.local.md"

# 或使用简洁版单行进度条
print_simple_progress ".claude/developing.local.md"
```

### 场景 3: 后台监控

如果需要在后台持续监控进度（不阻塞主流程）：

```bash
source "${CLAUDE_PLUGIN_ROOT}/skills/_shared/ui/progress.sh"

# 启动后台监控（每2秒刷新一次）
MONITOR_PID=$(start_progress_monitor ".claude/developing.local.md" 2)

# ... 执行其他任务 ...

# 停止监控
stop_progress_monitor "$MONITOR_PID"
```

### 场景 4: 阻塞式等待

如果需要等待所有并行任务完成（阻塞当前流程）：

```bash
source "${CLAUDE_PLUGIN_ROOT}/skills/_shared/ui/progress.sh"

# 持续监控直到所有任务完成
monitor_progress ".claude/developing.local.md" 2
```

## 函数参考

### print_parallel_progress

**用途**: 显示详细的多任务进度（多行）

**签名**:

```bash
print_parallel_progress <state_file>
```

**参数**:

- `state_file`: V2 状态文件路径（如 `.claude/developing.local.md`）

**输出示例**:

```
🔄 并行执行中 (Phase: feature_analysis)

┌────────────────────────────────────────────────────────────┐
│ codex-feature-analy  [████████░░] 🔄 运行中 (1m 23s) [codex] │
│ gemini-feature-anal  [██████████] ✅ 完成   (1m 05s) [gemini] │
└────────────────────────────────────────────────────────────┘

📊 统计: 活跃 1/2 | 完成 1 | 失败 0 | 总计 2
```

**返回值**:

- 0: 成功
- 1: 状态文件不存在

---

### print_simple_progress

**用途**: 显示简洁的单行进度条

**签名**:

```bash
print_simple_progress <state_file>
```

**参数**:

- `state_file`: V2 状态文件路径

**输出示例**:

```
🔄 进度: [████████████░░░░░░░░] 60% | 活跃: 1 | 完成: 1 | 失败: 0
```

**特点**:

- 使用 `\r` 覆盖同一行，节省空间
- 适合嵌入到其他输出中
- 需要手动添加换行符（`echo ""`）

---

### monitor_progress

**用途**: 持续监控进度，直到所有任务完成（阻塞）

**签名**:

```bash
monitor_progress <state_file> [refresh_interval]
```

**参数**:

- `state_file`: V2 状态文件路径
- `refresh_interval`: 刷新间隔（秒），默认 2 秒

**行为**:

- 每隔 `refresh_interval` 秒调用 `print_parallel_progress`
- 当 `parallel_execution.active_tasks` 为 0 时自动退出
- 阻塞当前进程

**使用场景**:

- 等待并行任务完成
- 无需执行其他操作

---

### start_progress_monitor

**用途**: 在后台启动进度监控（非阻塞）

**签名**:

```bash
MONITOR_PID=$(start_progress_monitor <state_file> [refresh_interval])
```

**参数**:

- `state_file`: V2 状态文件路径
- `refresh_interval`: 刷新间隔（秒），默认 2 秒

**返回值**:

- 后台监控进程的 PID

**行为**:

- 在后台启动 `monitor_progress`
- 返回进程 PID，用于后续停止

**使用场景**:

- 需要同时执行其他任务
- 不希望阻塞主流程

---

### stop_progress_monitor

**用途**: 停止后台监控进程

**签名**:

```bash
stop_progress_monitor <monitor_pid>
```

**参数**:

- `monitor_pid`: 监控进程 PID（由 `start_progress_monitor` 返回）

**行为**:

- 发送 SIGTERM 信号给监控进程
- 等待进程优雅退出
- 忽略错误（如果进程已退出）

---

## 状态文件要求

所有使用进度显示接口的状态文件必须遵循 V2 格式：

```yaml
---
workflow_version: "2.0"
domain: "<domain>"
workflow_id: "<id>"
current_phase: "<phase>"

# 必需：并行执行控制
parallel_execution:
  max_concurrency: 8
  active_tasks: 0 # 当前运行的任务数
  completed_tasks: 0 # 已完成的任务数
  failed_tasks: 0 # 失败的任务数

# 必需：子任务列表
subtasks:
  - id: "codex-feature-analysis"
    backend: "codex"
    status: "running" # pending | running | completed | failed
    task_id: "task_123"
    started_at: "2026-01-13T14:30:00Z"
    completed_at: null
    output: null
    error: null

  - id: "gemini-feature-analysis"
    backend: "gemini"
    status: "completed"
    task_id: "task_124"
    started_at: "2026-01-13T14:30:00Z"
    completed_at: "2026-01-13T14:31:05Z"
    output: ".claude/developing/analysis-gemini.md"
    error: null
---
```

**关键字段**:

1. **parallel_execution**: 并行执行统计
   - `active_tasks`: 当前正在运行的任务数
   - `completed_tasks`: 已完成的任务数
   - `failed_tasks`: 失败的任务数

2. **subtasks**: 子任务数组
   - `id`: 任务唯一标识
   - `backend`: 后端类型（codex | gemini）
   - `status`: 任务状态（pending | running | completed | failed）
   - `task_id`: Claude Code 后台任务 ID（用于恢复）
   - `started_at`: 开始时间（ISO 8601 格式）
   - `completed_at`: 完成时间
   - `output`: 输出文件路径
   - `error`: 错误信息（如有）

---

## 集成示例

### 示例 1: dev-orchestrator Phase 2

```typescript
// Phase 2: 功能分析（并行）
await executeParallelPhase({
  domain: "developing",
  phaseName: "Phase 2: 功能分析（并行）",
  variables: {
    USER_REQUEST: userRequest,
    CODEBASE_CONTEXT: codebaseContext,
  },
});

// executeParallelPhase 内部会:
// 1. 读取 developing.local.md 中的 parallel_tasks 配置
// 2. 为每个任务调用后台任务适配层
// 3. 更新状态文件中的 subtasks 和 parallel_execution
// 4. 自动显示进度（使用 print_parallel_progress）
// 5. 等待所有任务完成
// 6. 收集结果并返回
```

### 示例 2: 手动监控（高级用法）

```bash
#!/bin/bash
source "${CLAUDE_PLUGIN_ROOT}/skills/_shared/ui/progress.sh"

STATE_FILE=".claude/developing.local.md"

# 启动后台监控
MONITOR_PID=$(start_progress_monitor "$STATE_FILE" 2)
echo "后台监控已启动 (PID: $MONITOR_PID)"

# 执行主流程
# ... orchestrator logic ...

# 主流程完成后，停止监控
stop_progress_monitor "$MONITOR_PID"
echo "后台监控已停止"

# 显示最终进度
print_parallel_progress "$STATE_FILE"
```

---

## 错误处理

### 状态文件不存在

```bash
$ print_parallel_progress ".claude/nonexistent.local.md"
❌ 状态文件不存在: .claude/nonexistent.local.md
```

**解决方案**: 确保在并行执行前已初始化状态文件

### yq/jq 未安装

```bash
$ print_parallel_progress ".claude/developing.local.md"
yq: command not found
```

**解决方案**:

```bash
# macOS
brew install yq jq

# Linux
sudo apt-get install yq jq  # Debian/Ubuntu
sudo yum install yq jq      # RHEL/CentOS
```

### 时间计算错误

如果 `calculate_elapsed` 返回 `--:--`，说明 `started_at` 格式不正确。

**要求**: ISO 8601 格式，如 `2026-01-13T14:30:00Z`

---

## 性能考虑

1. **刷新频率**: 默认 2 秒刷新一次，避免频繁读取文件
2. **文件锁**: yq/jq 是只读操作，无锁竞争
3. **清屏策略**: 仅在 TTY 终端清屏，避免日志混乱
4. **后台监控**: 使用单独进程，不影响主流程

---

## 设计原则

1. **零配置**: orchestrators 无需额外配置，自动继承状态文件
2. **向下兼容**: V1 状态文件不支持进度显示，但不报错
3. **无侵入性**: 进度显示失败不影响核心工作流
4. **可观测性**: 实时反馈任务状态，提升用户体验

---

## 相关文档

- `skills/_shared/ui/progress.sh` - 底层实现
- `skills/shared/workflow/STATE_FILE_V2.md` - 状态文件 V2 规范
- `skills/_shared/orchestrator/parallel.md` - 声明式并行 API
- `skills/_shared/background/adapter.md` - 后台任务适配层
- `skills/_shared/background/collector.md` - 任务结果收集器

---

## 版本历史

| 版本  | 日期       | 变更                   |
| ----- | ---------- | ---------------------- |
| 1.0.0 | 2026-01-13 | 初始版本，定义统一接口 |

---

## 未来改进

1. **Web UI**: 提供基于 HTML 的进度监控面板
2. **通知集成**: 任务完成后发送桌面通知
3. **日志聚合**: 将多个 orchestrator 的进度聚合到单一视图
4. **性能指标**: 显示任务执行时间、资源使用情况
