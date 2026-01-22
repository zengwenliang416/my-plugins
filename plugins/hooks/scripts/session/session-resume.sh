#!/bin/bash
# =============================================================================
# session-resume.sh - 会话恢复 Hook
# =============================================================================
# 用途: 在会话恢复时加载上下文和状态
# 触发: SessionStart (matcher: resume)
# 新特性: SessionStart matcher 支持 startup/resume/clear/compact (2.1.14+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[SESSION-RESUME]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[SESSION-RESUME]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[SESSION-RESUME]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取会话信息
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')

log_info "🔄 恢复会话: $session_id"

# =============================================================================
# 恢复环境画像
# =============================================================================

restore_env_profile() {
    local profile_file="$HOME/.claude/tmp/env-profile.json"

    if [[ -f "$profile_file" ]]; then
        log_debug "   加载环境画像"
        # 环境画像已存在，无需重新采集
    else
        log_debug "   环境画像不存在，跳过恢复"
    fi
}

# =============================================================================
# 恢复子代理状态
# =============================================================================

restore_subagent_state() {
    local state_file="$HOME/.claude/tmp/subagent-state.json"

    if [[ -f "$state_file" ]]; then
        # 清理已完成的子代理记录
        jq '.agents |= map(select(.status == "running"))' "$state_file" > "$state_file.tmp" \
            && mv "$state_file.tmp" "$state_file"
        log_debug "   清理已完成的子代理记录"
    fi
}

# =============================================================================
# 检查上次会话状态
# =============================================================================

check_last_session() {
    local dir="${cwd:-$(pwd)}"

    # 检查是否有未完成的任务
    local todo_file="$HOME/.claude/todos.json"
    if [[ -f "$todo_file" ]]; then
        local pending=$(jq '[.[] | select(.status == "pending" or .status == "in_progress")] | length' "$todo_file" 2>/dev/null || echo "0")
        if [[ "$pending" -gt 0 ]]; then
            log_warn "⚠️ 发现 $pending 个未完成的任务"
        fi
    fi

    # 检查 Git 状态变化
    if [[ -d "$dir/.git" ]]; then
        local uncommitted=$(git -C "$dir" status --porcelain 2>/dev/null | wc -l || echo "0")
        if [[ "$uncommitted" -gt 0 ]]; then
            log_debug "   有 $uncommitted 个未提交的更改"
        fi
    fi
}

# =============================================================================
# 持久化会话 ID（使用 CLAUDE_ENV_FILE）
# =============================================================================

persist_session_info() {
    if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
        echo "export RESUMED_SESSION_ID='$session_id'" >> "$CLAUDE_ENV_FILE"
        echo "export SESSION_RESUMED_AT='$(date -u +%Y-%m-%dT%H:%M:%SZ)'" >> "$CLAUDE_ENV_FILE"
        log_debug "   会话信息已持久化"
    fi
}

# =============================================================================
# 输出恢复上下文
# =============================================================================

output_context() {
    # 使用 JSON 输出格式，添加 additionalContext
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "这是一个恢复的会话。请注意查看之前的任务进度。"
  }
}
EOF
}

# =============================================================================
# 主逻辑
# =============================================================================

main() {
    restore_env_profile
    restore_subagent_state
    check_last_session
    persist_session_info

    log_info "✅ 会话恢复完成"
    output_context
}

main
