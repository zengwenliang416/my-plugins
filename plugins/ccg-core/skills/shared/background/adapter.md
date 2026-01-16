# 后台任务适配层

## 概述

封装 Claude Code 的 `run_in_background` 参数，为 orchestrator 提供统一的后台任务启动接口。支持 Codex 和 Gemini 两种外部模型后端，支持会话延续。

## 设计目标

1. **统一接口**: 屏蔽后端差异，提供声明式配置
2. **会话管理**: 支持 SESSION_ID 延续对话上下文
3. **错误隔离**: 后台任务失败不影响主流程
4. **可追踪**: 返回 task_id 用于断点恢复和进度查询

## 接口设计

### 配置接口

```typescript
interface BackgroundTaskConfig {
  id: string; // 任务唯一标识（如 "codex_analyzer"）
  backend: "codex" | "gemini"; // 后端类型
  role: string; // 角色（analyzer, reviewer, prototyper 等）
  prompt: string; // 任务提示词
  workdir: string; // 工作目录（通常是项目根目录）
  session_id?: string; // 可选：继续会话
}
```

### 返回接口

```typescript
interface BackgroundTaskResult {
  task_id: string; // Claude Code 后台任务 ID
  started_at: string; // ISO8601 时间戳
  backend: string; // 后端类型
  role: string; // 角色
}
```

### 启动函数

```typescript
async function startBackgroundTask(
  config: BackgroundTaskConfig,
): Promise<BackgroundTaskResult>;
```

## Claude Code 集成方式

### 在 Orchestrator 中调用

```typescript
// 示例：在 dev-orchestrator SKILL.md 中启动双模型并行分析
const codexTask = await Task({
  subagent_type: "Bash",
  description: `codex analyzer: analyze backend logic`,
  prompt: `
    codeagent-wrapper codex \\
      --role analyzer \\
      --prompt "分析后端代码架构和潜在问题" \\
      --workdir "\${PWD}" \\
      --sandbox read-only \\
      --output .claude/developing/codex_analysis.md
  `,
  run_in_background: true,
});

const geminiTask = await Task({
  subagent_type: "Bash",
  description: `gemini analyzer: analyze frontend UI`,
  prompt: `
    codeagent-wrapper gemini \\
      --role analyzer \\
      --prompt "分析前端组件设计和用户体验" \\
      --workdir "\${PWD}" \\
      --output .claude/developing/gemini_analysis.md
  `,
  run_in_background: true,
});

// 保存 task_id 到状态文件
stateFile.parallel_execution.subtasks.codex_analyzer.task_id =
  codexTask.task_id;
stateFile.parallel_execution.subtasks.gemini_analyzer.task_id =
  geminiTask.task_id;
```

### 会话延续示例

```typescript
// 第一次调用（Phase 1: 分析）
const session1 = await Task({
  subagent_type: "Bash",
  description: "codex analyzer phase 1",
  prompt: `
    codeagent-wrapper codex \\
      --role analyzer \\
      --prompt "第一阶段：识别代码异味" \\
      --workdir "\${PWD}" \\
      --output .claude/reviewing/phase1_analysis.md
  `,
  run_in_background: true,
});

// 从输出中提取 SESSION_ID（假设输出格式包含此字段）
const sessionId = extractSessionId(session1.output);

// 第二次调用（Phase 2: 深度审查），延续会话
const session2 = await Task({
  subagent_type: "Bash",
  description: "codex reviewer phase 2",
  prompt: `
    codeagent-wrapper codex \\
      --role reviewer \\
      --session ${sessionId} \\
      --prompt "第二阶段：针对第一阶段发现的问题进行深度审查" \\
      --workdir "\${PWD}" \\
      --output .claude/reviewing/phase2_review.md
  `,
  run_in_background: true,
});
```

## codeagent-wrapper 命令规范

### Codex 后端

```bash
codeagent-wrapper codex \\
  --role <analyzer|reviewer|debugger|prototyper> \\
  --prompt "<任务描述>" \\
  --workdir "<工作目录>" \\
  --sandbox read-only \\
  [--session <SESSION_ID>] \\
  [--output <输出文件路径>]
```

**特点**:

- 强制只读沙箱 (`--sandbox read-only`)
- 适合后端逻辑、复杂链路分析、调试

### Gemini 后端

```bash
codeagent-wrapper gemini \\
  --role <analyzer|prototyper|designer> \\
  --prompt "<任务描述>" \\
  --workdir "<工作目录>" \\
  [--session <SESSION_ID>] \\
  [--output <输出文件路径>]
```

**特点**:

- 无沙箱限制
- 适合前端 UI、CSS、快速原型

## 输出格式

后台任务输出应保存到指定文件，推荐格式：

```markdown
# {Backend} {Role} 输出

**任务ID**: {task_id}
**开始时间**: {timestamp}
**会话ID**: {session_id}

---

## 分析结果

{外部模型输出内容}

---

**完成时间**: {timestamp}
```

## 错误处理

1. **启动失败**: 如果 `Task()` 调用失败，记录错误到状态文件，不重试
2. **执行失败**: 后台任务运行失败，通过 `TaskOutput()` 检测到后记录到日志
3. **超时**: 不设超时限制（`timeout: 0`）

## 验证清单

- [ ] 能够启动 Codex 后台任务
- [ ] 能够启动 Gemini 后台任务
- [ ] 返回有效的 task_id
- [ ] 支持会话延续（session_id）
- [ ] 后台任务失败不阻塞主流程
- [ ] 输出文件路径符合统一规范

## 相关文档

- Stage 1 Task 1.2: 任务结果收集器
- Stage 1 Task 1.5: 断点恢复检测器
- Stage 2 Task 2.4: SESSION_ID 持久化管理
