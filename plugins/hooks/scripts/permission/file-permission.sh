#!/bin/bash
# =============================================================================
# file-permission.sh - 文件操作权限智能判断 Hook
# =============================================================================
# 用途: 智能判断文件写入/编辑权限，保护敏感文件
# 触发: PermissionRequest (Write|Edit)
# 新特性: 支持 updatedInput 修改路径 (2.0.54+)
# 版本: 2.1.14+
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[FILE-PERMISSION]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[FILE-PERMISSION]${NC} $1" >&2; }
log_error() { echo -e "${RED}[FILE-PERMISSION]${NC} $1" >&2; }

# 读取 stdin 输入
input=$(cat)

# 提取文件路径
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.filePath // .tool_input.path // empty')
permission_mode=$(echo "$input" | jq -r '.permission_mode // "default"')

if [[ -z "$file_path" ]]; then
    exit 0
fi

# =============================================================================
# 敏感文件检测
# =============================================================================

# 绝对禁止的文件模式
forbidden_patterns=(
    "\.env$"
    "\.env\..*"
    "\.aws/credentials"
    "\.ssh/.*"
    "id_rsa"
    "id_ed25519"
    "\.gnupg/"
    "\.git/config"
    "\.npmrc"
    "\.pypirc"
    "secrets\..*"
    "credentials\..*"
    "\.kube/config"
)

# 需要警告的文件模式
warn_patterns=(
    "package\.json$"
    "package-lock\.json$"
    "yarn\.lock$"
    "pnpm-lock\.yaml$"
    "Gemfile\.lock$"
    "Cargo\.lock$"
    "go\.sum$"
    "\.gitignore$"
    "tsconfig\.json$"
    "webpack\.config\."
    "vite\.config\."
)

# 自动批准的文件模式（在项目目录内）
safe_patterns=(
    "\.md$"
    "\.txt$"
    "\.log$"
    "\.tmp$"
    "\.test\."
    "\.spec\."
    "__tests__/"
    "tests?/"
)

# =============================================================================
# 检查文件安全性
# =============================================================================

# 检查禁止的文件
for pattern in "${forbidden_patterns[@]}"; do
    if echo "$file_path" | grep -qE "$pattern"; then
        log_error "⛔ 禁止写入敏感文件: $file_path"
        cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "deny",
      "message": "禁止写入敏感文件 ($pattern)"
    }
  }
}
EOF
        exit 0
    fi
done

# 检查项目目录外的文件
cwd=$(echo "$input" | jq -r '.cwd // empty')
if [[ -n "$cwd" ]]; then
    # 获取绝对路径
    abs_file_path=$(cd "$(dirname "$file_path" 2>/dev/null)" && pwd)/$(basename "$file_path") 2>/dev/null || echo "$file_path"
    abs_cwd=$(cd "$cwd" 2>/dev/null && pwd) 2>/dev/null || echo "$cwd"

    # 检查是否在项目目录内
    if [[ "$abs_file_path" != "$abs_cwd"* ]]; then
        log_warn "⚠️ 文件在项目目录外: $file_path"
        # 不自动批准，交给用户决定
        exit 0
    fi
fi

# 检查安全的文件模式
for pattern in "${safe_patterns[@]}"; do
    if echo "$file_path" | grep -qE "$pattern"; then
        log_info "✅ 自动批准安全文件: $(basename "$file_path")"
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
        exit 0
    fi
done

# 检查需要警告的文件
for pattern in "${warn_patterns[@]}"; do
    if echo "$file_path" | grep -qE "$pattern"; then
        log_warn "⚠️ 配置文件修改需要确认: $(basename "$file_path")"
        # 不自动批准，交给用户决定
        exit 0
    fi
done

# 默认不做决策，交给用户
exit 0
