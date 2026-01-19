#!/bin/bash
# =============================================================================
# env-profiler.sh - 环境画像采集器 Hook
# =============================================================================
# 用途: 在会话启动时采集环境信息，为后续智能决策提供数据
# 触发: SessionStart
# 优先级: P1 - 基础设施
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[ENV-PROFILER]${NC} $1" >&2; }

# 读取 stdin（SessionStart 可能没有输入）
input=$(cat 2>/dev/null || echo "{}")

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

log_info "✓ 环境画像已采集: $HOME/.claude/tmp/env-profile.json"

exit 0
