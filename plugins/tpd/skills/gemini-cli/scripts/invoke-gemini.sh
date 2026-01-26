#!/bin/bash
# Gemini CLI Wrapper Script
# Usage: ./invoke-gemini.sh --prompt <prompt> [--file <path>] [--role <role>]

set -e

# Default values
ROLE="frontend"
FILE=""
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
    --file)
      FILE="$2"
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
  echo "Usage: ./invoke-gemini.sh --prompt <prompt> [--file <path>] [--role <role>]"
  exit 1
fi

# Build command
CMD="$HOME/.claude/bin/codeagent-wrapper gemini"
CMD="$CMD --role \"$ROLE\""
CMD="$CMD --prompt \"$PROMPT\""

if [ -n "$FILE" ]; then
  CMD="$CMD --file \"$FILE\""
fi

# Execute
echo "🎨 Invoking Gemini CLI..."
echo "Role: $ROLE"
if [ -n "$FILE" ]; then
  echo "File: $FILE"
fi
echo "---"

eval "$CMD"
