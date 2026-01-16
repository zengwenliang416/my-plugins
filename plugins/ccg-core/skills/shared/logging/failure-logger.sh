#!/bin/bash
# 失败任务日志记录器
set -euo pipefail

LOG_DIR="${HOME}/.claude/logs"
mkdir -p "$LOG_DIR"

log_failure() {
  local domain="$1"
  local task_id="$2"
  local error="$3"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local log_file="$LOG_DIR/${domain}-failures.log"

  cat >> "$log_file" <<EOF
[$timestamp] FAILURE
  Domain: $domain
  Task ID: $task_id
  Error: $error
---
EOF

  echo "❌ 失败已记录: $log_file"
}

# 查看最近失败记录
view_recent_failures() {
  local domain="$1"
  local count="${2:-10}"
  local log_file="$LOG_DIR/${domain}-failures.log"

  if [[ ! -f "$log_file" ]]; then
    echo "无失败记录"
    return
  fi

  echo "最近 $count 条失败记录:"
  tail -n $((count * 5)) "$log_file"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "失败任务日志记录器已加载"
  echo "使用: log_failure <domain> <task_id> <error>"
fi
