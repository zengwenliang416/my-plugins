#!/bin/bash
# Skill Loader Script
# Loads skill content with optional references

set -e

SKILLS_DIR="${SKILLS_DIR:-plugins/memory/skills}"
OUTPUT_FILE="${1:-skill-content.md}"
SKILL_NAME="${2:-}"
MODE="${3:-full}"  # full, summary, selective

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "${BLUE}[skill-loader]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[warning]${NC} $1"
}

if [ -z "$SKILL_NAME" ]; then
  echo "Usage: load-skill.sh <output-file> <skill-name> [mode]"
  echo "Modes: full, summary, selective"
  exit 1
fi

SKILL_PATH="${SKILLS_DIR}/${SKILL_NAME}"
SKILL_FILE="${SKILL_PATH}/SKILL.md"

if [ ! -f "$SKILL_FILE" ]; then
  echo "Error: Skill not found: $SKILL_FILE"
  exit 1
fi

log "Loading skill: $SKILL_NAME (mode: $MODE)"

# Initialize output
echo "# Skill: $SKILL_NAME" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Loaded: $(date -Iseconds)" >> "$OUTPUT_FILE"
echo "Mode: $MODE" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Load main SKILL.md
echo "## Main Content" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ "$MODE" = "summary" ]; then
  # Extract only frontmatter
  sed -n '/^---$/,/^---$/p' "$SKILL_FILE" >> "$OUTPUT_FILE"
else
  cat "$SKILL_FILE" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Load references (if full or selective mode)
if [ "$MODE" = "full" ] && [ -d "${SKILL_PATH}/references" ]; then
  log "Loading references..."
  echo "## References" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"

  for ref in "${SKILL_PATH}/references"/*.md; do
    if [ -f "$ref" ]; then
      echo "### $(basename "$ref" .md)" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      cat "$ref" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    fi
  done
fi

# Calculate stats
CHAR_COUNT=$(wc -c < "$OUTPUT_FILE")
TOKEN_ESTIMATE=$((CHAR_COUNT / 4))

log "Loaded: $OUTPUT_FILE"
log "Estimated tokens: $TOKEN_ESTIMATE"
echo -e "${GREEN}Done!${NC}"
