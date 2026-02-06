#!/bin/bash
# Hook: task-completed
# Lifecycle: TaskCompleted
# Description: Log task completion events for orchestration tracking

INPUT=$(cat)

LOG_DIR="${HOME}/.claude/logs/hook-events"
mkdir -p "${LOG_DIR}"

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TASK_ID=$(echo "$INPUT" | jq -r '.task_id // empty')
TASK_STATUS=$(echo "$INPUT" | jq -r '.status // empty')

cat >> "${LOG_DIR}/task-completed.jsonl" <<EOF
{"timestamp":"${TIMESTAMP}","task_id":"${TASK_ID}","status":"${TASK_STATUS}","raw":$(echo "$INPUT" | jq -c '. // {}')}
EOF

echo '{}'
