#!/bin/bash
# Skill Validation Script
# Validates all skills in the plugins directory

set -e

PLUGINS_DIR="plugins"
ERRORS=0
WARNINGS=0
STRICT_MODE=false
SKILL_SOFT_LINE_LIMIT=350
SKILL_CHAR_BUDGET=12000
MAX_EXAMPLE_BLOCK_LINES=120
REFERENCE_INDEX_THRESHOLD=8

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_error() {
  echo -e "${RED}❌ ERROR:${NC} $1"
  ((++ERRORS))
}

log_warning() {
  echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
  ((++WARNINGS))
}

log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

log_info() {
  echo -e "${BLUE}ℹ️${NC} $1"
}

log_optional_issue() {
  if [ "$STRICT_MODE" = true ]; then
    log_warning "$1"
  else
    log_info "$1"
  fi
}

# Parse args
for arg in "$@"; do
  case "$arg" in
    --strict)
      STRICT_MODE=true
      ;;
    --help|-h)
      cat <<'EOF'
Usage: ./scripts/validate-skills.sh [--strict]

Options:
  --strict   Treat recommended checks as warnings (legacy behavior)
  --help     Show this help
EOF
      exit 0
      ;;
    *)
      echo -e "${YELLOW}⚠️  WARNING:${NC} Unknown option: $arg"
      ;;
  esac
done

# Validate SKILL.md frontmatter
validate_frontmatter() {
  local skill_md="$1"
  local skill_name="$2"

  # Check if file starts with ---
  if ! head -1 "$skill_md" | grep -q "^---$"; then
    log_error "$skill_name: SKILL.md missing YAML frontmatter"
    return 1
  fi

  # Extract frontmatter (macOS compatible)
  local frontmatter=$(awk '/^---$/{if(++c==2)exit}c==1' "$skill_md")

  # Check required fields
  if ! echo "$frontmatter" | grep -q "^name:"; then
    log_error "$skill_name: Missing 'name' in frontmatter"
    return 1
  fi

  if ! echo "$frontmatter" | grep -q "^description:"; then
    log_error "$skill_name: Missing 'description' in frontmatter"
    return 1
  fi

  return 0
}

# Validate description format (4-part)
validate_description() {
  local skill_md="$1"
  local skill_name="$2"

  # Extract frontmatter and search for 4-part format
  # Use the frontmatter section (between --- markers) to find description keywords
  local frontmatter=$(awk '/^---$/{if(++c==2)exit}c==1' "$skill_md")

  # Check for 4-part format in frontmatter.
  # Accept both Chinese and English markers to support bilingual skill metadata.
  local has_trigger=$(echo "$frontmatter" | grep -Ec "【触发条件】|\\[Trigger\\]" || true)
  local has_output=$(echo "$frontmatter" | grep -Ec "【核心产出】|\\[Output\\]" || true)
  local has_not_trigger=$(echo "$frontmatter" | grep -Ec "【不触发】|\\[Skip\\]" || true)
  local has_ask=$(echo "$frontmatter" | grep -Ec "【先问什么】|\\[Ask\\]" || true)

  if [ "$has_trigger" -eq 0 ]; then
    log_optional_issue "$skill_name: Description missing 【触发条件】"
  fi
  if [ "$has_output" -eq 0 ]; then
    log_optional_issue "$skill_name: Description missing 【核心产出】"
  fi
  if [ "$has_not_trigger" -eq 0 ]; then
    log_optional_issue "$skill_name: Description missing 【不触发】"
  fi
  if [ "$has_ask" -eq 0 ]; then
    log_optional_issue "$skill_name: Description missing 【先问什么】"
  fi
}

# Validate line count
validate_line_count() {
  local skill_md="$1"
  local skill_name="$2"

  local lines=$(wc -l < "$skill_md" | tr -d ' ')

  if [ "$lines" -gt 500 ]; then
    log_error "$skill_name: SKILL.md has $lines lines (max 500)"
    return 1
  fi

  return 0
}

# Validate context/token budget hints
validate_context_budget() {
  local skill_md="$1"
  local skill_name="$2"
  local lines chars max_block

  lines=$(wc -l < "$skill_md" | tr -d ' ')
  chars=$(wc -c < "$skill_md" | tr -d ' ')

  if [ "$lines" -gt "$SKILL_SOFT_LINE_LIMIT" ]; then
    log_optional_issue "$skill_name: SKILL.md has $lines lines (recommended <= $SKILL_SOFT_LINE_LIMIT for context efficiency)"
  fi

  if [ "$chars" -gt "$SKILL_CHAR_BUDGET" ]; then
    if ! grep -Eiq "渐进|按需加载|分片|_index|_manifest|不要一次性|only load|progressive|lazy load" "$skill_md"; then
      log_optional_issue "$skill_name: SKILL.md has $chars chars (recommended <= $SKILL_CHAR_BUDGET). Consider progressive loading guidance."
    fi
  fi

  max_block=$(awk '
    BEGIN { in_block=0; line_count=0; max_lines=0 }
    /^```/ {
      if (in_block == 0) {
        in_block=1
        line_count=0
      } else {
        in_block=0
        if (line_count > max_lines) max_lines=line_count
      }
      next
    }
    {
      if (in_block == 1) line_count++
    }
    END { print max_lines }
  ' "$skill_md")

  if [ "$max_block" -gt "$MAX_EXAMPLE_BLOCK_LINES" ]; then
    log_optional_issue "$skill_name: Long fenced code block ($max_block lines). Consider moving large examples to assets/."
  fi
}

# Validate directory structure
validate_structure() {
  local skill_dir="$1"
  local skill_name="$2"

  # Check references directory
  if [ -d "${skill_dir}/references" ]; then
    local ref_count=$(find "${skill_dir}/references" -type f ! -name ".gitkeep" | wc -l | tr -d ' ')
    if [ "$ref_count" -eq 0 ]; then
      log_optional_issue "$skill_name: references/ directory is empty"
    else
      log_success "$skill_name: references/ has $ref_count file(s)"
    fi
  fi

  # Check assets directory
  if [ -d "${skill_dir}/assets" ]; then
    local asset_count=$(find "${skill_dir}/assets" -type f ! -name ".gitkeep" | wc -l | tr -d ' ')
    if [ "$asset_count" -eq 0 ]; then
      log_optional_issue "$skill_name: assets/ directory is empty"
    else
      log_success "$skill_name: assets/ has $asset_count file(s)"
    fi
  fi

  # Check scripts directory
  if [ -d "${skill_dir}/scripts" ]; then
    local script_count=$(find "${skill_dir}/scripts" -type f \( -name "*.ts" -o -name "*.sh" \) | wc -l | tr -d ' ')
    if [ "$script_count" -eq 0 ]; then
      log_optional_issue "$skill_name: scripts/ directory has no .ts or .sh files"
    else
      log_success "$skill_name: scripts/ has $script_count script(s)"

      # Check if scripts are executable (for .sh files)
      for script in "${skill_dir}/scripts"/*.sh; do
        if [ -f "$script" ] && [ ! -x "$script" ]; then
          log_warning "$skill_name: $(basename $script) is not executable"
        fi
      done
    fi
  fi
}

# Validate references indexing for larger knowledge packs
validate_reference_index() {
  local skill_dir="$1"
  local skill_name="$2"
  local references_dir ref_count

  references_dir="${skill_dir}/references"
  if [ ! -d "$references_dir" ]; then
    return 0
  fi

  ref_count=$(find "$references_dir" -type f ! -name ".gitkeep" | wc -l | tr -d ' ')
  if [ "$ref_count" -lt "$REFERENCE_INDEX_THRESHOLD" ]; then
    return 0
  fi

  if [ ! -f "${references_dir}/_index.md" ] \
    && [ ! -f "${references_dir}/index.md" ] \
    && [ ! -f "${references_dir}/_manifest.json" ] \
    && [ ! -f "${references_dir}/manifest.json" ]; then
    log_optional_issue "$skill_name: references/ has $ref_count files but no index/manifest. Recommend adding _index.md or _manifest.json."
  fi
}

# Validate TypeScript scripts can be parsed
validate_typescript() {
  local skill_dir="$1"
  local skill_name="$2"

  for ts_file in "${skill_dir}/scripts"/*.ts; do
    if [ -f "$ts_file" ]; then
      # Check for shebang
      if ! head -1 "$ts_file" | grep -q "^#!/"; then
        log_warning "$skill_name: $(basename $ts_file) missing shebang"
      fi

      # Check for ESM shebang
      if head -1 "$ts_file" | grep -q "ts-node" && ! head -1 "$ts_file" | grep -q "\-\-esm"; then
        log_error "$skill_name: $(basename $ts_file) missing --esm flag in shebang"
      fi
    fi
  done
}

# Guard against legacy runtime path usage in plugin command definitions
validate_command_runtime_paths() {
  local legacy_hits absolute_hits runtime_hits artifacts_hits

  if command -v rg >/dev/null 2>&1; then
    legacy_hits=$(find "$PLUGINS_DIR" -path "*/commands/*.md" -type f -print0 | xargs -0 rg -n "\\.claude/.*/runs" 2>/dev/null || true)
    absolute_hits=$(find "$PLUGINS_DIR" -path "*/commands/*.md" -type f -print0 | xargs -0 rg -n "/Users/.*/\\.claude/" 2>/dev/null || true)
    runtime_hits=$(find "$PLUGINS_DIR" -path "*/commands/*.md" -type f -print0 | xargs -0 rg -n "\\.runtime/" 2>/dev/null || true)
    artifacts_hits=$(find "$PLUGINS_DIR" -path "*/commands/*.md" -type f -print0 | xargs -0 rg -n "openspec/changes/.*/artifacts" 2>/dev/null || true)
  else
    legacy_hits=$(find "$PLUGINS_DIR" -path "*/commands/*.md" -type f -print0 | xargs -0 grep -nE "\\.claude/.*/runs" 2>/dev/null || true)
    absolute_hits=$(find "$PLUGINS_DIR" -path "*/commands/*.md" -type f -print0 | xargs -0 grep -nE "/Users/.*/\\.claude/" 2>/dev/null || true)
    runtime_hits=$(find "$PLUGINS_DIR" -path "*/commands/*.md" -type f -print0 | xargs -0 grep -nE "\\.runtime/" 2>/dev/null || true)
    artifacts_hits=$(find "$PLUGINS_DIR" -path "*/commands/*.md" -type f -print0 | xargs -0 grep -nE "openspec/changes/.*/artifacts" 2>/dev/null || true)
  fi

  if [ -n "$legacy_hits" ]; then
    log_error "Forbidden legacy runtime path found in command files (.claude/*/runs)"
    echo "$legacy_hits"
  else
    log_success "Command runtime path guard: no legacy .claude/*/runs references"
  fi

  if [ -n "$absolute_hits" ]; then
    log_error "Forbidden absolute legacy runtime path found in command files (/Users/.../.claude/...)"
    echo "$absolute_hits"
  else
    log_success "Command runtime path guard: no absolute /Users/.../.claude/... references"
  fi

  if [ -n "$runtime_hits" ]; then
    log_error "Forbidden independent runtime directory found in command files (.runtime/...)"
    echo "$runtime_hits"
  else
    log_success "Command runtime path guard: no independent .runtime/... references"
  fi

  if [ -n "$artifacts_hits" ]; then
    log_error "Forbidden OpenSpec artifacts runtime path found in command files (openspec/changes/*/artifacts/*)"
    echo "$artifacts_hits"
  else
    log_success "Command runtime path guard: no openspec/changes/*/artifacts/* runtime references"
  fi
}

# Main validation loop
echo "========================================"
echo "       SKILL VALIDATION REPORT"
echo "========================================"
echo "Mode: $( [ "$STRICT_MODE" = true ] && echo strict || echo relaxed )"
echo ""

for plugin_dir in "$PLUGINS_DIR"/*/; do
  plugin_name=$(basename "$plugin_dir")
  echo -e "\n${BLUE}=== Plugin: $plugin_name ===${NC}\n"

  skills_root="${plugin_dir}/skills"
  if [ ! -d "$skills_root" ]; then
    log_info "$plugin_name: skills directory missing, skipping"
    continue
  fi

  skill_dirs=( "$skills_root"/*/ )
  if [ ${#skill_dirs[@]} -eq 0 ]; then
    log_info "$plugin_name: no skills found, skipping"
    continue
  fi

  for skill_dir in "${skill_dirs[@]}"; do
    # Skip _shared directory
    [[ "$skill_dir" == *"_shared"* ]] && continue

    skill_name=$(basename "$skill_dir")
    skill_md="${skill_dir}SKILL.md"

    echo -e "\n--- $plugin_name/$skill_name ---"

    # Check SKILL.md exists
    if [ ! -f "$skill_md" ]; then
      log_error "$skill_name: SKILL.md not found"
      continue
    fi

    # Run validations
    validate_frontmatter "$skill_md" "$skill_name"
    validate_description "$skill_md" "$skill_name"
    validate_line_count "$skill_md" "$skill_name"
    validate_context_budget "$skill_md" "$skill_name"
    validate_structure "$skill_dir" "$skill_name"
    validate_reference_index "$skill_dir" "$skill_name"
    validate_typescript "$skill_dir" "$skill_name"
  done
done

# Validate command-level runtime path guard (hard-cutover)
validate_command_runtime_paths

# Summary
echo ""
echo "========================================"
echo "           VALIDATION SUMMARY"
echo "========================================"
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}❌ Validation FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Validation PASSED${NC}"
  exit 0
fi
