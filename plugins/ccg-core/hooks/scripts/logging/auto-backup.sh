#!/bin/bash
# =============================================================================
# auto-backup.sh - 自动备份 Hook
# =============================================================================
# 用途: 在文件修改前自动创建备份，便于恢复
# 触发: PreToolUse (Write|Edit)
# 优先级: P3 - 高级自动化
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

# 获取项目目录
project_dir="${CLAUDE_PROJECT_DIR:-$HOME/.claude}"

# 备份目录
backup_base="$project_dir/backups"
backup_dir="$backup_base/$(date +%Y%m%d)"
mkdir -p "$backup_dir"

# 生成备份文件名
# 将文件路径转换为安全的文件名（替换 / 为 _）
safe_name=$(echo "$file_path" | sed 's|^/||; s|/|_|g')
backup_name="${safe_name}.$(date +%H%M%S).bak"

# 创建备份
if cp "$file_path" "$backup_dir/$backup_name" 2>/dev/null; then
  # 记录备份日志
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $file_path -> $backup_dir/$backup_name" >> "$backup_base/backup.log"

  # 仅在详细模式下显示（通过环境变量控制）
  if [[ "${CLAUDE_HOOK_VERBOSE:-}" == "true" ]]; then
    echo "💾 备份: $(basename "$file_path")"
  fi
fi

# =============================================================================
# 备份清理策略
# =============================================================================

# 清理超过 7 天的备份目录
find "$backup_base" -maxdepth 1 -type d -name "20*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

# 保持每个日期目录下最多 100 个备份
for dir in "$backup_base"/20*; do
  if [[ -d "$dir" ]]; then
    count=$(ls -1 "$dir" 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$count" -gt 100 ]]; then
      ls -1t "$dir" | tail -n +101 | xargs -I {} rm "$dir/{}" 2>/dev/null || true
    fi
  fi
done

# 保持总备份数不超过 500
total=$(find "$backup_base" -name "*.bak" -type f 2>/dev/null | wc -l | tr -d ' ')
if [[ "$total" -gt 500 ]]; then
  find "$backup_base" -name "*.bak" -type f -printf '%T@ %p\n' 2>/dev/null | \
    sort -n | head -n "$((total - 500))" | cut -d' ' -f2- | xargs rm -f 2>/dev/null || true
fi

# 保持备份日志不超过 1000 行
if [[ -f "$backup_base/backup.log" ]] && [[ $(wc -l < "$backup_base/backup.log") -gt 1000 ]]; then
  tail -500 "$backup_base/backup.log" > "$backup_base/backup.log.tmp"
  mv "$backup_base/backup.log.tmp" "$backup_base/backup.log"
fi

exit 0
