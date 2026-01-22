#!/bin/bash
# =============================================================================
# env-profiler.sh - 环境画像采集器 Hook
# =============================================================================
# 用途: 在会话启动时采集环境信息，为后续智能决策提供数据
# 触发: SessionStart (matcher: startup)
# 优先级: P1 - 基础设施
# 新特性: CLAUDE_ENV_FILE 环境变量持久化 (2.1.10+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[ENV-PROFILER]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[ENV-PROFILER]${NC} $1" >&2; }

# 读取 stdin
input=$(cat 2>/dev/null || echo "{}")

# 提取会话信息 (2.1.14+)
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')

# =============================================================================
# 环境信息采集
# =============================================================================

# OS 信息
os_name=$(uname -s)
os_version=$(sw_vers -productVersion 2>/dev/null || uname -r)

# Shell 信息
shell_type="${SHELL:-/bin/bash}"

# 语言版本
node_version=$(node -v 2>/dev/null || echo "not installed")
python_version=$(python3 --version 2>/dev/null | cut -d' ' -f2 || echo "not installed")
java_version=$(java -version 2>&1 | head -1 | cut -d'"' -f2 || echo "not installed")
go_version=$(go version 2>/dev/null | cut -d' ' -f3 || echo "not installed")

# 容器/CI 检测
is_container=false
if [[ -f /.dockerenv ]] || grep -q 'docker\|containerd' /proc/1/cgroup 2>/dev/null; then
    is_container=true
fi

is_ci=false
if [[ -n "${CI:-}" || -n "${GITHUB_ACTIONS:-}" || -n "${GITLAB_CI:-}" || -n "${JENKINS_URL:-}" ]]; then
    is_ci=true
fi

# Git 信息
git_branch=$(git branch --show-current 2>/dev/null || echo "")
git_root=$(git rev-parse --show-toplevel 2>/dev/null || echo "")

# 网络检测（快速超时）
network_reachable=false
if timeout 1 curl -s --head https://api.anthropic.com >/dev/null 2>&1; then
    network_reachable=true
fi

# =============================================================================
# 生成环境画像 JSON
# =============================================================================

profile=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "session_id": "$session_id",
  "os": "$os_name",
  "os_version": "$os_version",
  "shell": "$shell_type",
  "node_version": "$node_version",
  "python_version": "$python_version",
  "java_version": "$java_version",
  "go_version": "$go_version",
  "is_container": $is_container,
  "is_ci": $is_ci,
  "git_branch": "$git_branch",
  "git_root": "$git_root",
  "network_reachable": $network_reachable
}
EOF
)

# 缓存环境画像
mkdir -p "$HOME/.claude/tmp"
echo "$profile" > "$HOME/.claude/tmp/env-profile.json"

log_info "✓ 环境画像已采集"

# =============================================================================
# 使用 CLAUDE_ENV_FILE 持久化环境变量 (2.1.10+)
# =============================================================================

if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
    log_debug "   使用 CLAUDE_ENV_FILE 持久化环境变量"

    # 设置常用环境变量供后续使用
    echo "export ENV_OS='$os_name'" >> "$CLAUDE_ENV_FILE"
    echo "export ENV_OS_VERSION='$os_version'" >> "$CLAUDE_ENV_FILE"
    echo "export ENV_NODE_VERSION='$node_version'" >> "$CLAUDE_ENV_FILE"
    echo "export ENV_PYTHON_VERSION='$python_version'" >> "$CLAUDE_ENV_FILE"
    echo "export ENV_IS_CONTAINER=$is_container" >> "$CLAUDE_ENV_FILE"
    echo "export ENV_IS_CI=$is_ci" >> "$CLAUDE_ENV_FILE"
    echo "export ENV_GIT_BRANCH='$git_branch'" >> "$CLAUDE_ENV_FILE"
    echo "export ENV_NETWORK_REACHABLE=$network_reachable" >> "$CLAUDE_ENV_FILE"

    log_debug "   环境变量已写入: $CLAUDE_ENV_FILE"
fi

# =============================================================================
# 输出上下文信息 (2.1.9+ hookSpecificOutput)
# =============================================================================

# 构建环境摘要
env_summary="OS: $os_name $os_version"
[[ "$node_version" != "not installed" ]] && env_summary+=", Node: $node_version"
[[ "$python_version" != "not installed" ]] && env_summary+=", Python: $python_version"
[[ -n "$git_branch" ]] && env_summary+=", Branch: $git_branch"
[[ "$is_ci" == "true" ]] && env_summary+=", CI环境"
[[ "$is_container" == "true" ]] && env_summary+=", 容器环境"

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "环境画像: $env_summary"
  }
}
EOF

exit 0
