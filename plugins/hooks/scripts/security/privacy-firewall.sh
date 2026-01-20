#!/bin/bash
# =============================================================================
# privacy-firewall.sh - 隐私防火墙 Hook
# =============================================================================
# 用途: 检测并阻止敏感信息（API keys, PII）发送到 LLM
# 触发: UserPromptSubmit
# 优先级: P0 - 隐私保护
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[PRIVACY-FIREWALL]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[PRIVACY-FIREWALL]${NC} $1" >&2; }
log_error() { echo -e "${RED}[PRIVACY-FIREWALL]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取用户提示
prompt=$(echo "$input" | jq -r '.prompt // empty')

if [[ -z "$prompt" ]]; then
    exit 0
fi

# 限制检测长度（性能优化）
MAX_LENGTH=10240
prompt_truncated="${prompt:0:$MAX_LENGTH}"

# =============================================================================
# 敏感信息检测模式 (兼容 Bash 3.x)
# =============================================================================

# 模式名称和正则表达式（使用并行数组）
pattern_names=(
    "OpenAI API Key"
    "GitHub Token"
    "GitHub OAuth"
    "AWS Access Key"
    "Anthropic API Key"
    "Google API Key"
    "Slack Token"
    "SSN"
    "Credit Card"
)

pattern_regexes=(
    "sk-[a-zA-Z0-9]{20,}"
    "ghp_[a-zA-Z0-9]{36}"
    "gho_[a-zA-Z0-9]{36}"
    "AKIA[0-9A-Z]{16}"
    "sk-ant-[a-zA-Z0-9-]{20,}"
    "AIza[0-9A-Za-z_-]{35}"
    "xox[baprs]-[0-9a-zA-Z-]{10,}"
    "[0-9]{3}-[0-9]{2}-[0-9]{4}"
    "[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}"
)

detected_types=()

for i in "${!pattern_names[@]}"; do
    pattern_name="${pattern_names[$i]}"
    pattern="${pattern_regexes[$i]}"
    if echo "$prompt_truncated" | grep -qE "$pattern"; then
        detected_types+=("$pattern_name")
    fi
done

# =============================================================================
# 检测结果处理
# =============================================================================

if [[ ${#detected_types[@]} -gt 0 ]]; then
    log_error "⛔ 检测到敏感信息!"
    for detected in "${detected_types[@]}"; do
        log_error "   - $detected"
    done
    log_warn "   建议: 请移除敏感信息后重试，或使用环境变量引用"

    # 构建检测类型列表
    types_json=$(printf '%s\n' "${detected_types[@]}" | jq -R . | jq -s .)

    echo "{\"decision\": \"block\", \"reason\": \"检测到敏感信息 (${detected_types[*]})，请移除后重试或使用环境变量。\"}"
    exit 0
fi

# =============================================================================
# Email 检测（警告但不阻止）
# =============================================================================

email_pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
if echo "$prompt_truncated" | grep -qE "$email_pattern"; then
    # 排除常见的示例邮箱
    if ! echo "$prompt_truncated" | grep -qE "(example\.com|test\.com|foo\.com|bar\.com)"; then
        log_warn "⚠️ 检测到可能的邮箱地址"
        log_warn "   如果是真实邮箱，建议脱敏处理"
        # 仅警告，不阻止
    fi
fi

# =============================================================================
# 白名单检查
# =============================================================================

WHITELIST_FILE="$HOME/.claude/privacy-whitelist.json"
if [[ -f "$WHITELIST_FILE" ]]; then
    # 支持白名单配置（未来扩展）
    # 可以配置允许的域名、模式等
    :
fi

# 没有检测到敏感信息，放行
exit 0
