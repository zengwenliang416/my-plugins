#!/bin/bash
# PreToolUse 路由器 - 根据工具名称分发到对应脚本

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 读取 stdin
input=$(cat)

# 提取工具名称
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# 根据工具名称路由
case "$tool_name" in
  KillShell)
    echo "$input" | "$SCRIPT_DIR/security/killshell-guard.sh"
    ;;
  Write)
    echo "$input" | "$SCRIPT_DIR/logging/auto-backup.sh"
    ;;
  mcp__*)
    echo "$input" | "$SCRIPT_DIR/logging/mcp-logger.sh"
    ;;
  Grep|Glob|Read)
    echo "$input" | "$SCRIPT_DIR/routing/auggie-priority.sh"
    ;;
  *)
    # 其他工具不处理
    exit 0
    ;;
esac
