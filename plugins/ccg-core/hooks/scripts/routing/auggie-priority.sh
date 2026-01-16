#!/bin/bash
# PreToolUse:Grep|Glob|Read hook - 提醒优先使用 auggie-mcp 和 LSP
# 不阻止执行，只是提供建议

SESSION_FILE="/tmp/claude-session-${CLAUDE_SESSION_ID:-default}-smart-search-used"

# 检查本次会话是否已经使用过智能检索
if [[ -f "$SESSION_FILE" ]]; then
  exit 0
fi

# 解析工具输入，判断是否为符号级操作
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

# 首次搜索调用，提供智能路由建议
cat << 'EOF'
🔍 **智能检索路由（首次搜索提醒）**

**工具优先级**：
1. `mcp__auggie-mcp__codebase-retrieval` → 语义检索（"这个功能在哪？"）
2. `LSP` 操作 → 符号级精准（定义/引用/类型）
3. `Grep/Glob` → 精确字符串匹配

**LSP 必用场景**：
| 场景 | LSP 操作 | 示例 |
|------|----------|------|
| 跳转定义 | goToDefinition | 查看函数实现 |
| 查找引用 | findReferences | 重构前必查 |
| 查看类型 | hover | 了解接口签名 |
| 调用链 | incomingCalls/outgoingCalls | 理解调用关系 |
| 文件结构 | documentSymbol | 浏览文件符号 |

**示例**：
```typescript
// 语义检索
mcp__auggie-mcp__codebase-retrieval({ information_request: "用户认证逻辑" })

// LSP 精准定位
LSP({ operation: "goToDefinition", filePath: "src/auth.ts", line: 42, character: 10 })
LSP({ operation: "findReferences", filePath: "src/auth.ts", line: 42, character: 10 })
```

---
EOF

exit 0
