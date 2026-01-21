#!/bin/bash
# Context Loader Script
# Assembles context from various sources

set -e

MEMORY_DIR=".claude/memory"
OUTPUT_FILE="${1:-context.md}"
MAX_TOKENS="${2:-50000}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "${BLUE}[context-loader]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[warning]${NC} $1"
}

success() {
  echo -e "${GREEN}[success]${NC} $1"
}

# Check memory directory exists
if [ ! -d "$MEMORY_DIR" ]; then
  warn "Memory directory not found: $MEMORY_DIR"
  mkdir -p "$MEMORY_DIR"
  log "Created memory directory"
fi

# Initialize output
echo "# Project Context" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Generated: $(date -Iseconds)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Load Rules (Priority 1)
if [ -d ".claude/rules" ]; then
  log "Loading rules..."
  echo "## Rules" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  for rule in .claude/rules/*.md; do
    if [ -f "$rule" ]; then
      echo "### $(basename "$rule" .md)" >> "$OUTPUT_FILE"
      cat "$rule" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    fi
  done
fi

# Load Code Map (Priority 2)
if [ -f "$MEMORY_DIR/code-map.md" ]; then
  log "Loading code map..."
  echo "## Code Map" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  cat "$MEMORY_DIR/code-map.md" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Load Skills Index (Priority 3)
if [ -f "$MEMORY_DIR/skills/index.json" ]; then
  log "Loading skills index..."
  echo "## Available Skills" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo '```json' >> "$OUTPUT_FILE"
  cat "$MEMORY_DIR/skills/index.json" >> "$OUTPUT_FILE"
  echo '```' >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Load Recent Session Summary (Priority 4)
if [ -f "$MEMORY_DIR/sessions/latest.md" ]; then
  log "Loading session summary..."
  echo "## Recent Session" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  cat "$MEMORY_DIR/sessions/latest.md" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Calculate token estimate
CHAR_COUNT=$(wc -c < "$OUTPUT_FILE")
TOKEN_ESTIMATE=$((CHAR_COUNT / 4))

success "Context assembled: $OUTPUT_FILE"
log "Estimated tokens: $TOKEN_ESTIMATE / $MAX_TOKENS"

if [ "$TOKEN_ESTIMATE" -gt "$MAX_TOKENS" ]; then
  warn "Context exceeds token budget, truncation may be needed"
fi
