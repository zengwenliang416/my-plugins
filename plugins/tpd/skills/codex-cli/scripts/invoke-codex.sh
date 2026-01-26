#!/bin/bash
# Codex CLI Wrapper Script
# Usage: ./invoke-codex.sh --role <role> --prompt <prompt> [--session <id>] [--workdir <path>]

set -e

# Default values
ROLE="analyzer"
WORKDIR="${PWD}"
SANDBOX="read-only"
SESSION=""
PROMPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --role)
      ROLE="$2"
      shift 2
      ;;
    --prompt)
      PROMPT="$2"
      shift 2
      ;;
    --session)
      SESSION="$2"
      shift 2
      ;;
    --workdir)
      WORKDIR="$2"
      shift 2
      ;;
    --sandbox)
      SANDBOX="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$PROMPT" ]; then
  echo "Error: --prompt is required"
  echo "Usage: ./invoke-codex.sh --role <role> --prompt <prompt> [--session <id>]"
  exit 1
fi

# Build command
CMD="$HOME/.claude/bin/codeagent-wrapper codex"
CMD="$CMD --workdir \"$WORKDIR\""
CMD="$CMD --role \"$ROLE\""
CMD="$CMD --prompt \"$PROMPT\""
CMD="$CMD --sandbox \"$SANDBOX\""

if [ -n "$SESSION" ]; then
  CMD="$CMD --session \"$SESSION\""
fi

# Execute
echo "🔧 Invoking Codex CLI..."
echo "Role: $ROLE"
echo "Sandbox: $SANDBOX"
echo "---"

eval "$CMD"
