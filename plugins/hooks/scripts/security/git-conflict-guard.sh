#!/bin/bash
# =============================================================================
# git-conflict-guard.sh - Git 冲突标记检测 Hook
# =============================================================================
# 用途: 检测并拦截包含冲突标记的 git commit 操作
# 触发: PreToolUse (Bash)
# 优先级: P0 - 最高安全优先级
# 新特性: 支持 permissionDecision (2.1.9+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[GIT-CONFLICT-GUARD]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[GIT-CONFLICT-GUARD]${NC} $1" >&2; }
log_error() { echo -e "${RED}[GIT-CONFLICT-GUARD]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取命令内容
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# 如果没有命令，返回空 JSON
if [[ -z "$command" ]]; then
    echo "{}"
    exit 0
fi

# 检测是否为 git commit 命令
if ! echo "$command" | grep -qE 'git[[:space:]]+commit'; then
    echo "{}"
    exit 0
fi

# =============================================================================
# Git 冲突标记检测
# =============================================================================

# 检查是否在 git 仓库中
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    log_warn "⚠️ 不在 Git 仓库中，跳过冲突检测"
    echo "{}"
    exit 0
fi

# 检测冲突标记 (<<<<<<< ======= >>>>>>>)
conflict_markers=$(git diff --cached 2>/dev/null | grep -cE '^[<>=]{7}' || echo 0)

if [[ $conflict_markers -gt 0 ]]; then
    log_error "⛔ 检测到 Git 冲突标记!"
    log_error "   发现 $conflict_markers 处冲突标记"
    log_warn "   建议: 请解决所有冲突后再提交"

    cat <<EOF
{
  "hookSpecificOutput": {
    "permissionDecision": "deny",
    "permissionDecisionReason": "❌ Conflict markers detected in staged files. Please resolve conflicts before committing."
  }
}
EOF
    exit 0
fi

# 使用 git diff --check 检测空白错误和冲突
check_output=$(git diff --cached --check 2>&1 || true)
if [[ -n "$check_output" ]] && echo "$check_output" | grep -qiE '(conflict|leftover|unmerged)'; then
    log_error "⛔ Git diff --check 检测到冲突或未合并的内容"
    log_error "   详情: $check_output"

    cat <<EOF
{
  "hookSpecificOutput": {
    "permissionDecision": "deny",
    "permissionDecisionReason": "❌ Conflict markers detected in staged files. Please resolve conflicts before committing."
  }
}
EOF
    exit 0
fi

# 没有检测到冲突，放行
log_info "✅ No conflict markers detected"
cat <<EOF
{
  "hookSpecificOutput": {
    "message": "✅ No conflict markers detected"
  }
}
EOF
exit 0
