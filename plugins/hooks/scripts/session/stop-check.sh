#!/bin/bash
# =============================================================================
# stop-check.sh - Stop Hook: 检查任务是否真正完成 + 发送通知
# =============================================================================
# 用途: 在 Claude 尝试结束时检查任务完成状态
# 触发: Stop
# 注意: Stop hook 使用顶层字段 (decision/reason)，不使用 hookSpecificOutput
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[STOP-CHECK]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[STOP-CHECK]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取信息
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')
stop_hook_active=$(echo "$input" | jq -r '.stop_hook_active // false')

# 获取项目名
PROJECT_NAME=$(basename "${cwd:-$(pwd)}")
PROJECT_PATH="${cwd:-$(pwd)}"

# 检查 todos.json
check_todos() {
    local todo_file="$HOME/.claude/todos.json"

    if [[ ! -f "$todo_file" ]]; then
        return 0
    fi

    # 检查是否有 in_progress 或 pending 任务
    local in_progress=$(jq '[.[] | select(.status == "in_progress")] | length' "$todo_file" 2>/dev/null || echo "0")
    local pending=$(jq '[.[] | select(.status == "pending")] | length' "$todo_file" 2>/dev/null || echo "0")

    if [[ "$in_progress" -gt 0 ]]; then
        log_warn "发现 $in_progress 个进行中的任务"
        # Stop hook 使用顶层字段，不使用 hookSpecificOutput
        cat <<EOF
{
  "decision": "block",
  "reason": "仍有 $in_progress 个进行中的任务，请先完成所有任务再结束",
  "systemMessage": "⚠️ 检测到未完成的任务"
}
EOF
        return 1
    fi

    if [[ "$pending" -gt 0 ]]; then
        log_warn "发现 $pending 个待处理的任务"
        cat <<EOF
{
  "decision": "block",
  "reason": "仍有 $pending 个待处理的任务，请先完成所有任务再结束",
  "systemMessage": "⚠️ 检测到待处理的任务"
}
EOF
        return 1
    fi

    return 0
}

# 发送桌面通知
send_desktop_notification() {
    local notifier="/Applications/ClaudeNotifier.app/Contents/MacOS/ClaudeNotifier"
    local sound_file="$HOME/.claude/sounds/done-custom.aiff"
    local message="$PROJECT_NAME 项目任务已完成"

    if [[ -x "$notifier" ]]; then
        local args=(-t "Claude Code" -m "$message")

        if [[ -f "$sound_file" ]]; then
            args+=(-f "$sound_file")
        fi

        # 检测终端类型
        local host_bundle_id=""
        case "${TERM_PROGRAM:-}" in
            apple_terminal) host_bundle_id="com.apple.Terminal" ;;
            iTerm.app) host_bundle_id="com.googlecode.iterm2" ;;
            vscode) host_bundle_id="com.microsoft.VSCode" ;;
            cursor) host_bundle_id="com.todesktop.230313mzl4w4u92" ;;
            WarpTerminal) host_bundle_id="dev.warp.Warp-Stable" ;;
        esac

        # Zed 检测
        if [[ -n "${ZED_WINDOW_ID:-}" ]]; then
            host_bundle_id="dev.zed.Zed"
        fi

        if [[ -n "$host_bundle_id" ]]; then
            args+=(--host-bundle-id "$host_bundle_id")
        fi

        args+=(--project-path "$PROJECT_PATH" --project-name "$PROJECT_NAME")

        "$notifier" "${args[@]}" &
        disown
    fi
}

# 发送 Bark 推送
send_bark() {
    local bark_key="${BARK_KEY:-}"
    if [[ -z "$bark_key" ]]; then
        return 0
    fi

    local server="${BARK_SERVER:-https://api.day.app}"
    local title="Claude Code"
    local body="$PROJECT_NAME 项目任务已完成"

    curl -s -X POST "$server/$bark_key" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$title\",\"body\":\"$body\",\"group\":\"Claude\"}" \
        >/dev/null 2>&1 &
}

# 发送 ntfy 推送
send_ntfy() {
    local topic="${NTFY_TOPIC:-}"
    if [[ -z "$topic" ]]; then
        return 0
    fi

    local server="${NTFY_SERVER:-https://ntfy.sh}"
    local title="Claude Code"
    local message="$PROJECT_NAME 项目任务已完成"

    local auth_header=""
    if [[ -n "${NTFY_TOKEN:-}" ]]; then
        auth_header="-H \"Authorization: Bearer $NTFY_TOKEN\""
    fi

    curl -s -X POST "$server/$topic" \
        -H "Title: $title" \
        -H "Priority: 3" \
        $auth_header \
        -d "$message" \
        >/dev/null 2>&1 &
}

# 发送 Telegram 推送
send_telegram() {
    local bot_token="${TELEGRAM_BOT_TOKEN:-}"
    local chat_id="${TELEGRAM_CHAT_ID:-}"

    if [[ -z "$bot_token" || -z "$chat_id" ]]; then
        return 0
    fi

    local title="Claude Code"
    local message="$PROJECT_NAME 项目任务已完成"
    local text="*$title*\n$message"

    curl -s -X POST "https://api.telegram.org/bot$bot_token/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\":\"$chat_id\",\"text\":\"$text\",\"parse_mode\":\"Markdown\"}" \
        >/dev/null 2>&1 &
}

# 发送通知
send_notifications() {
    send_desktop_notification

    local channel="${CLAUDE_NOTIFY_CHANNEL:-}"
    case "$channel" in
        bark) send_bark ;;
        ntfy) send_ntfy ;;
        telegram) send_telegram ;;
    esac
}

# =============================================================================
# 主逻辑
# =============================================================================

main() {
    if ! check_todos; then
        exit 0  # 已输出 block 决策
    fi

    log_info "任务检查通过，允许结束"

    # Stop hook 使用顶层字段
    cat <<EOF
{
  "decision": "approve"
}
EOF

    # 异步发送通知
    send_notifications
    log_info "通知发送完成"
}

main
