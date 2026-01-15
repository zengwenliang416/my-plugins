---
event: PostToolUse
matcher: Write|Edit|MultiEdit
command: ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/quality/auto-format.sh
timeout: 30
---

文件修改后自动格式化。
