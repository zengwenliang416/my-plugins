#!/bin/bash
# Execute Exa searches for topic research
# Usage: ./execute_search.sh --topic "topic" --mode basic|deep --output-dir ./output

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
EXA_SCRIPT="${SKILL_DIR}/../exa/scripts/exa_exec.ts"

# Default values
TOPIC=""
MODE="basic"
OUTPUT_DIR="."

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --topic)
      TOPIC="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [ -z "$TOPIC" ]; then
  echo "Error: --topic is required"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "🔍 Starting topic research for: $TOPIC"
echo "Mode: $MODE"
echo ""

# Basic searches (always run)
echo "📊 [1/3] Searching trends..."
npx tsx "$EXA_SCRIPT" search "${TOPIC} trends 2026" --content --limit 5 > "$OUTPUT_DIR/search-trends.json"

echo "📚 [2/3] Searching case studies..."
npx tsx "$EXA_SCRIPT" search "${TOPIC} case study success story" --content --limit 5 > "$OUTPUT_DIR/search-cases.json"

echo "🌍 [3/3] Searching cross-industry inspiration..."
npx tsx "$EXA_SCRIPT" search "${TOPIC} inspiration from other industries" --content --limit 5 > "$OUTPUT_DIR/search-cross.json"

# Deep searches (only in deep mode)
if [ "$MODE" = "deep" ]; then
  echo ""
  echo "🔬 Deep mode: Running additional searches..."

  echo "❓ [4/5] Searching pain points..."
  npx tsx "$EXA_SCRIPT" search "${TOPIC} challenges problems pain points" --content --limit 5 > "$OUTPUT_DIR/search-problems.json"

  echo "💡 [5/5] Searching opportunities..."
  npx tsx "$EXA_SCRIPT" search "${TOPIC} opportunities innovations startups" --content --limit 5 > "$OUTPUT_DIR/search-opportunities.json"
fi

echo ""
echo "✅ Search completed. Results saved to: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"/search-*.json
