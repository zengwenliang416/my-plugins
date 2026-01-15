# 任务结果收集器

## 概述

使用 Claude Code 的 `TaskOutput` tool 收集后台任务的执行结果。支持非阻塞轮询和阻塞等待两种模式，用于并发控制和最终同步。

## 设计目标

1. **非阻塞查询**: 轮询任务状态，不等待完成
2. **阻塞等待**: 在需要时等待任务完成
3. **输出解析**: 提取 SESSION_ID 和分析结果
4. **无超时限制**: 符合用户约束，外部模型任务不设超时

## 接口设计

### 查询接口

```typescript
interface TaskResultQuery {
  task_id: string; // Claude Code 后台任务 ID
  block?: boolean; // 默认 false（非阻塞）
  timeout?: number; // 仅在 block=true 时有效，0 表示无超时
}
```

### 返回接口

```typescript
interface TaskResult {
  task_id: string;
  status: "running" | "completed" | "failed";
  output?: string; // 任务输出内容
  error?: string; // 错误信息（如果失败）
  completed_at?: string; // ISO8601 时间戳
  session_id?: string; // 提取的会话 ID（如果存在）
}
```

### 收集函数

```typescript
async function getTaskResult(query: TaskResultQuery): Promise<TaskResult>;
```

## 使用模式

### 模式 1: 非阻塞轮询（推荐用于并发控制）

用于实时监控多个后台任务状态，不阻塞主流程。

```typescript
// 轮询所有运行中的任务
async function pollRunningTasks(stateFile: StateFileV2) {
  const runningTasks = stateFile.parallel_execution.subtasks.filter(
    (t) => t.status === "running",
  );

  for (const subtask of runningTasks) {
    const result = await TaskOutput({
      task_id: subtask.task_id,
      block: false,
      timeout: 1000, // 非阻塞查询，1秒超时足够
    });

    if (result.status === "completed") {
      subtask.status = "completed";
      subtask.completed_at = new Date().toISOString();
      subtask.output_file = extractOutputFile(result.output);

      // 提取 SESSION_ID
      const sessionId = extractSessionId(result.output);
      if (sessionId) {
        updateSessionHistory(stateFile, subtask.backend, sessionId);
      }
    } else if (result.status === "failed") {
      subtask.status = "failed";
      subtask.error = result.error || "Unknown error";
      subtask.completed_at = new Date().toISOString();
    }
    // status === "running" 时不更新，等待下次轮询
  }

  // 保存状态文件
  await saveStateFile(stateFile);
}
```

### 模式 2: 阻塞等待（用于最终同步点）

在工作流的最终阶段，等待所有任务完成再继续。

```typescript
// 等待所有任务完成（无超时限制）
async function waitForAllTasks(taskIds: string[]): Promise<TaskResult[]> {
  const results = await Promise.all(
    taskIds.map((task_id) =>
      TaskOutput({
        task_id,
        block: true,
        timeout: 0, // 无超时限制（用户约束）
      }),
    ),
  );

  return results.map((result) => ({
    task_id: result.task_id,
    status: result.status,
    output: result.output,
    error: result.error,
    completed_at: new Date().toISOString(),
    session_id: extractSessionId(result.output),
  }));
}
```

### 模式 3: 混合模式（并发控制 + 最终等待）

结合非阻塞轮询和阻塞等待，用于槽位管理。

```typescript
// 示例：等待任一任务完成以释放槽位
async function waitForAnyTaskCompletion(
  runningTasks: SubTask[],
): Promise<SubTask> {
  while (true) {
    for (const task of runningTasks) {
      const result = await TaskOutput({
        task_id: task.task_id,
        block: false,
        timeout: 1000,
      });

      if (result.status === "completed" || result.status === "failed") {
        return task; // 返回第一个完成的任务
      }
    }

    // 所有任务仍在运行，等待一段时间后重试
    await sleep(2000);
  }
}
```

## 输出解析

### Codex/Gemini 输出格式

后台任务的输出通常包含：

```bash
# 标准输出格式
=== codeagent-wrapper output ===
SESSION_ID=550e8400-e29b-41d4-a716-446655440000
success=true

=== Analysis Result ===
{外部模型的分析内容或 diff patch}

=== End of output ===
```

### 解析函数示例

```bash
#!/bin/bash
# 提取 SESSION_ID

extract_session_id() {
  local output="$1"
  echo "$output" | grep -oP 'SESSION_ID=\K[a-f0-9-]+' | head -1
}

# 提取输出文件路径
extract_output_file() {
  local output="$1"
  echo "$output" | grep -oP 'Output written to: \K.*' | head -1
}

# 检查是否成功
check_success() {
  local output="$1"
  if echo "$output" | grep -q "success=true"; then
    return 0
  else
    return 1
  fi
}
```

### TypeScript 解析示例

```typescript
function parseTaskOutput(output: string): {
  sessionId?: string;
  outputFile?: string;
  success: boolean;
} {
  const sessionIdMatch = output.match(/SESSION_ID=([a-f0-9-]+)/);
  const outputFileMatch = output.match(/Output written to: (.*)/);
  const success = output.includes("success=true");

  return {
    sessionId: sessionIdMatch?.[1],
    outputFile: outputFileMatch?.[1],
    success,
  };
}
```

## 错误处理

### 任务失败

```typescript
if (result.status === "failed") {
  // 记录到状态文件
  subtask.status = "failed";
  subtask.error = result.error || "Unknown error";
  subtask.completed_at = new Date().toISOString();

  // 记录到失败日志
  await logFailure({
    task_id: result.task_id,
    backend: subtask.backend,
    role: subtask.role,
    error: result.error,
    timestamp: new Date().toISOString(),
  });

  // 不重试，不降级（用户约束）
}
```

### TaskOutput 调用失败

```typescript
try {
  const result = await TaskOutput({ task_id, block: false, timeout: 1000 });
  return result;
} catch (error) {
  // TaskOutput 本身失败（如 task_id 无效）
  return {
    task_id,
    status: "failed",
    error: `TaskOutput failed: ${error.message}`,
  };
}
```

## 性能考虑

### 轮询频率

- **推荐**: 每 2-5 秒轮询一次
- **避免**: 高频轮询（< 1 秒）会增加系统负载
- **优化**: 使用指数退避策略

```typescript
let pollInterval = 2000; // 初始 2 秒
const maxInterval = 10000; // 最大 10 秒

async function adaptivePoll() {
  while (hasRunningTasks()) {
    await pollRunningTasks(stateFile);

    if (allTasksRunning()) {
      // 所有任务仍在运行，增加轮询间隔
      pollInterval = Math.min(pollInterval * 1.5, maxInterval);
    } else {
      // 有任务完成，恢复快速轮询
      pollInterval = 2000;
    }

    await sleep(pollInterval);
  }
}
```

### 批量查询

避免逐个查询任务，使用并行查询：

```typescript
// ❌ 低效：串行查询
for (const task of runningTasks) {
  const result = await TaskOutput({ task_id: task.task_id, block: false });
  updateTask(task, result);
}

// ✅ 高效：并行查询
const results = await Promise.all(
  runningTasks.map((task) =>
    TaskOutput({ task_id: task.task_id, block: false, timeout: 1000 }),
  ),
);
results.forEach((result, index) => updateTask(runningTasks[index], result));
```

## 验证清单

- [ ] 非阻塞查询能正确返回状态（running/completed/failed）
- [ ] 阻塞等待能获取完整输出
- [ ] 能正确解析 Codex/Gemini 输出格式
- [ ] 能提取 SESSION_ID 并更新状态文件
- [ ] 任务失败时正确记录错误信息
- [ ] 不对失败任务进行重试
- [ ] 支持无超时限制的阻塞等待（timeout: 0）

## 相关文档

- Stage 1 Task 1.1: 后台任务适配层
- Stage 1 Task 1.5: 断点恢复检测器
- Stage 1 Task 1.6: 并发槽位管理器
- Stage 2 Task 2.4: SESSION_ID 持久化管理
