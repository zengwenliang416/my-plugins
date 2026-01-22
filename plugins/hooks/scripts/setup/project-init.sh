#!/bin/bash
# =============================================================================
# project-init.sh - 项目初始化 Hook
# =============================================================================
# 用途: 在 --init 或 --init-only 时执行项目初始化
# 触发: Setup (matcher: init)
# 调用: claude --init 或 claude --init-only
# 新特性: CLAUDE_ENV_FILE 环境变量持久化 (2.1.10+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[PROJECT-INIT]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[PROJECT-INIT]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[PROJECT-INIT]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取信息
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')
hook_event_name=$(echo "$input" | jq -r '.hook_event_name // empty')

log_info "🚀 开始项目初始化..."
log_debug "   工作目录: $cwd"

# =============================================================================
# 检测项目类型
# =============================================================================

detect_project_type() {
    local dir="${1:-$(pwd)}"

    if [[ -f "$dir/package.json" ]]; then
        echo "node"
    elif [[ -f "$dir/Cargo.toml" ]]; then
        echo "rust"
    elif [[ -f "$dir/go.mod" ]]; then
        echo "go"
    elif [[ -f "$dir/requirements.txt" || -f "$dir/pyproject.toml" || -f "$dir/setup.py" ]]; then
        echo "python"
    elif [[ -f "$dir/Gemfile" ]]; then
        echo "ruby"
    elif [[ -f "$dir/pom.xml" || -f "$dir/build.gradle" ]]; then
        echo "java"
    else
        echo "unknown"
    fi
}

# =============================================================================
# 安装依赖
# =============================================================================

install_dependencies() {
    local project_type="$1"
    local dir="${2:-$(pwd)}"

    case "$project_type" in
        node)
            if [[ -f "$dir/pnpm-lock.yaml" ]]; then
                log_info "📦 使用 pnpm 安装依赖..."
                (cd "$dir" && pnpm install 2>/dev/null) || log_warn "pnpm install 失败"
            elif [[ -f "$dir/yarn.lock" ]]; then
                log_info "📦 使用 yarn 安装依赖..."
                (cd "$dir" && yarn install 2>/dev/null) || log_warn "yarn install 失败"
            elif [[ -f "$dir/package-lock.json" ]]; then
                log_info "📦 使用 npm 安装依赖..."
                (cd "$dir" && npm ci 2>/dev/null) || log_warn "npm ci 失败"
            fi
            ;;
        python)
            if [[ -f "$dir/requirements.txt" ]]; then
                log_info "🐍 安装 Python 依赖..."
                (cd "$dir" && pip install -r requirements.txt 2>/dev/null) || log_warn "pip install 失败"
            fi
            ;;
        rust)
            log_info "🦀 构建 Rust 项目..."
            (cd "$dir" && cargo build 2>/dev/null) || log_warn "cargo build 失败"
            ;;
        go)
            log_info "🐹 下载 Go 模块..."
            (cd "$dir" && go mod download 2>/dev/null) || log_warn "go mod download 失败"
            ;;
    esac
}

# =============================================================================
# 设置环境变量（使用 CLAUDE_ENV_FILE）
# =============================================================================

setup_environment() {
    local project_type="$1"
    local dir="${2:-$(pwd)}"

    # 使用 CLAUDE_ENV_FILE 持久化环境变量
    if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
        log_info "📝 设置会话环境变量..."

        # 检测 Node 版本
        if [[ "$project_type" == "node" ]]; then
            node_version=$(node -v 2>/dev/null || echo "")
            if [[ -n "$node_version" ]]; then
                echo "export NODE_VERSION='$node_version'" >> "$CLAUDE_ENV_FILE"
            fi
        fi

        # 设置项目根目录
        echo "export PROJECT_ROOT='$dir'" >> "$CLAUDE_ENV_FILE"
        echo "export PROJECT_TYPE='$project_type'" >> "$CLAUDE_ENV_FILE"

        log_debug "   环境变量已写入: $CLAUDE_ENV_FILE"
    fi
}

# =============================================================================
# 主逻辑
# =============================================================================

main() {
    local dir="${cwd:-$(pwd)}"

    # 检测项目类型
    project_type=$(detect_project_type "$dir")
    log_info "📋 检测到项目类型: $project_type"

    # 安装依赖
    install_dependencies "$project_type" "$dir"

    # 设置环境变量
    setup_environment "$project_type" "$dir"

    # 创建 .claude 目录（如果不存在）
    if [[ ! -d "$dir/.claude" ]]; then
        mkdir -p "$dir/.claude"
        log_debug "   创建 .claude 目录"
    fi

    log_info "✅ 项目初始化完成"
}

main
exit 0
