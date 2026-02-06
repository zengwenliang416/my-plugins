#!/bin/bash
# Hook: teammate-idle
# Lifecycle: TeammateIdle
# Description: Log idle events from teammate agents for orchestration awareness

INPUT=$(cat)

LOG_DIR="${HOME}/.claude/logs/hook-events"
mkdir -p "${LOG_DIR}"

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // empty')
IDLE_SINCE=$(echo "$INPUT" | jq -r '.idle_since // empty')

cat >> "${LOG_DIR}/teammate-idle.jsonl" <<EOF
{"timestamp":"${TIMESTAMP}","teammate":"${TEAMMATE}","idle_since":"${IDLE_SINCE}","raw":$(echo "$INPUT" | jq -c '. // {}')}
EOF

echo '{}'
