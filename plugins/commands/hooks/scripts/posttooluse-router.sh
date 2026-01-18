#!/bin/bash
# PostToolUse 路由器 - 根据工具名称分发到对应脚本

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 读取 stdin
input=$(cat)

# 提取工具名称
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# 根据工具名称路由
case "$tool_name" in
  Write|Edit|MultiEdit)
    echo "$input" | "$SCRIPT_DIR/quality/auto-format.sh"
    ;;
  *)
    # 其他工具不处理
    exit 0
    ;;
esac
