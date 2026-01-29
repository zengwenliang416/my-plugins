#!/bin/bash
# =============================================================================
# read-limit.sh - 智能读取限制 Hook
# =============================================================================
# 用途: 防止大文件一次性读取导致上下文溢出
# 触发: PreToolUse (Read)
# 特性:
#   - 利用 updatedInput 自动注入 limit 参数
#   - 智能合并：已有 limit 时取最小值
#   - additionalContext 提示文件总行数
#   - 可配置阈值（环境变量或默认值）
# 版本: 1.0.0
# 参考: https://github.com/Cedriccmh/cc-read-limit-hook (优化版)
# =============================================================================

set -euo pipefail

# =============================================================================
# 可配置参数（通过环境变量覆盖）
# =============================================================================
# 触发限制的文件行数阈值
FILE_LINES_THRESHOLD=${CC_READ_LINES_THRESHOLD:-1000}
# 触发限制的文件大小阈值（字节）
FILE_BYTES_THRESHOLD=${CC_READ_BYTES_THRESHOLD:-$((50 * 1024))}
# 单次读取的最大行数
MAX_SINGLE_READ_LINES=${CC_READ_MAX_LINES:-500}
# 单次读取的最大字节数
MAX_SINGLE_READ_BYTES=${CC_READ_MAX_BYTES:-$((20 * 1024))}

# =============================================================================
# 日志函数
# =============================================================================
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[READ-LIMIT]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[READ-LIMIT]${NC} $1" >&2; }

# =============================================================================
# 主逻辑
# =============================================================================

# 读取 stdin
input=$(cat)

# 提取工具信息
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# 仅处理 Read 工具
if [[ "$tool_name" != "Read" ]]; then
    exit 0
fi

# 提取文件路径和现有参数
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
existing_offset=$(echo "$input" | jq -r '.tool_input.offset // empty')
existing_limit=$(echo "$input" | jq -r '.tool_input.limit // empty')

# 文件路径为空，跳过
if [[ -z "$file_path" ]]; then
    exit 0
fi

# 处理相对路径：转换为绝对路径
if [[ "$file_path" != /* ]]; then
    # 尝试从 PWD 解析
    if [[ -f "$PWD/$file_path" ]]; then
        file_path="$PWD/$file_path"
    # 尝试从 HOME 解析
    elif [[ -f "$HOME/$file_path" ]]; then
        file_path="$HOME/$file_path"
    # 尝试从 workspace 解析
    elif [[ -f "$HOME/workspace/$file_path" ]]; then
        file_path="$HOME/workspace/$file_path"
    fi
fi

# 文件不存在，跳过
if [[ ! -f "$file_path" ]]; then
    exit 0
fi

# 跳过特定目录（如 node_modules、.git 等）
if echo "$file_path" | grep -qE "(node_modules|\.git|vendor|dist|build)/"; then
    exit 0
fi

# =============================================================================
# 获取文件信息
# =============================================================================

# 检查是否为二进制文件
if file "$file_path" 2>/dev/null | grep -q "binary\|executable\|data"; then
    exit 0
fi

# 获取文件大小
file_size=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null || echo "0")

# 获取文件行数（只在需要时计算）
get_line_count() {
    wc -l < "$file_path" 2>/dev/null | tr -d ' ' || echo "0"
}

# 快速判断：文件很小，直接跳过
if [[ "$file_size" -lt 10240 ]]; then  # 小于 10KB
    exit 0
fi

total_lines=$(get_line_count)

# =============================================================================
# 判断是否需要限制
# =============================================================================

needs_limit=false
reason=""

# 检查文件大小
if [[ "$file_size" -gt "$FILE_BYTES_THRESHOLD" ]]; then
    needs_limit=true
    reason="文件大小 $(( file_size / 1024 ))KB 超过阈值 $(( FILE_BYTES_THRESHOLD / 1024 ))KB"
fi

# 检查行数
if [[ "$total_lines" -gt "$FILE_LINES_THRESHOLD" ]]; then
    needs_limit=true
    reason="文件共 ${total_lines} 行，超过阈值 ${FILE_LINES_THRESHOLD} 行"
fi

# 不需要限制，正常退出
if [[ "$needs_limit" != "true" ]]; then
    exit 0
fi

# =============================================================================
# 计算限制参数
# =============================================================================

# 计算实际 limit（取最小值）
if [[ -n "$existing_limit" ]] && [[ "$existing_limit" != "null" ]]; then
    # 用户已指定 limit，取最小值
    if [[ "$existing_limit" -lt "$MAX_SINGLE_READ_LINES" ]]; then
        final_limit=$existing_limit
    else
        final_limit=$MAX_SINGLE_READ_LINES
    fi
else
    final_limit=$MAX_SINGLE_READ_LINES
fi

# 构建 updatedInput
if [[ -n "$existing_offset" ]] && [[ "$existing_offset" != "null" ]]; then
    updated_input=$(jq -n \
        --arg fp "$file_path" \
        --argjson offset "$existing_offset" \
        --argjson limit "$final_limit" \
        '{"file_path": $fp, "offset": $offset, "limit": $limit}')
else
    updated_input=$(jq -n \
        --arg fp "$file_path" \
        --argjson limit "$final_limit" \
        '{"file_path": $fp, "limit": $limit}')
fi

# =============================================================================
# 输出 JSON 响应
# =============================================================================

log_info "📄 ${reason}，限制读取 ${final_limit} 行"

# 使用官方 API 的 updatedInput 和 additionalContext
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "${reason}",
    "updatedInput": ${updated_input},
    "additionalContext": "⚠️ 大文件提示：此文件共 ${total_lines} 行（${file_size} bytes），当前仅读取 ${final_limit} 行。\\n\\n📋 文件读取策略（强制）：\\n1. 侦察：先用 Grep 定位目标关键词行号\\n2. 精准读取：使用 offset + limit 读取目标区域（单次不超过 500 行）\\n3. 扩展：如需更多上下文，调整 offset 继续读取\\n\\n目标：保持上下文精准、最小化。禁止无参数读取大文件。"
  }
}
EOF
