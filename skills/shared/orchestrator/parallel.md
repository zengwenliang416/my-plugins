# Orchestrator 后台任务适配层

## 概述

为 orchestrator 提供声明式并行执行接口，通过 YAML 配置描述并行任务，自动处理后台任务启动、并发控制、状态跟踪和结果收集。隐藏底层复杂性，让 orchestrator 开发者专注于工作流逻辑。

## 设计目标

1. **声明式配置**: 通过 YAML 描述并行任务，无需编写并发控制代码
2. **自动并发管理**: 内置槽位管理，自动控制最大并发数
3. **透明状态跟踪**: 自动更新状态文件，支持断点恢复
4. **统一错误处理**: 标准化失败处理，符合用户约束（不重试）
5. **进度可视化**: 实时显示任务执行进度

## 声明式 API

### YAML 配置格式

在 orchestrator 的 SKILL.md 中使用以下格式声明并行任务：

```yaml
parallel_tasks:
  - id: codex-analysis # 任务唯一标识
    backend: codex # codex | gemini
    role: analyzer # analyzer | reviewer | prototyper | debugger | tester
    prompt: | # 任务提示词（支持变量插值）
      分析当前代码库中的 Bug：
      ${BUG_DESCRIPTION}

      输出：
      1. 可能的根因分析
      2. 建议的调试步骤
    output: .claude/debugging/analysis-codex.md # 输出文件路径

  - id: gemini-analysis
    backend: gemini
    role: analyzer
    prompt: |
      从前端/UX 角度分析 Bug：
      ${BUG_DESCRIPTION}

      输出：
      1. 用户体验影响分析
      2. 前端相关的潜在原因
    output: .claude/debugging/analysis-gemini.md
```

### 使用示例

在 orchestrator SKILL.md 中：

````markdown
## Phase 2: 多模型分析（并行）

**并行任务配置**：

\```yaml
parallel_tasks:

- id: codex-backend-analysis
  backend: codex
  role: analyzer
  prompt: |
  分析后端代码架构和潜在问题：
  ${TASK_DESCRIPTION}
  output: .claude/developing/backend-analysis.md

- id: gemini-frontend-analysis
  backend: gemini
  role: analyzer
  prompt: |
  分析前端 UI 设计和用户体验：
  ${TASK_DESCRIPTION}
  output: .claude/developing/frontend-analysis.md
  \```

**执行**：

\```typescript
await executeParallelPhase({
domain: "developing",
phaseName: "Phase2-analysis",
variables: {
TASK_DESCRIPTION: userInput,
},
});
\```

**输出**：

- `.claude/developing/backend-analysis.md`
- `.claude/developing/frontend-analysis.md`
- 更新状态文件（task_id、status、session_id 等）
````

## 核心函数实现

### executeParallelPhase

```typescript
interface ParallelPhaseConfig {
  domain: string; // orchestrator 领域（debugging, developing 等）
  phaseName: string; // 阶段名称（用于从 SKILL.md 提取配置）
  variables?: Record<string, string>; // 变量替换映射
  stateFile?: string; // 状态文件路径（默认：.claude/{domain}.local.md）
}

interface ParallelPhaseResult {
  success: boolean;
  totalTasks: number;
  completed: number;
  failed: number;
  taskResults: Array<{
    id: string;
    status: "completed" | "failed";
    output?: string;
    error?: string;
  }>;
}

async function executeParallelPhase(
  config: ParallelPhaseConfig,
): Promise<ParallelPhaseResult> {
  const {
    domain,
    phaseName,
    variables = {},
    stateFile = `.claude/${domain}.local.md`,
  } = config;

  // 1. 提取并行任务配置
  console.log(`📋 Phase: ${phaseName}`);
  const tasksConfig = await extractParallelConfig(phaseName);

  if (!tasksConfig || tasksConfig.parallel_tasks.length === 0) {
    throw new Error(`未找到 Phase ${phaseName} 的并行任务配置`);
  }

  const tasks = tasksConfig.parallel_tasks;
  console.log(`   任务数: ${tasks.length}`);
  console.log("");

  // 2. 初始化并发管理器
  const manager = new ConcurrencyManager(stateFile, 8);

  // 3. 变量替换
  const processedTasks = tasks.map((task) => ({
    ...task,
    prompt: replaceVariables(task.prompt, variables),
  }));

  // 4. 启动所有任务
  console.log("🚀 启动并行任务...");
  const taskIds: Array<{ id: string; task_id: string }> = [];

  for (const task of processedTasks) {
    try {
      const taskId = await manager.acquireAndStart({
        id: task.id,
        backend: task.backend,
        role: task.role,
        prompt: task.prompt,
        workdir: process.cwd(),
        output: task.output,
      });

      taskIds.push({ id: task.id, task_id: taskId });
      console.log(`   ✅ ${task.id}: 已启动`);
    } catch (error) {
      console.error(`   ❌ ${task.id}: 启动失败 - ${error.message}`);
      // 记录失败但继续启动其他任务
    }
  }

  console.log("");

  // 5. 等待所有任务完成
  console.log("⏳ 等待任务完成...");
  await manager.waitForAllTasks();

  // 6. 收集结果
  console.log("");
  console.log("📦 收集结果...");

  const state = await readStateFile(stateFile);
  const results: ParallelPhaseResult["taskResults"] = [];

  let completed = 0;
  let failed = 0;

  for (const { id } of taskIds) {
    const subtask = state.subtasks.find((t) => t.id === id);
    if (!subtask) continue;

    if (subtask.status === "completed") {
      completed++;
      results.push({
        id,
        status: "completed",
        output: subtask.output,
      });
      console.log(`   ✅ ${id}: 完成`);
    } else if (subtask.status === "failed") {
      failed++;
      results.push({
        id,
        status: "failed",
        error: subtask.error,
      });
      console.log(`   ❌ ${id}: 失败 - ${subtask.error}`);
    }
  }

  // 7. 输出统计
  console.log("");
  console.log("📊 执行统计:");
  console.log(`   - 总计: ${taskIds.length} 个任务`);
  console.log(`   - 成功: ${completed} 个`);
  console.log(`   - 失败: ${failed} 个`);

  return {
    success: failed === 0,
    totalTasks: taskIds.length,
    completed,
    failed,
    taskResults: results,
  };
}
```

### 辅助函数

#### extractParallelConfig

从 SKILL.md 中提取指定 Phase 的 YAML 配置。

````typescript
interface ParallelTaskConfig {
  id: string;
  backend: "codex" | "gemini";
  role: string;
  prompt: string;
  output: string;
}

interface ParallelTasksConfig {
  parallel_tasks: ParallelTaskConfig[];
}

async function extractParallelConfig(
  phaseName: string,
): Promise<ParallelTasksConfig> {
  // 1. 查找当前 orchestrator 的 SKILL.md
  const skillFile = await findCurrentSkillFile();

  // 2. 读取文件内容
  const content = await readFile(skillFile);

  // 3. 定位到指定 Phase
  const phaseRegex = new RegExp(`## ${phaseName}[\\s\\S]*?(?=##|$)`);
  const phaseMatch = content.match(phaseRegex);

  if (!phaseMatch) {
    throw new Error(`未找到 Phase: ${phaseName}`);
  }

  const phaseContent = phaseMatch[0];

  // 4. 提取 YAML 配置块
  const yamlRegex = /```yaml\n([\s\S]*?)\n```/;
  const yamlMatch = phaseContent.match(yamlRegex);

  if (!yamlMatch) {
    throw new Error(`Phase ${phaseName} 中未找到 YAML 配置`);
  }

  // 5. 解析 YAML
  const yamlContent = yamlMatch[1];
  const config = parseYAML(yamlContent) as ParallelTasksConfig;

  return config;
}
````

#### replaceVariables

替换提示词中的变量。

```typescript
function replaceVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\$\\{${key}\\}`, "g");
    result = result.replace(regex, value);
  }

  return result;
}
```

#### findCurrentSkillFile

查找当前 orchestrator 的 SKILL.md。

```typescript
async function findCurrentSkillFile(): Promise<string> {
  // 方法 1: 通过环境变量
  if (process.env.CLAUDE_SKILL_FILE) {
    return process.env.CLAUDE_SKILL_FILE;
  }

  // 方法 2: 通过调用栈推断
  const stack = new Error().stack;
  const agentMatch = stack?.match(/agents\/([\w-]+)\//);

  if (agentMatch) {
    const agentName = agentMatch[1];
    return `${process.cwd()}/agents/${agentName}/SKILL.md`;
  }

  // 方法 3: 查找最近的 SKILL.md
  let dir = process.cwd();
  while (dir !== "/") {
    const skillPath = `${dir}/SKILL.md`;
    if (await fileExists(skillPath)) {
      return skillPath;
    }
    dir = path.dirname(dir);
  }

  throw new Error("无法找到 SKILL.md 文件");
}
```

## 集成到 Orchestrator

### 步骤 1: 在 SKILL.md 中定义并行任务

````markdown
## Phase 2: 假设生成（并行）

**目标**: 同时使用 Codex 和 Gemini 生成问题假设

**并行任务配置**：

\```yaml
parallel_tasks:

- id: codex-hypothesis
  backend: codex
  role: analyzer
  prompt: |
  基于以下症状生成问题假设：
  ${SYMPTOMS}

  输出：
  1. 前 3 个最可能的假设
  2. 每个假设的验证步骤
     output: .claude/debugging/hypotheses-codex.md

- id: gemini-hypothesis
  backend: gemini
  role: analyzer
  prompt: |
  从用户体验角度生成问题假设：
  ${SYMPTOMS}

        输出：
        1. UX 相关的假设
        2. 前端层面的可能原因
      output: .claude/debugging/hypotheses-gemini.md

  \```

**执行**: 调用 `executeParallelPhase()`

**输出**: 两个假设文件 + 更新状态文件
````

### 步骤 2: 在代码中调用

```typescript
// 在 orchestrator 执行逻辑中
async function runPhase2() {
  const symptoms = await collectSymptoms(); // 从 Phase 1 获取

  const result = await executeParallelPhase({
    domain: "debugging",
    phaseName: "Phase 2: 假设生成（并行）",
    variables: {
      SYMPTOMS: symptoms,
    },
  });

  if (!result.success) {
    console.error(`⚠️  ${result.failed} 个任务失败，但将继续使用已完成的结果`);
  }

  // 继续下一阶段...
}
```

## 高级功能

### 条件并行

只在满足条件时启动某些任务：

```yaml
parallel_tasks:
  - id: codex-analysis
    backend: codex
    role: analyzer
    prompt: "分析代码..."
    output: .claude/output.md
    condition: ${HAS_BACKEND_CODE} # 变量为 "true" 时启动

  - id: gemini-analysis
    backend: gemini
    role: analyzer
    prompt: "分析 UI..."
    output: .claude/output.md
    condition: ${HAS_FRONTEND_CODE}
```

实现条件过滤：

```typescript
const tasksToRun = processedTasks.filter((task) => {
  if (task.condition === undefined) return true;
  return task.condition === "true" || task.condition === true;
});
```

### 会话延续

在多个 Phase 之间延续会话：

```yaml
parallel_tasks:
  - id: codex-phase2
    backend: codex
    role: reviewer
    prompt: "继续审查..."
    output: .claude/review-phase2.md
    continue_session: true # 使用上一个 Phase 的 session_id
```

实现会话延续：

```typescript
if (task.continue_session) {
  const state = await readStateFile(stateFile);
  const lastSession = state.sessions.codex.current;

  config.session_id = lastSession;
}
```

### 动态任务数量

根据输入动态生成任务列表：

```typescript
// 根据测试文件数量动态生成任务
const testFiles = await glob("tests/**/*.test.ts");

const tasks = testFiles.map((file, index) => ({
  id: `test-${index}`,
  backend: "codex",
  role: "tester",
  prompt: `为 ${file} 生成测试`,
  output: `.claude/testing/test-${index}.md`,
}));

// 批量启动（自动并发控制）
for (const task of tasks) {
  await manager.acquireAndStart(task);
}
```

## 错误处理

### 部分失败策略

默认：部分失败不影响其他任务，继续执行。

```typescript
if (!result.success) {
  console.warn(`⚠️  ${result.failed} 个任务失败`);

  // 可选：记录失败任务到日志
  for (const task of result.taskResults) {
    if (task.status === "failed") {
      await logFailure({
        domain: config.domain,
        phase: config.phaseName,
        task_id: task.id,
        error: task.error,
      });
    }
  }

  // 继续使用已完成的结果
  const successfulResults = result.taskResults.filter(
    (t) => t.status === "completed",
  );
  return successfulResults;
}
```

### 全部失败时中止

如果需要所有任务成功才继续：

```typescript
const result = await executeParallelPhase(config);

if (result.failed > 0) {
  throw new Error(`并行执行失败: ${result.failed} 个任务未完成`);
}
```

## 性能优化

### 批量启动优化

```typescript
// 并行启动所有任务（而非串行等待槽位）
const startPromises = processedTasks.map((task) =>
  manager.acquireAndStart(task).catch((error) => ({
    id: task.id,
    error: error.message,
  })),
);

const taskIds = await Promise.all(startPromises);
```

### 进度缓存

避免频繁读取状态文件：

```typescript
let lastUpdate = 0;
const UPDATE_INTERVAL = 1000; // 1 秒

async function getCachedState() {
  const now = Date.now();
  if (now - lastUpdate > UPDATE_INTERVAL) {
    stateCache = await readStateFile(stateFile);
    lastUpdate = now;
  }
  return stateCache;
}
```

## 验证清单

- [ ] 能从 SKILL.md 提取 YAML 配置
- [ ] 支持变量替换（${VAR_NAME}）
- [ ] 并行启动多个任务
- [ ] 自动并发控制（最大 8 个）
- [ ] 正确等待所有任务完成
- [ ] 统计成功/失败数量
- [ ] 更新状态文件（task_id、status、session_id）
- [ ] 部分失败时能继续执行
- [ ] 输出清晰的执行报告

## 相关文档

- Stage 1 Task 1.1: 后台任务适配层
- Stage 1 Task 1.6: 并发槽位管理器
- Stage 2 Task 2.2: 进度实时显示组件
- Stage 2 Task 2.3: 失败任务日志记录器
- Stage 3: 各 Orchestrator 集成实施
