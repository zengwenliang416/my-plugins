#!/bin/bash
# Gemini CLI wrapper for brainstorming
# Usage: ./brainstorm_gemini.sh --prompt "..." [--method scamper|hats|auto]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../assets"

# Load role config
ROLE_CONFIG="$ASSETS_DIR/roles.json"

# Default values
ROLE="brainstorm"
METHOD="auto"
PROMPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --prompt)
      PROMPT="$2"
      shift 2
      ;;
    --method)
      METHOD="$2"
      shift 2
      ;;
    --role)
      ROLE="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [ -z "$PROMPT" ]; then
  echo "Error: --prompt is required"
  exit 1
fi

# Execute codeagent-wrapper
~/.claude/bin/codeagent-wrapper gemini \
  --role "$ROLE" \
  --prompt "$PROMPT"
