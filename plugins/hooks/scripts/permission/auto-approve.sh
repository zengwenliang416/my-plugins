#!/bin/bash
# =============================================================================
# auto-approve.sh - Bash 命令自动批准 Hook
# =============================================================================
# 用途: 自动批准安全的 Bash 命令，减少权限提示
# 触发: PermissionRequest (Bash)
# 新特性: 支持 always allow 建议、updatedInput (2.0.54+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[AUTO-APPROVE]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[AUTO-APPROVE]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[AUTO-APPROVE]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取命令信息
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
command=$(echo "$input" | jq -r '.tool_input.command // empty')
permission_mode=$(echo "$input" | jq -r '.permission_mode // "default"')

if [[ -z "$command" ]]; then
    exit 0
fi

# =============================================================================
# 安全命令白名单（自动批准）
# =============================================================================

# 只读命令 - 完全安全
readonly_commands=(
    "ls"
    "cat"
    "head"
    "tail"
    "less"
    "more"
    "grep"
    "find"
    "which"
    "whereis"
    "pwd"
    "echo"
    "date"
    "whoami"
    "hostname"
    "uname"
    "env"
    "printenv"
    "df"
    "du"
    "wc"
    "sort"
    "uniq"
    "diff"
    "tree"
    "file"
    "stat"
)

# 开发常用命令 - 通常安全
dev_commands=(
    "npm run"
    "npm test"
    "npm start"
    "npm build"
    "pnpm run"
    "pnpm test"
    "yarn run"
    "yarn test"
    "cargo build"
    "cargo test"
    "cargo check"
    "go build"
    "go test"
    "go mod"
    "python -m pytest"
    "pytest"
    "make test"
    "make build"
    "git status"
    "git log"
    "git diff"
    "git branch"
    "git show"
    "git remote"
    "git fetch"
)

# 提取命令的第一个词
first_word=$(echo "$command" | awk '{print $1}')
command_prefix=$(echo "$command" | cut -d' ' -f1-2)

# =============================================================================
# 检查是否为安全命令
# =============================================================================

is_safe=false
approval_reason=""

# 检查只读命令
for safe_cmd in "${readonly_commands[@]}"; do
    if [[ "$first_word" == "$safe_cmd" ]]; then
        is_safe=true
        approval_reason="只读命令"
        break
    fi
done

# 检查开发命令
if [[ "$is_safe" == false ]]; then
    for dev_cmd in "${dev_commands[@]}"; do
        if [[ "$command" == "$dev_cmd"* ]]; then
            is_safe=true
            approval_reason="开发常用命令"
            break
        fi
    done
fi

# =============================================================================
# 输出决策
# =============================================================================

if [[ "$is_safe" == true ]]; then
    log_info "✅ 自动批准: $first_word ($approval_reason)"

    # 使用新的 hookSpecificOutput 格式
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}
EOF
else
    # 不做决策，交给用户
    log_debug "⏸️ 需要用户确认: $command"
    exit 0
fi
