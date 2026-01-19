#!/bin/bash
# =============================================================================
# db-guard.sh - 数据库危险操作拦截 Hook
# =============================================================================
# 用途: 检测并拦截危险的 SQL 操作，防止生产数据误删
# 触发: PreToolUse (Bash)
# 优先级: P0 - 最高安全优先级
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[DB-GUARD]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[DB-GUARD]${NC} $1" >&2; }
log_error() { echo -e "${RED}[DB-GUARD]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取命令内容
command=$(echo "$input" | jq -r '.tool_input.command // empty')

if [[ -z "$command" ]]; then
    exit 0
fi

# 转换为大写用于匹配
command_upper=$(echo "$command" | tr '[:lower:]' '[:upper:]')

# =============================================================================
# 危险 SQL 模式检测
# =============================================================================

dangerous_patterns=(
    "DROP[[:space:]]+(TABLE|DATABASE|SCHEMA)"
    "TRUNCATE[[:space:]]+TABLE"
    "DELETE[[:space:]]+FROM[[:space:]]+[^[:space:]]+[[:space:]]+WHERE[[:space:]]+1[[:space:]]*=[[:space:]]*1"
    "DELETE[[:space:]]+FROM[[:space:]]+[^[:space:]]+[[:space:]]*;[[:space:]]*$"
    "UPDATE[[:space:]]+[^[:space:]]+[[:space:]]+SET[[:space:]]+.*WHERE[[:space:]]+1[[:space:]]*=[[:space:]]*1"
)

for pattern in "${dangerous_patterns[@]}"; do
    if echo "$command_upper" | grep -qE "$pattern"; then
        log_error "⛔ 检测到危险 SQL 操作!"
        log_error "   命令: $command"
        log_error "   匹配模式: $pattern"
        log_warn "   建议: 请确认此操作，或使用更安全的条件"

        echo "{\"decision\": \"block\", \"reason\": \"检测到危险 SQL 操作 ($pattern)，请确认后手动执行或添加更精确的 WHERE 条件。\"}"
        exit 0
    fi
done

# =============================================================================
# 生产环境连接检测
# =============================================================================

prod_patterns=(
    "prod\."
    "production"
    "\.rds\.amazonaws\.com"
    "\.database\.azure\.com"
    "\.cloudsql\.google\.com"
)

for pattern in "${prod_patterns[@]}"; do
    if echo "$command" | grep -qiE "$pattern"; then
        # 检查是否包含写操作
        if echo "$command_upper" | grep -qE "(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE)"; then
            log_warn "⚠️ 检测到生产环境写操作!"
            log_warn "   连接: 匹配 $pattern"
            log_warn "   命令: $command"

            echo "{\"decision\": \"block\", \"reason\": \"检测到生产环境数据库写操作，请确认后手动执行。\"}"
            exit 0
        fi
    fi
done

# =============================================================================
# 白名单检查
# =============================================================================

WHITELIST_FILE="$HOME/.claude/db-guard-whitelist.json"
if [[ -f "$WHITELIST_FILE" ]]; then
    # 支持白名单配置（未来扩展）
    :
fi

# 没有检测到危险操作，放行
exit 0
