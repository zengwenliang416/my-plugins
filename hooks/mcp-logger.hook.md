---
event: PreToolUse
matcher: mcp__.*
command: ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/logging/mcp-logger.sh
timeout: 5
---

MCP 工具调用日志记录。
