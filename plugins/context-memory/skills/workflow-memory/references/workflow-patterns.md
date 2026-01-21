# Workflow Memory Patterns

## 工作流类型

| 工作流 | 阶段                                              | 典型耗时  |
| ------ | ------------------------------------------------- | --------- |
| dev    | context → analyze → prototype → implement → audit | 30-60 min |
| review | collect → analyze → generate-report               | 10-20 min |
| commit | collect → analyze → generate-message → execute    | 5-10 min  |
| docs   | plan → generate → update                          | 15-30 min |

## 状态持久化

### 检查点策略

```
每阶段完成后:
1. 保存当前状态到 .claude/memory/workflows/
2. 记录阶段输出
3. 更新时间戳

恢复流程:
1. 读取最后检查点
2. 验证文件完整性
3. 从断点继续
```

### 状态文件结构

```
.claude/memory/workflows/
├── active/
│   └── dev-abc123.json      # 进行中的工作流
├── completed/
│   └── dev-xyz789.json      # 已完成
└── failed/
    └── dev-err456.json      # 失败记录
```

## 跨会话恢复

### 恢复命令

```bash
/memory workflow resume <workflow_id>
```

### 恢复检查

```
1. 验证工作流存在
2. 检查文件完整性
3. 加载上下文
4. 定位到当前阶段
5. 继续执行
```

## 工作流协作

### 并行执行

```
dev-workflow
    │
    ├── Phase: analyze
    │   ├── codex-cli (后端分析) ─┐
    │   └── gemini-cli (前端分析) ─┴─> 合并
    │
    └── Phase: prototype
        ├── codex-cli (核心逻辑) ─┐
        └── gemini-cli (UI 原型) ─┴─> 合并
```

### 状态同步

```typescript
// 多模型输出合并
interface PhaseResult {
  model: "codex" | "gemini";
  output: string;
  confidence: number;
}

function mergeResults(results: PhaseResult[]): string {
  // 按 confidence 排序，合并
}
```
