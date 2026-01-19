#!/bin/bash
# =============================================================================
# invisible-orchestrator.sh - 隐形编排器 Hook
# =============================================================================
# 用途: 后台执行重任务（安全扫描、测试），仅在发现关键问题时通知
# 触发: PostToolUse (Write|Edit)
# 优先级: P2 - 后台增强
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[ORCHESTRATOR]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[ORCHESTRATOR]${NC} $1" >&2; }
log_error() { echo -e "${RED}[ORCHESTRATOR]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取工具信息
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
tool_result=$(echo "$input" | jq -r '.tool_result // empty')

# 任务注册表
TASK_DIR="$HOME/.claude/tmp/orchestrator"
mkdir -p "$TASK_DIR"

# =============================================================================
# 后台任务管理
# =============================================================================

# 限制并发任务数
MAX_CONCURRENT=3
current_tasks=$(find "$TASK_DIR" -name "*.pid" -mmin -5 2>/dev/null | wc -l)

if [[ $current_tasks -ge $MAX_CONCURRENT ]]; then
    log_warn "后台任务已达上限 ($MAX_CONCURRENT)，跳过"
    exit 0
fi

# =============================================================================
# 触发条件：Write/Edit 操作后
# =============================================================================

if [[ ! "$tool_name" =~ ^(Write|Edit|MultiEdit)$ ]]; then
    exit 0
fi

# 获取修改的文件
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" ]]; then
    exit 0
fi

# =============================================================================
# 后台安全扫描
# =============================================================================

run_background_scan() {
    local file="$1"
    local task_id="scan_$(date +%s)"
    local pid_file="$TASK_DIR/${task_id}.pid"
    local result_file="$TASK_DIR/${task_id}.result"

    (
        echo $$ > "$pid_file"

        # 简单的安全模式检测
        issues=()

        # 检查硬编码密码
        if grep -qE "(password|secret|api_key)\s*=\s*['\"][^'\"]+['\"]" "$file" 2>/dev/null; then
            issues+=("potential hardcoded secret")
        fi

        # 检查 TODO/FIXME
        if grep -qE "(TODO|FIXME|HACK|XXX)" "$file" 2>/dev/null; then
            issues+=("contains TODO/FIXME comments")
        fi

        # 写入结果
        if [[ ${#issues[@]} -gt 0 ]]; then
            echo "{\"severity\": \"warning\", \"issues\": $(printf '%s\n' "${issues[@]}" | jq -R . | jq -s .)}" > "$result_file"
        fi

        rm -f "$pid_file"
    ) &

    log_info "后台扫描已启动: $file"
}

# 启动后台扫描
run_background_scan "$file_path"

exit 0
