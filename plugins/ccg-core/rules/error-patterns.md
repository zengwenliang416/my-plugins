# 错误模式文档（团队共享）

记录常见错误模式，避免重复踩坑。

## 格式

```markdown
### [错误类型]: 简短描述

**症状**: 错误表现
**根因**: 为什么会发生
**解决**: 正确做法
**文件**: 相关代码位置（可选）
```

## TypeScript/JavaScript

### [类型错误]: 异步函数返回类型推断

**症状**: `Type 'Promise<void>' is not assignable to type 'void'`
**根因**: 事件处理器期望同步函数，但传入了 async
**解决**: 用 IIFE 包裹或分离异步逻辑

```typescript
// ❌ 错误
button.onclick = async () => { await fetch(...) }

// ✅ 正确
button.onclick = () => { void fetchData() }
async function fetchData() { await fetch(...) }
```

### [运行时]: JSON.parse 空字符串

**症状**: `SyntaxError: Unexpected end of JSON input`
**根因**: 空字符串或 undefined 传入 JSON.parse
**解决**: 先验证再解析

```typescript
const data = input ? JSON.parse(input) : defaultValue;
```

## Go

### [并发]: goroutine 泄漏

**症状**: 内存持续增长，goroutine 数量不断上升
**根因**: channel 未关闭或 context 未取消
**解决**: 确保 goroutine 有退出路径

```go
// ✅ 正确
ctx, cancel := context.WithCancel(context.Background())
defer cancel()
go func() {
    select {
    case <-ctx.Done():
        return
    case result := <-ch:
        // process
    }
}()
```

## Claude Code 特有

### [Hook]: skill-forced-eval 跳过评估

**症状**: 应触发的 skill 未被调用
**根因**: 评估时写了"是"但未实际调用 Skill()
**解决**: 步骤 2 必须执行，评估后立即激活

### [MCP]: context7 库 ID 未解析

**症状**: `Library not found` 错误
**根因**: 直接调用 query-docs 未先调用 resolve-library-id
**解决**: 必须先调用 resolve-library-id 获取正确的库 ID

### [多模型]: Codex/Gemini 输出直接应用

**症状**: 代码风格不一致，冗余代码
**根因**: 外部模型输出未经 Claude 重构
**解决**: 所有外部模型输出视为"脏原型"，必须重构后交付

## 添加新模式

遇到新的错误模式时，按上述格式添加到对应分类下。
