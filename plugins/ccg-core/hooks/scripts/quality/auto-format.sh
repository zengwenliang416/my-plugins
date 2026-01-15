#!/bin/bash
# =============================================================================
# auto-format.sh - 自动代码格式化 Hook
# =============================================================================
# 用途: 在文件写入后自动运行相应的格式化工具
# 触发: PostToolUse (Write|Edit|MultiEdit)
# 优先级: P1 - 代码质量
# =============================================================================

set -euo pipefail

# 读取 stdin 输入
input=$(cat)

# 提取文件路径
file_path=$(echo "$input" | jq -r '
  .tool_input.file_path //
  .tool_input.filePath //
  .tool_input.path //
  empty
')

# 如果没有文件路径或文件不存在，直接退出
[[ -z "$file_path" ]] && exit 0
[[ ! -f "$file_path" ]] && exit 0

# 获取文件扩展名
ext="${file_path##*.}"

# 检查格式化工具是否可用
has_prettier() { command -v npx &>/dev/null && npx prettier --version &>/dev/null; }
has_eslint() { command -v npx &>/dev/null && [[ -f "${CLAUDE_PROJECT_DIR:-$(pwd)}/.eslintrc"* ]] || [[ -f "${CLAUDE_PROJECT_DIR:-$(pwd)}/eslint.config"* ]]; }
has_black() { command -v black &>/dev/null; }
has_isort() { command -v isort &>/dev/null; }
has_gofmt() { command -v gofmt &>/dev/null; }
has_rustfmt() { command -v rustfmt &>/dev/null; }
has_shfmt() { command -v shfmt &>/dev/null; }

# 根据文件类型执行格式化
case "$ext" in
  # JavaScript/TypeScript 家族
  ts|tsx|js|jsx|mjs|cjs)
    if has_prettier; then
      npx prettier --write "$file_path" 2>/dev/null && echo "✨ Prettier 格式化: $(basename "$file_path")"
    fi
    ;;

  # JSON/YAML/Markdown
  json|yaml|yml|md|mdx)
    if has_prettier; then
      npx prettier --write "$file_path" 2>/dev/null && echo "✨ Prettier 格式化: $(basename "$file_path")"
    fi
    ;;

  # CSS 家族
  css|scss|sass|less)
    if has_prettier; then
      npx prettier --write "$file_path" 2>/dev/null && echo "✨ Prettier 格式化: $(basename "$file_path")"
    fi
    ;;

  # HTML/Vue/Svelte
  html|htm|vue|svelte)
    if has_prettier; then
      npx prettier --write "$file_path" 2>/dev/null && echo "✨ Prettier 格式化: $(basename "$file_path")"
    fi
    ;;

  # Python
  py)
    formatted=false
    if has_isort; then
      isort "$file_path" 2>/dev/null && formatted=true
    fi
    if has_black; then
      black --quiet "$file_path" 2>/dev/null && formatted=true
    fi
    [[ "$formatted" == true ]] && echo "✨ Python 格式化: $(basename "$file_path")"
    ;;

  # Go
  go)
    if has_gofmt; then
      gofmt -w "$file_path" 2>/dev/null && echo "✨ Gofmt 格式化: $(basename "$file_path")"
    fi
    ;;

  # Rust
  rs)
    if has_rustfmt; then
      rustfmt "$file_path" 2>/dev/null && echo "✨ Rustfmt 格式化: $(basename "$file_path")"
    fi
    ;;

  # Shell
  sh|bash|zsh)
    if has_shfmt; then
      shfmt -w "$file_path" 2>/dev/null && echo "✨ Shfmt 格式化: $(basename "$file_path")"
    fi
    ;;

  # GraphQL
  graphql|gql)
    if has_prettier; then
      npx prettier --write "$file_path" 2>/dev/null && echo "✨ Prettier 格式化: $(basename "$file_path")"
    fi
    ;;
esac

exit 0
