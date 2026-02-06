#!/bin/bash
# =============================================================================
# task-completed.sh - Agent Teams Task Completion Hook
# =============================================================================
# Lifecycle: TaskCompleted
# Matcher: * (wildcard, no tool filtering)
# Timeout: 5s (budget: <300ms)
# Fail-open: exit 0 + {} on any error (HC-9)
# =============================================================================

set -euo pipefail

# Fail-open trap: any error returns {} and exits 0
trap 'echo "{}"; exit 0' ERR

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[TASK-COMPLETED]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[TASK-COMPLETED]${NC} $1" >&2; }
log_error() { echo -e "${RED}[TASK-COMPLETED]${NC} $1" >&2; }
log_debug() { echo -e "${BLUE}[TASK-COMPLETED]${NC} $1" >&2; }

# =============================================================================
# Input validation
# =============================================================================

input=$(cat)

if ! echo "$input" | jq empty 2>/dev/null; then
  log_warn "Invalid JSON input, failing open"
  echo '{}'
  exit 0
fi

# =============================================================================
# Field extraction (best-effort, schemas may evolve)
# =============================================================================

hook_event=$(echo "$input" | jq -r '.hook_event_name // empty')
task_id=$(echo "$input" | jq -r '.task_id // empty')
task_status=$(echo "$input" | jq -r '.status // empty')
session_id=$(echo "$input" | jq -r '.session_id // empty')
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

log_info "TaskCompleted event: task=${task_id:-unknown} status=${task_status:-unknown}"

# =============================================================================
# JSONL logging with rotation (HC-11: 10k threshold, tail 5k)
# =============================================================================

LOG_DIR="${HOME}/.claude/logs/hook-events"
LOG_FILE="${LOG_DIR}/task-completed.jsonl"
mkdir -p "${LOG_DIR}"

log_entry=$(jq -n -c \
  --arg ts "$timestamp" \
  --arg tid "$task_id" \
  --arg st "$task_status" \
  --arg sid "$session_id" \
  '{timestamp: $ts, task_id: $tid, status: $st, session_id: $sid}')

echo "$log_entry" >> "$LOG_FILE"

# Log rotation: if exceeds 10k lines, keep last 5k
line_count=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
if [ "${line_count}" -gt 10000 ]; then
  tail -n 5000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  log_debug "Log rotated: ${line_count} -> 5000 lines"
fi

# =============================================================================
# Output: orchestration directive
# =============================================================================

jq -n -c \
  --arg tid "$task_id" \
  --arg st "$task_status" \
  --arg ts "$timestamp" \
  '{hookSpecificOutput: {orchestrationDirective: "acknowledge", metrics: {task_id: $tid, status: $st, event_time: $ts}}}'
