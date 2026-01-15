# 错误处理标准化

## 核心原则
1. **直接记录，不重试**（用户约束）
2. **详细日志**：记录完整错误信息
3. **不降级**：不回退到同步执行

## 错误分类

### 1. 启动失败
```typescript
try {
  const taskId = await startBackgroundTask(config);
} catch (error) {
  await logFailure(config.id, error.message);
  // 不重试，继续其他任务
}
```

### 2. 执行失败
```typescript
if (result.status === 'failed') {
  subtask.status = 'failed';
  subtask.error = result.error;
  await logFailure(subtask.id, result.error);
  // 不重试
}
```

### 3. 超时处理
```typescript
// 不设置超时限制（用户约束）
await TaskOutput({ task_id, block: true, timeout: 0 });
```

## 验证清单
- [ ] 所有错误都被记录
- [ ] 不进行重试
- [ ] 不自动降级到同步
- [ ] 错误信息包含足够上下文
