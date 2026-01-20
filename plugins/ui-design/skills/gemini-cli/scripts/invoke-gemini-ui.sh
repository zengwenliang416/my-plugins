#!/bin/bash
# Gemini CLI Wrapper Script for UI Design
# Usage: ./invoke-gemini-ui.sh --prompt <prompt> [--image <path>] [--dimension <type>]

set -e

# Default values
ROLE="ui_designer"
IMAGE=""
PROMPT=""
DIMENSION=""

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
    --image)
      IMAGE="$2"
      shift 2
      ;;
    --dimension)
      DIMENSION="$2"
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
  echo "Usage: ./invoke-gemini-ui.sh --prompt <prompt> [--image <path>] [--dimension <type>]"
  exit 1
fi

# Build command
CMD="$HOME/.claude/bin/codeagent-wrapper gemini"
CMD="$CMD --role \"$ROLE\""
CMD="$CMD --prompt \"$PROMPT\""

if [ -n "$IMAGE" ]; then
  # Validate image file exists
  if [ ! -f "$IMAGE" ]; then
    echo "Error: Image file not found: $IMAGE"
    exit 1
  fi
  CMD="$CMD --file \"$IMAGE\""
fi

# Execute
echo "🎨 Invoking Gemini CLI for UI Design..."
echo "Role: $ROLE"
if [ -n "$IMAGE" ]; then
  echo "Image: $IMAGE"
fi
if [ -n "$DIMENSION" ]; then
  echo "Dimension: $DIMENSION"
fi
echo "---"

eval "$CMD"
