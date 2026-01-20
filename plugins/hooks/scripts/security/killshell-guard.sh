#!/bin/bash
# =============================================================================
# killshell-guard.sh - KillShell 拦截 Hook
# =============================================================================
# 用途: 防止 Claude 自动终止长时间运行的 codeagent-wrapper 任务
# 触发: PreToolUse (KillShell)
# 优先级: P1 - 保护多模型协作任务
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[KILLSHELL-GUARD]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[KILLSHELL-GUARD]${NC} $1" >&2; }
log_error() { echo -e "${RED}[KILLSHELL-GUARD]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取 shell_id
shell_id=$(echo "$input" | jq -r '.tool_input.shell_id // empty')

if [[ -z "$shell_id" ]]; then
    log_warn "无法获取 shell_id，放行"
    exit 0
fi

log_info "检测到 KillShell 请求: $shell_id"

# =============================================================================
# 保护规则：检查是否是 codeagent-wrapper 相关任务
# =============================================================================
# 由于我们无法直接获取进程信息，通过记录文件来追踪

TASK_REGISTRY="$HOME/.claude/tmp/codeagent-tasks.json"

# 如果注册表存在，检查是否是受保护的任务
if [[ -f "$TASK_REGISTRY" ]]; then
    # 检查 shell_id 是否在受保护列表中
    is_protected=$(jq -r --arg id "$shell_id" '.[$id] // empty' "$TASK_REGISTRY" 2>/dev/null || echo "")

    if [[ -n "$is_protected" ]]; then
        log_warn "⛔ 此任务正在运行 codeagent-wrapper ($is_protected)"
        log_warn "   长时间运行的多模型协作任务不应被自动终止"
        log_warn "   如确需终止，请手动执行或使用 /tasks 查看状态"

        echo '{"decision": "block", "reason": "受保护的 codeagent-wrapper 任务，禁止自动终止。如需终止请手动操作。"}'
        exit 0
    fi
fi

# =============================================================================
# 基于进程检测（备用方案）
# =============================================================================
# 尝试通过 ps 检测是否有 codeagent-wrapper 进程

if pgrep -f "codeagent-wrapper" >/dev/null 2>&1; then
    log_warn "⚠️ 检测到 codeagent-wrapper 进程正在运行"

    # 获取运行中的 codeagent-wrapper 进程信息
    running_tasks=$(ps aux | grep -E "[c]odeagent-wrapper" | head -3)
    if [[ -n "$running_tasks" ]]; then
        log_info "运行中的任务:"
        echo "$running_tasks" | while read -r line; do
            log_info "  $line"
        done
    fi

    # 默认阻止，保护长时间任务
    log_warn "   为保护多模型协作任务，此 kill 操作被拦截"
    echo '{"decision": "block", "reason": "检测到 codeagent-wrapper 进程运行中，为保护多模型协作任务，禁止自动终止。"}'
    exit 0
fi

# 没有检测到需要保护的任务，放行
log_info "✓ 未检测到需要保护的任务，允许终止"
exit 0
