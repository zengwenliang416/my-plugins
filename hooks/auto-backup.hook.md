---
event: PreToolUse
matcher: Write
command: ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/logging/auto-backup.sh
timeout: 10
---

写入文件前自动备份。
