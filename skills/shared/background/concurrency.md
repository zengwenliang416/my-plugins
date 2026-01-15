# 并发槽位管理器

## 概述

控制全局后台任务并发数不超过 8 个（用户约束），实现槽位等待、自动分配和任务状态同步。确保系统资源合理利用，避免过载。

## 设计目标

1. **全局限制**: 所有 orchestrator 共享 8 个并发槽位
2. **自动等待**: 槽位满时自动轮询等待，无需手动管理
3. **智能调度**: 任务完成时自动释放槽位
4. **状态同步**: 实时更新状态文件的并发计数器

## 核心约束

- **最大并发数**: 8（固定）
- **槽位粒度**: 每个后台任务占用 1 个槽位
- **等待策略**: 非阻塞轮询，间隔 2-5 秒
- **释放时机**: 任务完成（completed）或失败（failed）时自动释放

## 接口设计

### ConcurrencyManager 类

```typescript
class ConcurrencyManager {
  private maxConcurrency: number = 8;
  private stateFile: string;
  private pollInterval: number = 2000; // 默认 2 秒

  constructor(stateFile: string, maxConcurrency: number = 8) {
    this.stateFile = stateFile;
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * 等待可用槽位
   * @returns 成功获取槽位时返回 true
   */
  async waitForSlot(): Promise<boolean>;

  /**
   * 占用槽位并启动任务
   * @param config 任务配置
   * @returns 任务 ID
   */
  async acquireAndStart(config: BackgroundTaskConfig): Promise<string>;

  /**
   * 更新所有运行中任务的状态
   * @returns 是否有任务状态变化
   */
  async updateTaskStatuses(): Promise<boolean>;

  /**
   * 获取当前并发数
   * @returns 当前运行中的任务数
   */
  async getCurrentConcurrency(): Promise<number>;

  /**
   * 等待所有任务完成
   * @returns 完成的任务数
   */
  async waitForAllTasks(): Promise<number>;
}
```

## 实现细节

### 完整类实现

```typescript
class ConcurrencyManager {
  private maxConcurrency: number = 8;
  private stateFile: string;
  private pollInterval: number = 2000;

  constructor(stateFile: string, maxConcurrency: number = 8) {
    this.stateFile = stateFile;
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * 等待可用槽位
   */
  async waitForSlot(): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 180; // 最多等待 6 分钟（180 * 2s）

    while (attempts < maxAttempts) {
      const state = await readStateFile(this.stateFile);
      const currentConcurrency = state.parallel_execution.active_tasks;

      if (currentConcurrency < this.maxConcurrency) {
        const available = this.maxConcurrency - currentConcurrency;
        console.log(`✅ 槽位可用 (${available}/${this.maxConcurrency} 空闲)`);
        return true;
      }

      // 槽位已满，更新任务状态
      console.log(
        `⏳ 槽位已满 (${currentConcurrency}/${this.maxConcurrency})，等待中...`,
      );
      const updated = await this.updateTaskStatuses();

      if (!updated) {
        // 没有任务完成，等待一段时间
        await sleep(this.pollInterval);
        attempts++;
      } else {
        // 有任务完成，立即重试
        attempts = 0; // 重置计数器
      }
    }

    console.error("❌ 等待槽位超时（6 分钟）");
    return false;
  }

  /**
   * 占用槽位并启动任务
   */
  async acquireAndStart(config: BackgroundTaskConfig): Promise<string | null> {
    // 1. 等待槽位
    const acquired = await this.waitForSlot();
    if (!acquired) {
      throw new Error("无法获取并发槽位");
    }

    // 2. 启动后台任务
    console.log(`🚀 启动任务: ${config.id} (${config.backend})`);
    const result = await startBackgroundTask(config);

    // 3. 更新状态文件
    const state = await readStateFile(this.stateFile);

    // 增加活跃任务计数
    state.parallel_execution.active_tasks++;

    // 添加 subtask 记录
    state.subtasks.push({
      id: config.id,
      status: "running",
      task_id: result.task_id,
      backend: config.backend,
      role: config.role,
      started_at: result.started_at,
      completed_at: null,
      output: config.output || `.claude/${state.domain}/${config.id}.md`,
      error: null,
      session_id: result.session_id || null,
    });

    // 保存状态
    await saveStateFile(this.stateFile, state);

    console.log(`✅ 任务已启动: ${config.id} (task_id: ${result.task_id})`);
    return result.task_id;
  }

  /**
   * 更新所有运行中任务的状态（非阻塞轮询）
   */
  async updateTaskStatuses(): Promise<boolean> {
    const state = await readStateFile(this.stateFile);
    let updated = false;

    const runningTasks = state.subtasks.filter((t) => t.status === "running");

    if (runningTasks.length === 0) {
      return false;
    }

    // 并行查询所有任务状态
    const results = await Promise.all(
      runningTasks.map((task) =>
        task.task_id
          ? TaskOutput({
              task_id: task.task_id,
              block: false,
              timeout: 1000,
            }).catch((error) => ({
              task_id: task.task_id,
              status: "failed" as const,
              error: error.message,
              output: null,
            }))
          : Promise.resolve({
              task_id: null,
              status: "failed" as const,
              error: "缺失 task_id",
              output: null,
            }),
      ),
    );

    // 更新状态
    runningTasks.forEach((task, index) => {
      const result = results[index];

      if (result.status === "completed") {
        task.status = "completed";
        task.completed_at = new Date().toISOString();

        // 提取输出和 SESSION_ID
        if (result.output) {
          const parsed = parseTaskOutput(result.output);
          if (parsed.outputFile) task.output = parsed.outputFile;
          if (parsed.sessionId) task.session_id = parsed.sessionId;
        }

        state.parallel_execution.active_tasks--;
        state.parallel_execution.completed_tasks++;
        updated = true;

        console.log(`✅ 任务完成: ${task.id}`);
      } else if (result.status === "failed") {
        task.status = "failed";
        task.error = result.error || "Unknown error";
        task.completed_at = new Date().toISOString();
        state.parallel_execution.active_tasks--;
        state.parallel_execution.failed_tasks++;
        updated = true;

        console.log(`❌ 任务失败: ${task.id} - ${task.error}`);
      }
    });

    // 保存状态文件
    if (updated) {
      await saveStateFile(this.stateFile, state);
    }

    return updated;
  }

  /**
   * 获取当前并发数
   */
  async getCurrentConcurrency(): Promise<number> {
    const state = await readStateFile(this.stateFile);
    return state.parallel_execution.active_tasks;
  }

  /**
   * 等待所有任务完成
   */
  async waitForAllTasks(): Promise<number> {
    console.log("⏳ 等待所有后台任务完成...");

    let state = await readStateFile(this.stateFile);
    let runningTasks = state.subtasks.filter((t) => t.status === "running");

    while (runningTasks.length > 0) {
      console.log(`   运行中: ${runningTasks.length} 个任务`);

      // 更新状态
      await this.updateTaskStatuses();

      // 重新读取状态
      state = await readStateFile(this.stateFile);
      runningTasks = state.subtasks.filter((t) => t.status === "running");

      if (runningTasks.length > 0) {
        await sleep(this.pollInterval);
      }
    }

    const completed = state.parallel_execution.completed_tasks;
    const failed = state.parallel_execution.failed_tasks;

    console.log(`✅ 所有任务完成: ${completed} 成功, ${failed} 失败`);

    return completed;
  }
}
```

## 使用场景

### 场景 1: 双模型并行分析

```typescript
// dev-orchestrator: 同时启动 Codex 和 Gemini 分析
const manager = new ConcurrencyManager(".claude/developing.local.md");

// 定义任务
const tasks = [
  {
    id: "codex-analyzer",
    backend: "codex" as const,
    role: "analyzer",
    prompt: "分析后端代码架构",
    workdir: process.cwd(),
  },
  {
    id: "gemini-analyzer",
    backend: "gemini" as const,
    role: "analyzer",
    prompt: "分析前端 UI 设计",
    workdir: process.cwd(),
  },
];

// 并行启动（自动控制并发）
const taskIds = await Promise.all(
  tasks.map((task) => manager.acquireAndStart(task)),
);

console.log(`已启动 ${taskIds.length} 个任务`);

// 等待所有任务完成
await manager.waitForAllTasks();
```

### 场景 2: 批量启动受限并发

```typescript
// test-orchestrator: 启动 10 个测试任务（受限于 8 个并发）
const manager = new ConcurrencyManager(".claude/testing.local.md");

const testTasks = Array.from({ length: 10 }, (_, i) => ({
  id: `test-${i + 1}`,
  backend: "codex" as const,
  role: "tester",
  prompt: `执行测试套件 ${i + 1}`,
  workdir: process.cwd(),
}));

// 串行启动（内部自动等待槽位）
for (const task of testTasks) {
  await manager.acquireAndStart(task);
  // acquireAndStart 内部会等待槽位，最多 8 个并发
}

// 等待全部完成
await manager.waitForAllTasks();
```

### 场景 3: 多阶段任务控制

```typescript
// review-orchestrator: 分阶段启动任务
const manager = new ConcurrencyManager(".claude/reviewing.local.md");

// Phase 1: 启动静态分析
await manager.acquireAndStart({
  id: "codex-static-analysis",
  backend: "codex",
  role: "analyzer",
  prompt: "静态代码分析",
  workdir: process.cwd(),
});

// Phase 2: 等待 Phase 1 完成
await manager.waitForAllTasks();

// Phase 3: 启动深度审查
await manager.acquireAndStart({
  id: "codex-deep-review",
  backend: "codex",
  role: "reviewer",
  prompt: "深度代码审查",
  workdir: process.cwd(),
});
```

## 槽位释放时机

### 自动释放

槽位在以下情况下自动释放：

1. **任务完成**: `TaskOutput()` 返回 `status: "completed"`
2. **任务失败**: `TaskOutput()` 返回 `status: "failed"`
3. **查询失败**: `TaskOutput()` 调用抛出异常

### 状态同步

```typescript
// updateTaskStatuses() 中的释放逻辑
if (result.status === "completed" || result.status === "failed") {
  state.parallel_execution.active_tasks--; // 释放槽位

  if (result.status === "completed") {
    state.parallel_execution.completed_tasks++;
  } else {
    state.parallel_execution.failed_tasks++;
  }

  await saveStateFile(this.stateFile, state);
}
```

## 轮询策略

### 自适应轮询间隔

```typescript
// 初始 2 秒，如果长时间无任务完成，逐步增加到 5 秒
let pollInterval = 2000;
const maxInterval = 5000;

async function adaptiveWait() {
  const updated = await manager.updateTaskStatuses();

  if (updated) {
    // 有任务完成，恢复快速轮询
    pollInterval = 2000;
  } else {
    // 无任务完成，增加间隔
    pollInterval = Math.min(pollInterval * 1.2, maxInterval);
  }

  await sleep(pollInterval);
}
```

### 超时机制

```typescript
// waitForSlot() 中的超时逻辑
const maxWaitTime = 6 * 60 * 1000; // 6 分钟
const startTime = Date.now();

while (Date.now() - startTime < maxWaitTime) {
  if (await tryAcquireSlot()) {
    return true;
  }
  await sleep(pollInterval);
}

throw new Error("等待槽位超时");
```

## 错误处理

### 槽位获取失败

```typescript
try {
  const taskId = await manager.acquireAndStart(taskConfig);
  console.log(`任务已启动: ${taskId}`);
} catch (error) {
  console.error(`启动任务失败: ${error.message}`);
  // 记录到状态文件
  await logFailure({
    task_id: taskConfig.id,
    error: error.message,
    timestamp: new Date().toISOString(),
  });
}
```

### 状态文件损坏

```typescript
async function readStateFileSafe(path: string): StateFileV2 {
  try {
    return await readStateFile(path);
  } catch (error) {
    console.error(`读取状态文件失败: ${error.message}`);
    // 恢复默认状态
    return createDefaultStateFile();
  }
}
```

## 性能考虑

### 1. 并行查询优化

避免串行查询每个任务，使用 `Promise.all()` 并行查询：

```typescript
// ✅ 高效：并行查询
const results = await Promise.all(
  runningTasks.map((task) => TaskOutput({ task_id: task.task_id })),
);

// ❌ 低效：串行查询
for (const task of runningTasks) {
  const result = await TaskOutput({ task_id: task.task_id });
  // 处理结果...
}
```

### 2. 状态文件缓存

减少文件 I/O，使用内存缓存：

```typescript
class ConcurrencyManager {
  private stateCache: StateFileV2 | null = null;
  private cacheExpiry: number = 0;

  async readState(): Promise<StateFileV2> {
    const now = Date.now();
    if (this.stateCache && now < this.cacheExpiry) {
      return this.stateCache;
    }

    this.stateCache = await readStateFile(this.stateFile);
    this.cacheExpiry = now + 1000; // 缓存 1 秒
    return this.stateCache;
  }
}
```

### 3. 最小轮询频率

避免过高频率的轮询：

```typescript
// 最小间隔 1 秒
const MIN_POLL_INTERVAL = 1000;

await sleep(Math.max(pollInterval, MIN_POLL_INTERVAL));
```

## 验证清单

- [ ] 并发数不超过 8（全局约束）
- [ ] 槽位满时正确等待并轮询
- [ ] 任务完成时自动释放槽位
- [ ] 任务失败时自动释放槽位
- [ ] active_tasks 计数器准确
- [ ] 支持多 orchestrator 共享槽位
- [ ] 等待超时后抛出异常
- [ ] 状态文件同步正确

## 相关文档

- Task 1.1: 后台任务适配层
- Task 1.2: 任务结果收集器
- Task 1.3: 状态文件 V2 格式定义
- Task 1.5: 断点恢复检测器
- Stage 2 Task 2.1: Orchestrator 后台任务适配层（声明式 API）
