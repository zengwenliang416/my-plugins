#!/bin/bash
# =============================================================================
# subagent-start.sh - 子代理启动监控 Hook
# =============================================================================
# 用途: 在子代理启动时记录和配置环境
# 触发: SubagentStart
# 匹配: Explore|Plan 等子代理类型
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[SUBAGENT-START]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[SUBAGENT-START]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取子代理信息
session_id=$(echo "$input" | jq -r '.session_id // empty')
agent_type=$(echo "$input" | jq -r '.agent_type // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')
hook_event_name=$(echo "$input" | jq -r '.hook_event_name // empty')

# 记录子代理启动
log_info "🚀 子代理启动: $agent_type"
log_debug "   会话ID: $session_id"
log_debug "   工作目录: $cwd"

# 缓存子代理状态
mkdir -p "$HOME/.claude/tmp"
subagent_state_file="$HOME/.claude/tmp/subagent-state.json"

# 记录启动时间和类型
current_state=$(cat "$subagent_state_file" 2>/dev/null || echo '{"agents":[]}')
new_agent=$(cat <<EOF
{
  "agent_type": "$agent_type",
  "session_id": "$session_id",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "running"
}
EOF
)

# 更新状态文件
echo "$current_state" | jq --argjson new "$new_agent" '.agents += [$new]' > "$subagent_state_file"

# 输出成功（不阻止）
exit 0
