#!/bin/bash
# =============================================================================
# pretooluse-router.sh - PreToolUse 路由器
# =============================================================================
# 用途: 根据工具名称分发到对应脚本
# 触发: PreToolUse (*)
# 新特性: 支持 updatedInput、additionalContext、permissionDecision (2.1.9+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 读取 stdin
input=$(cat)

# 提取工具信息 (2.0.43+ 支持 tool_use_id)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
tool_use_id=$(echo "$input" | jq -r '.tool_use_id // empty')

# 根据工具名称路由
case "$tool_name" in
  Bash)
    # 危险 SQL 检测
    echo "$input" | "$SCRIPT_DIR/security/db-guard.sh"
    ;;
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
