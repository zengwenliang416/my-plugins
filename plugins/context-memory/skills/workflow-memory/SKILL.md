---
name: workflow-memory
description: |
  【触发条件】/memory workflow <id|all> 或需要持久化工作流状态时
  【核心产出】.claude/memory/workflows/{id}.json - 工作流记忆文件
  【专属用途】
    - 保存工作流执行状态
    - 记录阶段性产出
    - 支持跨会话恢复
    - 查询历史工作流
  【强制工具】Write, Read, mcp core_memory
  【不触发】无活跃工作流时
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/workflow-manager.ts`).
allowed-tools:
  - Write
  - Read
  - Glob
  - mcp__core_memory__store
  - mcp__core_memory__retrieve
arguments:
  - name: action
    type: string
    required: true
    description: 操作 (save|load|list|clean)
  - name: workflow_id
    type: string
    required: false
    description: 工作流 ID (save/load 时必需，list/clean 时可选)
  - name: data
    type: object
    required: false
    description: 要保存的工作流数据 (save 时使用)
---

# Workflow Memory - 工作流记忆管理

## Script Entry

```bash
npx tsx scripts/workflow-manager.ts [args]
```

## Resource Usage

- Reference docs: `references/workflow-patterns.md`
- Assets: `assets/workflow-schema.json`
- Execution script: `scripts/workflow-manager.ts`

## 执行流程

### save 操作

```
1. 验证 workflow_id
       │
       ▼
2. 收集工作流状态
   - 当前阶段
   - 已完成步骤
   - 中间产出
   - 错误记录
       │
       ▼
3. 结构化存储
   - 本地: .claude/memory/workflows/{id}.json
   - MCP: core_memory.store
       │
       ▼
4. 返回确认
```

### load 操作

```
1. 查找工作流
   - 优先 MCP core_memory
   - 降级本地文件
       │
       ▼
2. 验证完整性
   - 检查必需字段
   - 验证版本兼容
       │
       ▼
3. 返回工作流状态
```

### list 操作

```
1. 扫描本地目录
   Glob(".claude/memory/workflows/*.json")
       │
       ▼
2. 查询 MCP core_memory
   - 前缀匹配 "workflow_"
       │
       ▼
3. 合并去重
       │
       ▼
4. 按时间排序返回
```

### clean 操作

```
1. 识别过期工作流
   - 超过 30 天未更新
   - 已标记为 completed
       │
       ▼
2. 确认删除
       │
       ▼
3. 清理本地和 MCP
```

## 工作流状态结构

```json
{
  "id": "WFS-20240120-001",
  "type": "dev",
  "name": "实现用户认证功能",
  "created": "2024-01-20T08:00:00Z",
  "updated": "2024-01-20T10:30:00Z",
  "status": "in_progress",
  "phases": [
    {
      "name": "context-retrieval",
      "status": "completed",
      "started": "2024-01-20T08:00:00Z",
      "ended": "2024-01-20T08:15:00Z",
      "outputs": ["context.json"]
    },
    {
      "name": "multi-model-analysis",
      "status": "completed",
      "started": "2024-01-20T08:15:00Z",
      "ended": "2024-01-20T08:45:00Z",
      "outputs": ["analysis-codex.md", "analysis-gemini.md"]
    },
    {
      "name": "prototype-generation",
      "status": "in_progress",
      "started": "2024-01-20T08:45:00Z",
      "progress": 60
    }
  ],
  "artifacts": {
    "files_created": ["src/services/auth.ts", "src/utils/jwt.ts"],
    "files_modified": ["src/routes/user.ts"],
    "documents": ["context.json", "analysis-codex.md"]
  },
  "context": {
    "project_root": "/path/to/project",
    "branch": "feature/user-auth",
    "commit_start": "abc123"
  },
  "errors": [],
  "metadata": {
    "session_count": 2,
    "total_duration_ms": 9000000,
    "models_used": ["codex", "gemini"]
  }
}
```

## 存储策略

### 本地存储

```
.claude/memory/workflows/
├── WFS-20240120-001.json
├── WFS-20240119-003.json
└── index.json              # 快速索引
```

### MCP core_memory

```javascript
// 存储
mcp__core_memory__store({
  key: `workflow_${workflow_id}`,
  value: JSON.stringify(workflowState),
  metadata: {
    type: workflow.type,
    status: workflow.status,
    updated: workflow.updated,
  },
});

// 检索
mcp__core_memory__retrieve({
  key: `workflow_${workflow_id}`,
});
```

### 同步策略

```
1. 写入时: 同时写入本地和 MCP
2. 读取时: 优先 MCP，降级本地
3. 冲突时: 以 MCP 为准，更新本地
```

## 工作流 ID 格式

```
WFS-{YYYYMMDD}-{序号}
例: WFS-20240120-001

类型前缀:
- WFS: 标准工作流
- WFD: 调试工作流
- WFT: 测试工作流
```

## 使用示例

```bash
# 保存当前工作流
/memory workflow save WFS-20240120-001

# 加载工作流继续
/memory workflow load WFS-20240120-001

# 列出所有工作流
/memory workflow list

# 列出特定类型
/memory workflow list --type dev

# 清理过期工作流
/memory workflow clean

# 查看特定工作流详情
/memory workflow WFS-20240120-001
```

## 自动保存

```
触发时机:
├── 阶段完成时
├── 错误发生时
├── 会话结束前
└── 手动调用 /memory compact

保存内容:
├── 当前阶段状态
├── 中间产出路径
├── 下一步骤提示
└── 恢复所需上下文
```

## 恢复流程

```
1. 用户执行 /memory workflow load {id}
       │
       ▼
2. 加载工作流状态
       │
       ▼
3. 显示恢复摘要
   - 已完成: 2/5 阶段
   - 当前: prototype-generation (60%)
   - 产出: 3 个文件
       │
       ▼
4. 询问继续方式
   - 从当前位置继续
   - 重新开始当前阶段
   - 回退到上一阶段
       │
       ▼
5. 恢复上下文并继续
```

## 降级策略

```
MCP core_memory 不可用时:
├── 仅使用本地存储
├── 输出警告信息
└── 建议检查 MCP 配置

本地存储失败时:
├── 尝试写入临时目录
├── 输出工作流状态到控制台
└── 提示手动保存
```

## 清理策略

```
自动清理条件:
├── 状态为 completed 且超过 7 天
├── 状态为 failed 且超过 3 天
├── 状态为 abandoned 且超过 1 天
└── 手动标记为删除

保留条件:
├── 状态为 in_progress
├── 标记为 starred
└── 最近 24 小时内访问
```
