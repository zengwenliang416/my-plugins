---
event: PreToolUse
matcher: KillShell
command: ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/security/killshell-guard.sh
timeout: 5
---

KillShell 工具使用前的安全检查。
