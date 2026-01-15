# SESSION_ID 持久化管理

## 概述
管理 Codex 和 Gemini 的会话 ID，支持跨 Phase 延续对话上下文。

## 核心功能

### 保存会话 ID
```typescript
function saveSessionId(backend: 'codex' | 'gemini', sessionId: string, stateFile: string) {
  const state = readStateFile(stateFile);
  
  // 结束当前会话
  if (state.sessions[backend].current) {
    state.sessions[backend].history.push({
      id: state.sessions[backend].current,
      started_at: state.created_at,
      ended_at: new Date().toISOString(),
      phase: state.current_phase
    });
  }
  
  // 设置新会话
  state.sessions[backend].current = sessionId;
  saveStateFile(stateFile, state);
}
```

### 获取当前会话
```typescript
function getCurrentSession(backend: 'codex' | 'gemini', stateFile: string): string | null {
  const state = readStateFile(stateFile);
  return state.sessions[backend].current;
}
```

### 延续会话
```typescript
const sessionId = getCurrentSession('codex', stateFile);
if (sessionId) {
  // 使用 session_id 继续对话
  await startBackgroundTask({
    ...config,
    session_id: sessionId
  });
}
```

## 验证清单
- [ ] 能保存 SESSION_ID 到状态文件
- [ ] 能从输出提取 SESSION_ID
- [ ] 能在多个 Phase 间延续会话
- [ ] 历史记录正确维护
