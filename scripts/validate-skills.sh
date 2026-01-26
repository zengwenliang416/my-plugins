#!/bin/bash
# Skill Validation Script
# Validates all skills in the plugins directory

set -e

PLUGINS_DIR="plugins"
ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_error() {
  echo -e "${RED}❌ ERROR:${NC} $1"
  ((ERRORS++))
}

log_warning() {
  echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
  ((WARNINGS++))
}

log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

log_info() {
  echo -e "${BLUE}ℹ️${NC} $1"
}

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

  # Check for 4-part format in frontmatter
  local has_trigger=$(echo "$frontmatter" | grep -c "【触发条件】" || true)
  local has_output=$(echo "$frontmatter" | grep -c "【核心产出】" || true)
  local has_not_trigger=$(echo "$frontmatter" | grep -c "【不触发】" || true)
  local has_ask=$(echo "$frontmatter" | grep -c "【先问什么】" || true)

  if [ "$has_trigger" -eq 0 ]; then
    log_warning "$skill_name: Description missing 【触发条件】"
  fi
  if [ "$has_output" -eq 0 ]; then
    log_warning "$skill_name: Description missing 【核心产出】"
  fi
  if [ "$has_not_trigger" -eq 0 ]; then
    log_warning "$skill_name: Description missing 【不触发】"
  fi
  if [ "$has_ask" -eq 0 ]; then
    log_warning "$skill_name: Description missing 【先问什么】"
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

# Validate directory structure
validate_structure() {
  local skill_dir="$1"
  local skill_name="$2"

  # Check references directory
  if [ -d "${skill_dir}/references" ]; then
    local ref_count=$(find "${skill_dir}/references" -type f ! -name ".gitkeep" | wc -l | tr -d ' ')
    if [ "$ref_count" -eq 0 ]; then
      log_warning "$skill_name: references/ directory is empty"
    else
      log_success "$skill_name: references/ has $ref_count file(s)"
    fi
  fi

  # Check assets directory
  if [ -d "${skill_dir}/assets" ]; then
    local asset_count=$(find "${skill_dir}/assets" -type f ! -name ".gitkeep" | wc -l | tr -d ' ')
    if [ "$asset_count" -eq 0 ]; then
      log_warning "$skill_name: assets/ directory is empty"
    else
      log_success "$skill_name: assets/ has $asset_count file(s)"
    fi
  fi

  # Check scripts directory
  if [ -d "${skill_dir}/scripts" ]; then
    local script_count=$(find "${skill_dir}/scripts" -type f \( -name "*.ts" -o -name "*.sh" \) | wc -l | tr -d ' ')
    if [ "$script_count" -eq 0 ]; then
      log_warning "$skill_name: scripts/ directory has no .ts or .sh files"
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

# Main validation loop
echo "========================================"
echo "       SKILL VALIDATION REPORT"
echo "========================================"
echo ""

for plugin_dir in "$PLUGINS_DIR"/*/; do
  plugin_name=$(basename "$plugin_dir")
  echo -e "\n${BLUE}=== Plugin: $plugin_name ===${NC}\n"

  skills_root="${plugin_dir}/skills"
  if [ ! -d "$skills_root" ]; then
    log_warning "$plugin_name: skills directory missing, skipping"
    continue
  fi

  skill_dirs=( "$skills_root"/*/ )
  if [ ${#skill_dirs[@]} -eq 0 ]; then
    log_warning "$plugin_name: no skills found, skipping"
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
    validate_structure "$skill_dir" "$skill_name"
    validate_typescript "$skill_dir" "$skill_name"
  done
done

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
