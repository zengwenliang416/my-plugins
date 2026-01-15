# 断点恢复检测器

## 概述

在 orchestrator 启动时自动检测状态文件中未完成的后台任务，通过 `task_id` 查询实际状态并更新。确保工作流在中断后能无缝恢复。

## 设计目标

1. **自动检测**: orchestrator 启动时自动执行，无需手动触发
2. **状态同步**: 将后台任务的实际状态同步到状态文件
3. **容错处理**: 处理 task_id 丢失、任务不存在等异常情况
4. **透明恢复**: 用户无感知，自动继续工作流

## 触发场景

### 场景 1: 正常中断恢复

用户在后台任务运行期间中止了 Claude Code 会话，重新启动后恢复。

```
1. 用户启动 debug-orchestrator
2. 启动 Codex 和 Gemini 后台假设生成
3. 用户关闭终端（任务仍在后台运行）
4. 1小时后，用户重新启动 debug-orchestrator
5. 检测器发现 2 个 running 任务
6. 查询 task_id，发现都已完成
7. 更新状态文件，继续下一阶段
```

### 场景 2: 系统重启恢复

系统重启导致后台任务丢失，标记为失败。

```
1. 用户启动 test-orchestrator，后台执行测试生成
2. 系统崩溃/重启
3. 用户重新启动 test-orchestrator
4. 检测器发现 1 个 running 任务
5. 查询 task_id，发现任务不存在
6. 标记为失败，记录错误信息
```

### 场景 3: 无恢复需求

没有未完成任务，直接跳过恢复阶段。

```
1. 用户启动 orchestrator
2. 检测器检查状态文件
3. 所有任务都是 completed 或 failed
4. 跳过恢复，直接进入工作流
```

## 核心接口

### 检测和恢复函数

```typescript
async function detectAndRecover(stateFilePath: string): Promise<RecoveryResult>;
```

**参数**:

- `stateFilePath`: 状态文件路径（如 `.claude/debugging.local.md`）

**返回**:

```typescript
interface RecoveryResult {
  needsRecovery: boolean; // 是否需要恢复
  totalRunning: number; // 检测到的运行中任务数
  recovered: number; // 成功恢复的任务数
  stillRunning: number; // 仍在运行的任务数
  failed: number; // 失败的任务数
}
```

## 实现逻辑

### 完整流程

```typescript
async function detectAndRecover(
  stateFilePath: string,
): Promise<RecoveryResult> {
  // 1. 读取状态文件
  const state = await readStateFile(stateFilePath);

  // 2. 检查是否有运行中的任务
  const runningTasks = state.subtasks.filter((t) => t.status === "running");

  if (runningTasks.length === 0) {
    return {
      needsRecovery: false,
      totalRunning: 0,
      recovered: 0,
      stillRunning: 0,
      failed: 0,
    };
  }

  console.log(`🔍 检测到 ${runningTasks.length} 个未完成任务，开始恢复...`);

  let recovered = 0;
  let stillRunning = 0;
  let failed = 0;

  // 3. 轮询每个任务状态
  for (const task of runningTasks) {
    // 验证 task_id
    if (!task.task_id) {
      task.status = "failed";
      task.error = "缺失 task_id，无法恢复（可能是迁移前的旧任务）";
      task.completed_at = new Date().toISOString();
      state.parallel_execution.active_tasks--;
      state.parallel_execution.failed_tasks++;
      failed++;
      console.log(`❌ 任务 ${task.id}: 无 task_id`);
      continue;
    }

    try {
      // 4. 查询任务状态（非阻塞）
      const result = await TaskOutput({
        task_id: task.task_id,
        block: false,
        timeout: 5000,
      });

      // 5. 根据实际状态更新
      if (result.status === "completed") {
        task.status = "completed";
        task.completed_at = new Date().toISOString();

        // 提取输出和 SESSION_ID
        const parsed = parseTaskOutput(result.output);
        if (parsed.outputFile) {
          task.output = parsed.outputFile;
        }
        if (parsed.sessionId) {
          task.session_id = parsed.sessionId;
          updateSessionHistory(state, task.backend, parsed.sessionId);
        }

        state.parallel_execution.active_tasks--;
        state.parallel_execution.completed_tasks++;
        recovered++;
        console.log(`✅ 任务 ${task.id}: 已完成`);
      } else if (result.status === "failed") {
        task.status = "failed";
        task.error = result.error || "Unknown error";
        task.completed_at = new Date().toISOString();
        state.parallel_execution.active_tasks--;
        state.parallel_execution.failed_tasks++;
        failed++;
        console.log(`❌ 任务 ${task.id}: 失败 - ${task.error}`);
      } else {
        // 仍在运行中
        stillRunning++;
        const elapsed = Date.now() - new Date(task.started_at).getTime();
        const minutes = Math.floor(elapsed / 60000);
        console.log(`⏳ 任务 ${task.id}: 仍在运行（已运行 ${minutes} 分钟）`);
      }
    } catch (error) {
      // TaskOutput 调用失败（如 task_id 无效、任务已被清理）
      task.status = "failed";
      task.error = `恢复失败: ${error.message}`;
      task.completed_at = new Date().toISOString();
      state.parallel_execution.active_tasks--;
      state.parallel_execution.failed_tasks++;
      failed++;
      console.log(`❌ 任务 ${task.id}: TaskOutput 失败 - ${error.message}`);
    }
  }

  // 6. 保存更新后的状态
  await saveStateFile(stateFilePath, state);

  // 7. 输出恢复报告
  console.log("");
  console.log("📊 恢复结果:");
  console.log(`   - 已完成: ${recovered} 个`);
  console.log(`   - 仍运行: ${stillRunning} 个`);
  console.log(`   - 失败: ${failed} 个`);

  return {
    needsRecovery: true,
    totalRunning: runningTasks.length,
    recovered,
    stillRunning,
    failed,
  };
}
```

### 辅助函数

#### parseTaskOutput

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

#### updateSessionHistory

```typescript
function updateSessionHistory(
  state: StateFileV2,
  backend: "codex" | "gemini",
  sessionId: string,
): void {
  const session = state.sessions[backend];

  // 如果当前会话不是这个，添加到历史
  if (session.current !== sessionId) {
    session.history.push({
      id: session.current,
      started_at: state.created_at,
      ended_at: new Date().toISOString(),
      phase: state.current_phase,
    });

    session.current = sessionId;
  }
}
```

## Orchestrator 集成

### Phase 0: 启动检测（自动）

在每个支持并行执行的 orchestrator SKILL.md 开头添加：

```markdown
## Phase 0: 断点恢复检查（自动）

**触发条件**: 存在状态文件且有 `running` 状态的 subtasks

**操作**:

1. 读取状态文件 `.claude/{domain}.local.md`
2. 调用断点恢复检测器
3. 展示恢复结果
4. 继续正常工作流

**输出**: 更新后的状态文件

**示例**:

\`\`\`
🔍 检测到 2 个未完成任务，开始恢复...
✅ 任务 codex-hypothesis: 已完成
✅ 任务 gemini-hypothesis: 已完成

📊 恢复结果:

- 已完成: 2 个
- 仍运行: 0 个
- 失败: 0 个
  \`\`\`
```

### 集成示例（TypeScript）

```typescript
// orchestrator SKILL.md 开头
async function main() {
  const stateFile = `.claude/${domain}.local.md`;

  // Phase 0: 断点恢复
  if (await fileExists(stateFile)) {
    const recovery = await detectAndRecover(stateFile);

    if (recovery.needsRecovery) {
      if (recovery.stillRunning > 0) {
        console.log(
          `⏳ 有 ${recovery.stillRunning} 个任务仍在运行，等待完成...`,
        );
        // 进入轮询模式（参见并发槽位管理器）
        await waitForRunningTasks(stateFile);
      }

      if (recovery.failed > 0) {
        console.log(`⚠️  有 ${recovery.failed} 个任务失败，可能需要重新执行`);
        // 可选：询问用户是否重试失败任务
      }
    }
  }

  // Phase 1: 正常工作流开始
  // ...
}
```

### 集成示例（Bash 调用）

```bash
#!/bin/bash
# orchestrator 入口脚本

DOMAIN="debugging"
STATE_FILE="$HOME/.claude/${DOMAIN}.local.md"

# Phase 0: 断点恢复检测
if [[ -f "$STATE_FILE" ]]; then
  echo "🔍 检测断点恢复需求..."

  # 调用 Node.js 恢复脚本
  node skills/_shared/background/detect-and-recover.js "$STATE_FILE"

  if [[ $? -eq 0 ]]; then
    echo "✅ 断点恢复完成"
  else
    echo "⚠️  部分任务恢复失败，查看状态文件了解详情" >&2
  fi

  echo ""
fi

# Phase 1: 正常工作流
echo "开始 ${DOMAIN} 工作流..."
# ...
```

## 边界情况处理

### 情况 1: task_id 为 null

**原因**: V1 迁移的旧任务，或启动失败但未记录

**处理**: 标记为 failed，记录错误信息

```typescript
if (!task.task_id) {
  task.status = "failed";
  task.error = "缺失 task_id，无法恢复";
  task.completed_at = new Date().toISOString();
}
```

### 情况 2: TaskOutput 抛出异常

**原因**: task_id 无效、任务已被系统清理、网络问题

**处理**: 标记为 failed，记录详细错误

```typescript
try {
  const result = await TaskOutput({ task_id: task.task_id });
} catch (error) {
  task.status = "failed";
  task.error = `恢复失败: ${error.message}`;
}
```

### 情况 3: 所有任务都已完成/失败

**原因**: 上次工作流正常结束

**处理**: 直接返回，不修改状态文件

```typescript
if (runningTasks.length === 0) {
  return {
    needsRecovery: false,
    totalRunning: 0,
    recovered: 0,
    stillRunning: 0,
    failed: 0,
  };
}
```

### 情况 4: 状态文件不存在

**原因**: 首次启动，或状态文件被删除

**处理**: 跳过恢复，初始化新工作流

```typescript
if (!(await fileExists(stateFilePath))) {
  return { needsRecovery: false, ...defaultResult };
}
```

### 情况 5: 任务仍在运行

**原因**: 任务尚未完成

**处理**: 保持 running 状态，输出运行时间

```typescript
if (result.status === "running") {
  stillRunning++;
  const elapsed = Date.now() - new Date(task.started_at).getTime();
  console.log(
    `⏳ 任务 ${task.id}: 仍在运行（已运行 ${Math.floor(elapsed / 60000)} 分钟）`,
  );
}
```

## 性能优化

### 并行查询

避免串行查询每个 task_id，使用并行查询：

```typescript
const results = await Promise.all(
  runningTasks.map((task) =>
    task.task_id
      ? TaskOutput({
          task_id: task.task_id,
          block: false,
          timeout: 5000,
        }).catch((error) => ({
          task_id: task.task_id,
          status: "failed",
          error: error.message,
        }))
      : Promise.resolve({
          task_id: null,
          status: "failed",
          error: "缺失 task_id",
        }),
  ),
);

// 更新状态
runningTasks.forEach((task, index) => {
  const result = results[index];
  updateTaskFromResult(task, result);
});
```

### 缓存状态文件

避免重复读取状态文件：

```typescript
let cachedState: StateFileV2 | null = null;

async function getState(path: string): Promise<StateFileV2> {
  if (!cachedState) {
    cachedState = await readStateFile(path);
  }
  return cachedState;
}
```

## 验证清单

- [ ] 能检测到 running 状态的任务
- [ ] 能正确查询 task_id 状态（通过 TaskOutput）
- [ ] 能更新状态文件的 subtasks 和 parallel_execution 计数器
- [ ] 处理 task_id 为 null 的情况
- [ ] 处理 TaskOutput 调用失败的情况
- [ ] 提取并保存 SESSION_ID（如果存在）
- [ ] 输出清晰的恢复报告
- [ ] 不影响正常工作流启动

## 相关文档

- Task 1.2: 任务结果收集器
- Task 1.3: 状态文件 V2 格式定义
- Task 1.6: 并发槽位管理器
- Stage 2 Task 2.4: SESSION_ID 持久化管理
