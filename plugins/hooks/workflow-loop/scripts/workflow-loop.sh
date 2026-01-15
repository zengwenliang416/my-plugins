#!/bin/bash

# Workflow Loop Stop Hook
# Prevents session exit when a CCG workflow is active
# Continues to next phase until all phases complete

set -euo pipefail

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Check for active workflow state file
WORKFLOW_STATE_FILE=".claude/ccg-workflow.local.md"

if [[ ! -f "$WORKFLOW_STATE_FILE" ]]; then
  # No active workflow - allow exit
  exit 0
fi

# Parse markdown frontmatter (YAML between ---)
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$WORKFLOW_STATE_FILE")

# Extract fields
ACTIVE=$(echo "$FRONTMATTER" | grep '^active:' | sed 's/active: *//')
CURRENT_PHASE=$(echo "$FRONTMATTER" | grep '^current_phase:' | sed 's/current_phase: *//')
TOTAL_PHASES=$(echo "$FRONTMATTER" | grep '^total_phases:' | sed 's/total_phases: *//')
COMPLETION_PROMISE=$(echo "$FRONTMATTER" | grep '^completion_promise:' | sed 's/completion_promise: *//' | sed 's/^"\(.*\)"$/\1/')
WORKFLOW_TYPE=$(echo "$FRONTMATTER" | grep '^workflow_type:' | sed 's/workflow_type: *//' || echo "unknown")
RUN_DIR=$(echo "$FRONTMATTER" | grep '^run_dir:' | sed 's/run_dir: *//' || echo "")

# Check if workflow is active
if [[ "$ACTIVE" != "true" ]]; then
  exit 0
fi

# Validate numeric fields
if [[ ! "$CURRENT_PHASE" =~ ^[0-9]+$ ]] || [[ ! "$TOTAL_PHASES" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Workflow loop: State file corrupted" >&2
  echo "   File: $WORKFLOW_STATE_FILE" >&2
  echo "   Workflow is stopping." >&2
  rm "$WORKFLOW_STATE_FILE"
  exit 0
fi

# Get transcript path from hook input
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  echo "⚠️  Workflow loop: Transcript file not found" >&2
  rm "$WORKFLOW_STATE_FILE"
  exit 0
fi

# Read last assistant message from transcript
if ! grep -q '"role":"assistant"' "$TRANSCRIPT_PATH"; then
  echo "⚠️  Workflow loop: No assistant messages found" >&2
  rm "$WORKFLOW_STATE_FILE"
  exit 0
fi

LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)
LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
  .message.content |
  map(select(.type == "text")) |
  map(.text) |
  join("\n")
' 2>/dev/null || echo "")

# Check for completion promise
if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
  PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")

  if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
    echo "✅ Workflow complete: <promise>$COMPLETION_PROMISE</promise>"
    rm "$WORKFLOW_STATE_FILE"
    exit 0
  fi
fi

# Check if all phases complete
if [[ $CURRENT_PHASE -ge $TOTAL_PHASES ]]; then
  echo "✅ All workflow phases complete ($TOTAL_PHASES/$TOTAL_PHASES)"
  rm "$WORKFLOW_STATE_FILE"
  exit 0
fi

# Not complete - continue to next phase
NEXT_PHASE=$((CURRENT_PHASE + 1))

# Update phase in state file
TEMP_FILE="${WORKFLOW_STATE_FILE}.tmp.$$"
sed "s/^current_phase: .*/current_phase: $NEXT_PHASE/" "$WORKFLOW_STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$WORKFLOW_STATE_FILE"

# Build continuation message
SYSTEM_MSG="🔄 Workflow phase $NEXT_PHASE/$TOTAL_PHASES | Type: $WORKFLOW_TYPE"

if [[ -n "$RUN_DIR" ]]; then
  SYSTEM_MSG="$SYSTEM_MSG | Output: $RUN_DIR"
fi

if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
  SYSTEM_MSG="$SYSTEM_MSG | Complete: output <promise>$COMPLETION_PROMISE</promise>"
fi

# Output JSON to block stop and inject next phase prompt
jq -n \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": "继续执行下一阶段",
    "systemMessage": $msg
  }'

exit 0
