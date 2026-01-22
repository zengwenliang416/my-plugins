#!/bin/bash
# =============================================================================
# smart-notify.sh - 智能通知分发 Hook
# =============================================================================
# 用途: 拦截和增强 Claude Code 的通知，支持多渠道分发
# 触发: Notification
# 新特性: Notification hook event (2.0.37+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[SMART-NOTIFY]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[SMART-NOTIFY]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[SMART-NOTIFY]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取通知信息
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')
hook_event_name=$(echo "$input" | jq -r '.hook_event_name // empty')

# 获取项目名
PROJECT_NAME=$(basename "${cwd:-$(pwd)}")
PROJECT_PATH="${cwd:-$(pwd)}"

# =============================================================================
# 通知渠道配置
# =============================================================================

# 桌面通知
send_desktop_notification() {
    local title="${1:-Claude Code}"
    local message="${2:-任务完成}"

    # macOS
    if [[ "$(uname)" == "Darwin" ]]; then
        # 使用自定义通知器（如果存在）
        local notifier="/Applications/ClaudeNotifier.app/Contents/MacOS/ClaudeNotifier"
        if [[ -x "$notifier" ]]; then
            local args=(-t "$title" -m "$message")
            local sound_file="$HOME/.claude/sounds/notification.aiff"
            [[ -f "$sound_file" ]] && args+=(-f "$sound_file")
            args+=(--project-path "$PROJECT_PATH" --project-name "$PROJECT_NAME")
            "$notifier" "${args[@]}" &
            disown
        else
            # 使用系统通知
            osascript -e "display notification \"$message\" with title \"$title\"" 2>/dev/null &
        fi
    # Linux
    elif command -v notify-send &>/dev/null; then
        notify-send "$title" "$message" &
    fi
}

# Bark 推送（iOS）
send_bark() {
    local title="${1:-Claude Code}"
    local message="${2:-任务完成}"

    local bark_key="${BARK_KEY:-}"
    [[ -z "$bark_key" ]] && return 0

    local server="${BARK_SERVER:-https://api.day.app}"
    curl -s -X POST "$server/$bark_key" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$title\",\"body\":\"$message\",\"group\":\"Claude\"}" \
        >/dev/null 2>&1 &
}

# ntfy 推送
send_ntfy() {
    local title="${1:-Claude Code}"
    local message="${2:-任务完成}"

    local topic="${NTFY_TOPIC:-}"
    [[ -z "$topic" ]] && return 0

    local server="${NTFY_SERVER:-https://ntfy.sh}"
    local auth_header=""
    [[ -n "${NTFY_TOKEN:-}" ]] && auth_header="-H \"Authorization: Bearer $NTFY_TOKEN\""

    curl -s -X POST "$server/$topic" \
        -H "Title: $title" \
        -H "Priority: 3" \
        $auth_header \
        -d "$message" \
        >/dev/null 2>&1 &
}

# Telegram 推送
send_telegram() {
    local title="${1:-Claude Code}"
    local message="${2:-任务完成}"

    local bot_token="${TELEGRAM_BOT_TOKEN:-}"
    local chat_id="${TELEGRAM_CHAT_ID:-}"
    [[ -z "$bot_token" || -z "$chat_id" ]] && return 0

    local text="*$title*\n$message"
    curl -s -X POST "https://api.telegram.org/bot$bot_token/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\":\"$chat_id\",\"text\":\"$text\",\"parse_mode\":\"Markdown\"}" \
        >/dev/null 2>&1 &
}

# Slack 推送
send_slack() {
    local title="${1:-Claude Code}"
    local message="${2:-任务完成}"

    local webhook_url="${SLACK_WEBHOOK_URL:-}"
    [[ -z "$webhook_url" ]] && return 0

    curl -s -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"*$title*\n$message\"}" \
        >/dev/null 2>&1 &
}

# Discord 推送
send_discord() {
    local title="${1:-Claude Code}"
    local message="${2:-任务完成}"

    local webhook_url="${DISCORD_WEBHOOK_URL:-}"
    [[ -z "$webhook_url" ]] && return 0

    curl -s -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "{\"content\":\"**$title**\n$message\"}" \
        >/dev/null 2>&1 &
}

# =============================================================================
# 智能通知分发
# =============================================================================

dispatch_notifications() {
    local title="${1:-Claude Code}"
    local message="${2:-任务完成}"

    # 始终发送桌面通知
    send_desktop_notification "$title" "$message"

    # 根据配置发送其他渠道
    local channels="${CLAUDE_NOTIFY_CHANNELS:-}"

    # 如果没有配置，使用默认渠道
    if [[ -z "$channels" ]]; then
        channels="${CLAUDE_NOTIFY_CHANNEL:-}"
    fi

    # 解析渠道列表（逗号分隔）
    IFS=',' read -ra channel_array <<< "$channels"
    for channel in "${channel_array[@]}"; do
        channel=$(echo "$channel" | xargs)  # trim whitespace
        case "$channel" in
            bark) send_bark "$title" "$message" ;;
            ntfy) send_ntfy "$title" "$message" ;;
            telegram) send_telegram "$title" "$message" ;;
            slack) send_slack "$title" "$message" ;;
            discord) send_discord "$title" "$message" ;;
        esac
    done
}

# =============================================================================
# 主逻辑
# =============================================================================

main() {
    local title="Claude Code"
    local message="$PROJECT_NAME 有新通知"

    log_info "📢 分发通知: $message"
    dispatch_notifications "$title" "$message"
}

main
exit 0
