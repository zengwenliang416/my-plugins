---
name: session-compactor
description: |
  【触发条件】/memory compact 或会话结束前保存状态
  【核心产出】Recovery ID - 可用于恢复会话
  【专属用途】
    - 提取会话关键信息
    - 压缩为结构化文本
    - 保存到 MCP core_memory
  【强制工具】mcp core_memory
  【不触发】短会话或无重要内容时
allowed-tools:
  - mcp__core_memory__store
  - mcp__core_memory__retrieve
  - Write
  - Read
arguments:
  - name: session_id
    type: string
    required: false
    description: 会话 ID (默认当前会话)
  - name: include_code
    type: boolean
    default: false
    description: 是否包含代码片段
---

# Session Compactor - 会话压缩持久化

## 执行流程

```
1. 收集会话信息
   - 执行计划
   - 已读文件
   - 已修改文件
   - 关键决策
       │
       ▼
2. 结构化压缩
   - 保留执行计划完整性
   - 文件列表结构化
   - 决策理由简化
   - 代码片段可选包含
       │
       ▼
3. 生成快照
   - Markdown 格式
   - 包含恢复所需全部信息
       │
       ▼
4. 持久化存储
   mcp core_memory.store
   - key: session_{timestamp}
   - value: 压缩后的快照
       │
       ▼
5. 返回 Recovery ID
```

## 压缩规则

### 完整保留

```
- 执行计划 (任务列表、优先级)
- 关键决策 (选择了什么、为什么)
- 待处理任务
- 错误和解决方案
```

### 结构化压缩

```
- 文件列表 (路径、操作类型)
- 代码变更 (diff 摘要)
- 依赖关系
```

### 可选包含

```
- 代码片段 (--include_code)
- 完整 diff
- 调试日志
```

## 输出格式 (快照)

```markdown
# Session Snapshot

**Recovery ID**: SNAP-20240120-ABC123
**Created**: 2024-01-20T08:00:00Z
**Duration**: 45 minutes

## Execution Plan

### Completed

- [x] Task 1: 分析现有代码结构
- [x] Task 2: 实现核心功能

### In Progress

- [ ] Task 3: 编写单元测试

### Pending

- [ ] Task 4: 集成测试
- [ ] Task 5: 文档更新

## Key Decisions

### D1: 选择 JWT 而非 Session

- **决策**: 使用 JWT 进行身份验证
- **理由**: 支持分布式部署，无状态
- **替代方案**: Session + Redis

## Files Touched

### Created

- src/services/auth.ts
- src/utils/jwt.ts

### Modified

- src/routes/user.ts (添加登录路由)
- package.json (添加依赖)

### Read

- src/config/index.ts
- src/models/user.ts

## Important Context

- 项目使用 Express + TypeScript
- 数据库是 PostgreSQL
- 需要兼容现有的 session 系统

## Recovery Instructions

1. 读取此快照获取上下文
2. 从 "In Progress" 任务继续
3. 参考 "Key Decisions" 保持一致性
```

## 存储策略

### MCP core_memory

```javascript
// 存储
mcp__core_memory__store({
  key: `session_${timestamp}`,
  value: snapshot_markdown,
  metadata: {
    project: project_name,
    task: main_task,
    files_count: 10,
  },
});

// 检索
mcp__core_memory__retrieve({
  key: `session_${recovery_id}`,
});
```

### 本地备份

```
.claude/memory/sessions/
└── SNAP-20240120-ABC123.md
```

## 降级策略

```
MCP core_memory 不可用时:
├── 保存到本地文件
│   └── .claude/memory/sessions/{id}.md
├── 输出警告
└── 返回本地文件路径作为 Recovery ID
```

## 使用示例

```
# 压缩当前会话
/memory compact

# 包含代码片段
/memory compact --include-code

# 指定会话 ID
/memory compact WFS-20240120-001
```

## 恢复流程

```
1. 用户提供 Recovery ID
2. 从 core_memory 检索快照
3. 解析快照内容
4. 加载上下文到当前会话
5. 从 "In Progress" 任务继续
```
