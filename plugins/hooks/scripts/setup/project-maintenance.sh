#!/bin/bash
# =============================================================================
# project-maintenance.sh - 项目维护 Hook
# =============================================================================
# 用途: 在 --maintenance 时执行项目维护任务
# 触发: Setup (matcher: maintenance)
# 调用: claude --maintenance
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[MAINTENANCE]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[MAINTENANCE]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[MAINTENANCE]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取信息
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')

log_info "🔧 开始项目维护..."

# =============================================================================
# 清理任务
# =============================================================================

cleanup_temp_files() {
    local dir="${1:-$(pwd)}"

    log_info "🧹 清理临时文件..."

    # 清理 node_modules 中的缓存
    if [[ -d "$dir/node_modules/.cache" ]]; then
        rm -rf "$dir/node_modules/.cache"
        log_debug "   清理 node_modules/.cache"
    fi

    # 清理 Python 缓存
    find "$dir" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$dir" -type f -name "*.pyc" -delete 2>/dev/null || true
    log_debug "   清理 Python 缓存"

    # 清理 Rust target（仅增量构建产物）
    if [[ -d "$dir/target/debug/incremental" ]]; then
        rm -rf "$dir/target/debug/incremental"
        log_debug "   清理 Rust 增量构建"
    fi

    # 清理 Go 缓存
    if command -v go &>/dev/null; then
        go clean -cache 2>/dev/null || true
        log_debug "   清理 Go 缓存"
    fi

    # 清理日志文件（保留最近的）
    find "$dir" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    log_debug "   清理 7 天前的日志文件"
}

# =============================================================================
# 更新检查
# =============================================================================

check_updates() {
    local dir="${1:-$(pwd)}"

    log_info "🔍 检查依赖更新..."

    if [[ -f "$dir/package.json" ]]; then
        # 检查 Node.js 过期依赖
        if command -v npm &>/dev/null; then
            outdated=$(npm outdated --json 2>/dev/null | jq 'keys | length' 2>/dev/null || echo "0")
            if [[ "$outdated" -gt 0 ]]; then
                log_warn "   发现 $outdated 个过期 npm 依赖"
            else
                log_debug "   npm 依赖已是最新"
            fi
        fi
    fi

    if [[ -f "$dir/requirements.txt" ]]; then
        # 检查 Python 依赖
        if command -v pip &>/dev/null; then
            outdated=$(pip list --outdated 2>/dev/null | wc -l || echo "0")
            if [[ "$outdated" -gt 1 ]]; then
                log_warn "   发现 $((outdated - 1)) 个过期 Python 依赖"
            fi
        fi
    fi
}

# =============================================================================
# 健康检查
# =============================================================================

health_check() {
    local dir="${1:-$(pwd)}"

    log_info "🏥 执行健康检查..."

    # 检查磁盘空间
    disk_usage=$(df -h "$dir" | awk 'NR==2 {print $5}' | tr -d '%')
    if [[ "$disk_usage" -gt 90 ]]; then
        log_warn "   ⚠️ 磁盘使用率: ${disk_usage}%"
    else
        log_debug "   磁盘使用率: ${disk_usage}%"
    fi

    # 检查 Git 状态
    if [[ -d "$dir/.git" ]]; then
        # 检查未提交的更改
        uncommitted=$(git -C "$dir" status --porcelain 2>/dev/null | wc -l || echo "0")
        if [[ "$uncommitted" -gt 0 ]]; then
            log_warn "   ⚠️ 有 $uncommitted 个未提交的更改"
        fi

        # 检查与远程的差异
        git -C "$dir" fetch origin 2>/dev/null || true
        behind=$(git -C "$dir" rev-list HEAD..origin/$(git -C "$dir" branch --show-current 2>/dev/null) --count 2>/dev/null || echo "0")
        if [[ "$behind" -gt 0 ]]; then
            log_warn "   ⚠️ 落后远程 $behind 个提交"
        fi
    fi
}

# =============================================================================
# 主逻辑
# =============================================================================

main() {
    local dir="${cwd:-$(pwd)}"

    cleanup_temp_files "$dir"
    check_updates "$dir"
    health_check "$dir"

    log_info "✅ 项目维护完成"
}

main
exit 0
