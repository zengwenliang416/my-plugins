#!/bin/bash
# 任务输出格式验证器
validate_task_output() {
  local output="$1"
  
  # 检查必需字段
  if ! echo "$output" | grep -q "SESSION_ID="; then
    echo "⚠️  缺少 SESSION_ID" >&2
  fi
  
  if ! echo "$output" | grep -q "success="; then
    echo "⚠️  缺少 success 标志" >&2
  fi
  
  # 提取并验证
  local session_id=$(echo "$output" | grep -oP 'SESSION_ID=\K[a-f0-9-]+')
  local success=$(echo "$output" | grep -oP 'success=\K\w+')
  
  echo "验证结果:"
  echo "  SESSION_ID: ${session_id:-未找到}"
  echo "  Success: ${success:-未找到}"
}
