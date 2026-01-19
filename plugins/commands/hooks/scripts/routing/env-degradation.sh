#!/bin/bash
# =============================================================================
# env-degradation.sh - 环境感知降级策略 Hook
# =============================================================================
# 用途: 根据环境画像动态调整 hook 行为，减少误触发
# 触发: PreToolUse (作为路由层)
# 优先级: P1 - 智能路由
# =============================================================================

set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[ENV-DEGRADATION]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[ENV-DEGRADATION]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 读取环境画像
PROFILE_FILE="$HOME/.claude/tmp/env-profile.json"
if [[ ! -f "$PROFILE_FILE" ]]; then
    # 没有环境画像，跳过降级检查
    exit 0
fi

profile=$(cat "$PROFILE_FILE")

# 提取环境信息
is_ci=$(echo "$profile" | jq -r '.is_ci // false')
is_container=$(echo "$profile" | jq -r '.is_container // false')
git_branch=$(echo "$profile" | jq -r '.git_branch // ""')
network_reachable=$(echo "$profile" | jq -r '.network_reachable // true')

# 提取当前工具信息
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# =============================================================================
# 降级规则引擎
# =============================================================================

# 规则配置文件
RULES_FILE="$HOME/.claude/env-degradation-rules.json"

# CI 环境规则
if [[ "$is_ci" == "true" ]]; then
    log_info "CI 环境检测，应用降级策略"

    # CI 环境跳过格式化（通常 CI 有自己的格式化检查）
    if [[ "$tool_name" == "auto-format" ]]; then
        log_warn "  → 跳过自动格式化（CI 环境）"
        echo '{"decision": "skip", "reason": "CI 环境跳过自动格式化"}'
        exit 0
    fi
fi

# 容器环境规则
if [[ "$is_container" == "true" ]]; then
    log_info "容器环境检测"

    # 容器内可能没有完整的开发工具
    if [[ "$tool_name" == "env-profiler" ]]; then
        log_warn "  → 容器环境简化环境检测"
    fi
fi

# Hotfix 分支快速模式
if [[ "$git_branch" == hotfix/* ]]; then
    log_info "Hotfix 分支检测，启用快速模式"

    # Hotfix 跳过非关键检查
    # 可以在这里添加更多规则
fi

# 网络不可达规则
if [[ "$network_reachable" == "false" ]]; then
    log_warn "网络不可达，跳过需要网络的检查"

    # 跳过需要网络的 hooks
    case "$tool_name" in
        dependency-audit|security-scan)
            echo '{"decision": "skip", "reason": "网络不可达，跳过远程检查"}'
            exit 0
            ;;
    esac
fi

# 没有触发降级规则，正常执行
exit 0
