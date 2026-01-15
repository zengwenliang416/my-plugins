#!/bin/bash
# 进度实时显示组件
# 为并行执行任务提供可视化进度展示

set -euo pipefail

# ========== 主进度显示函数 ==========
print_parallel_progress() {
  local state_file="$1"

  if [[ ! -f "$state_file" ]]; then
    echo "❌ 状态文件不存在: $state_file" >&2
    return 1
  fi

  # 读取状态文件
  local state=$(cat "$state_file")

  # 提取并行执行信息
  local active=$(echo "$state" | yq eval '.parallel_execution.active_tasks' || echo "0")
  local completed=$(echo "$state" | yq eval '.parallel_execution.completed_tasks' || echo "0")
  local failed=$(echo "$state" | yq eval '.parallel_execution.failed_tasks' || echo "0")
  local total=$(echo "$state" | yq eval '.subtasks | length' || echo "0")
  local current_phase=$(echo "$state" | yq eval '.current_phase' || echo "unknown")

  # 清屏并重绘（只在终端支持时）
  if [[ -t 1 ]]; then
    clear
  fi

  echo "🔄 并行执行中 (Phase: $current_phase)"
  echo ""
  echo "┌────────────────────────────────────────────────────────────┐"

  # 遍历所有子任务
  echo "$state" | yq eval '.subtasks[]' -o=json -I=0 | while IFS= read -r task; do
    local id=$(echo "$task" | jq -r '.id')
    local status=$(echo "$task" | jq -r '.status')
    local started_at=$(echo "$task" | jq -r '.started_at // empty')
    local backend=$(echo "$task" | jq -r '.backend // "unknown"')

    # 计算运行时间
    local elapsed="--:--"
    if [[ -n "$started_at" && "$started_at" != "null" ]]; then
      elapsed=$(calculate_elapsed "$started_at")
    fi

    # 格式化任务ID（最多20字符）
    local formatted_id=$(printf '%-20s' "${id:0:20}")

    # 绘制进度条和状态
    case "$status" in
      running)
        local progress="████████░░"
        echo "│ $formatted_id [$progress] 🔄 运行中 ($elapsed) [$backend] │"
        ;;
      completed)
        local progress="██████████"
        echo "│ $formatted_id [$progress] ✅ 完成   ($elapsed) [$backend] │"
        ;;
      failed)
        local progress="████░░░░░░"
        echo "│ $formatted_id [$progress] ❌ 失败   ($elapsed) [$backend] │"
        ;;
      pending)
        local progress="░░░░░░░░░░"
        echo "│ $formatted_id [$progress] ⏸️  等待中             [$backend] │"
        ;;
      *)
        local progress="░░░░░░░░░░"
        echo "│ $formatted_id [$progress] ❓ 未知                [$backend] │"
        ;;
    esac
  done

  echo "└────────────────────────────────────────────────────────────┘"
  echo ""
  echo "📊 统计: 活跃 $active/$total | 完成 $completed | 失败 $failed | 总计 $total"
}

# ========== 计算运行时间 ==========
calculate_elapsed() {
  local started_at="$1"
  local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # 转换为 Unix 时间戳
  local start_epoch=$(date -d "$started_at" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$started_at" +%s 2>/dev/null || echo "0")
  local now_epoch=$(date -d "$now" +%s 2>/dev/null || date +%s)

  if [[ $start_epoch -eq 0 ]]; then
    echo "--:--"
    return
  fi

  local diff=$((now_epoch - start_epoch))

  if [[ $diff -lt 60 ]]; then
    printf "%ds" "$diff"
  elif [[ $diff -lt 3600 ]]; then
    local minutes=$((diff / 60))
    local seconds=$((diff % 60))
    printf "%dm %02ds" "$minutes" "$seconds"
  else
    local hours=$((diff / 3600))
    local minutes=$(( (diff % 3600) / 60 ))
    printf "%dh %02dm" "$hours" "$minutes"
  fi
}

# ========== 持续监控进度 ==========
monitor_progress() {
  local state_file="$1"
  local refresh_interval="${2:-2}" # 默认 2 秒刷新一次

  while true; do
    print_parallel_progress "$state_file"

    # 检查是否所有任务都完成
    local active=$(yq eval '.parallel_execution.active_tasks' "$state_file" 2>/dev/null || echo "0")

    if [[ $active -eq 0 ]]; then
      echo ""
      echo "✅ 所有任务已完成"
      break
    fi

    sleep "$refresh_interval"
  done
}

# ========== 启动后台监控 ==========
start_progress_monitor() {
  local state_file="$1"
  local refresh_interval="${2:-2}"

  # 在后台启动监控进程
  monitor_progress "$state_file" "$refresh_interval" &
  echo $! # 返回进程 ID
}

# ========== 停止后台监控 ==========
stop_progress_monitor() {
  local monitor_pid="$1"

  if [[ -n "$monitor_pid" ]]; then
    kill "$monitor_pid" 2>/dev/null || true
    wait "$monitor_pid" 2>/dev/null || true
  fi
}

# ========== 简化版进度条（单行）==========
print_simple_progress() {
  local state_file="$1"

  local active=$(yq eval '.parallel_execution.active_tasks' "$state_file" 2>/dev/null || echo "0")
  local completed=$(yq eval '.parallel_execution.completed_tasks' "$state_file" 2>/dev/null || echo "0")
  local failed=$(yq eval '.parallel_execution.failed_tasks' "$state_file" 2>/dev/null || echo "0")
  local total=$(yq eval '.subtasks | length' "$state_file" 2>/dev/null || echo "0")

  if [[ $total -eq 0 ]]; then
    return
  fi

  local percent=$(( (completed + failed) * 100 / total ))
  local bar_length=20
  local filled=$(( percent * bar_length / 100 ))
  local empty=$(( bar_length - filled ))

  local bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done

  echo -ne "\r🔄 进度: [$bar] $percent% | 活跃: $active | 完成: $completed | 失败: $failed"
}

# ========== 使用示例 ==========
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  cat <<'EOF'
用法示例:

# 1. 单次显示进度
print_parallel_progress "/path/to/state.local.md"

# 2. 持续监控（阻塞）
monitor_progress "/path/to/state.local.md" 2

# 3. 后台监控（非阻塞）
MONITOR_PID=$(start_progress_monitor "/path/to/state.local.md" 2)
# ... 执行其他任务 ...
stop_progress_monitor "$MONITOR_PID"

# 4. 简化版单行进度条
while [[ $(yq eval '.parallel_execution.active_tasks' state.md) -gt 0 ]]; do
  print_simple_progress "state.md"
  sleep 1
done
echo "" # 换行
EOF
fi
