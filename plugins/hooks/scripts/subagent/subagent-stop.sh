#!/bin/bash
# =============================================================================
# subagent-stop.sh - 子代理完成处理 Hook
# =============================================================================
# 用途: 在子代理完成时进行结果处理和日志记录
# 触发: SubagentStop
# 新特性: agent_id, agent_transcript_path (2.0.42+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[SUBAGENT-STOP]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[SUBAGENT-STOP]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[SUBAGENT-STOP]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取子代理信息 (2.0.42+ 新增字段)
session_id=$(echo "$input" | jq -r '.session_id // empty')
agent_id=$(echo "$input" | jq -r '.agent_id // empty')
agent_transcript_path=$(echo "$input" | jq -r '.agent_transcript_path // empty')
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')

# 记录子代理完成
log_info "✅ 子代理完成"
[[ -n "$agent_id" ]] && log_debug "   代理ID: $agent_id"
[[ -n "$agent_transcript_path" ]] && log_debug "   转录路径: $agent_transcript_path"

# 更新子代理状态
subagent_state_file="$HOME/.claude/tmp/subagent-state.json"
if [[ -f "$subagent_state_file" ]]; then
    # 标记为完成
    if [[ -n "$agent_id" ]]; then
        jq --arg id "$agent_id" '
            .agents |= map(
                if .session_id == $id then
                    . + {"status": "completed", "completed_at": (now | strftime("%Y-%m-%dT%H:%M:%SZ"))}
                else .
                end
            )
        ' "$subagent_state_file" > "$subagent_state_file.tmp" && mv "$subagent_state_file.tmp" "$subagent_state_file"
    fi
fi

# 分析转录文件（如果可用）
if [[ -n "$agent_transcript_path" && -f "$agent_transcript_path" ]]; then
    # 统计转录行数
    line_count=$(wc -l < "$agent_transcript_path" 2>/dev/null || echo "0")
    log_debug "   转录行数: $line_count"

    # 检查是否有错误
    if grep -q '"error"' "$agent_transcript_path" 2>/dev/null; then
        log_warn "   检测到错误记录，请检查转录文件"
    fi
fi

# 输出成功
exit 0
