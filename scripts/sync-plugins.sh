#!/bin/bash
# Sync and install plugins to Claude Code
# Usage: ./scripts/sync-plugins.sh [options] [plugin-name...]
#
# Options:
#   -i, --install     Install plugins after syncing
#   -l, --list        List all available plugins
#   -s, --select      Interactive selection mode
#   -y, --yes         Skip all confirmations (non-interactive)
#   -d, --dry-run     Show what would be done without doing it
#   -q, --quiet       Minimal output (implies --yes)
#   -h, --help        Show this help message
#
# Examples:
#   ./scripts/sync-plugins.sh                    # interactive sync
#   ./scripts/sync-plugins.sh -y                 # sync all without prompts
#   ./scripts/sync-plugins.sh commit tpd         # sync specific plugins
#   ./scripts/sync-plugins.sh -i                 # sync all and install
#   ./scripts/sync-plugins.sh -s                 # interactive selection
#   ./scripts/sync-plugins.sh -d                 # dry-run mode

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CACHE_DIR="$HOME/.claude/plugins/cache/ccg-workflows"
SOURCE_DIR="${PROJECT_ROOT}/plugins"
MARKETPLACE_JSON="${PROJECT_ROOT}/.claude-plugin/marketplace.json"
MARKETPLACE_NAME="ccg-workflows"

# ============================================================================
# Colors & Symbols
# ============================================================================

# Check if terminal supports colors
if [[ -t 1 ]] && [[ "${TERM:-}" != "dumb" ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  MAGENTA='\033[0;35m'
  CYAN='\033[0;36m'
  WHITE='\033[1;37m'
  DIM='\033[2m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' MAGENTA='' CYAN='' WHITE='' DIM='' BOLD='' NC=''
fi

# Symbols
SYM_CHECK="✓"
SYM_CROSS="✗"
SYM_ARROW="→"
SYM_DOT="•"
SYM_SYNC="⟳"
SYM_PKG="📦"
SYM_CMD="📋"
SYM_AGENT="🤖"
SYM_SKILL="⚡"
SYM_HOOK="🪝"
SYM_TIME="⏱"
SYM_INFO="ℹ"

# ============================================================================
# Global State
# ============================================================================

DO_INSTALL=false
DO_LIST=false
DO_SELECT=false
DO_DRY_RUN=false
QUIET_MODE=false
AUTO_YES=false
PLUGIN_NAMES=()
SYNC_COUNT=0
SKIP_COUNT=0
FAIL_COUNT=0
START_TIME=0

# ============================================================================
# Utility Functions
# ============================================================================

# Get terminal width
get_term_width() {
  if command -v tput &>/dev/null; then
    tput cols 2>/dev/null || echo 80
  else
    echo 80
  fi
}

# Print a horizontal line
print_line() {
  local char="${1:-─}"
  local width=$(get_term_width)
  printf '%*s\n' "$width" '' | tr ' ' "$char"
}

# Print centered text
print_centered() {
  local text="$1"
  local width=$(get_term_width)
  local text_len=${#text}
  local padding=$(( (width - text_len) / 2 ))
  printf "%*s%s\n" $padding '' "$text"
}

# Print header
print_header() {
  local title="$1"
  echo ""
  echo -e "${CYAN}${BOLD}╭$(printf '─%.0s' {1..50})╮${NC}"
  echo -e "${CYAN}${BOLD}│${NC}$(printf ' %.0s' {1..10})${WHITE}${BOLD}$title${NC}$(printf ' %.0s' {1..10})${CYAN}${BOLD}│${NC}"
  echo -e "${CYAN}${BOLD}╰$(printf '─%.0s' {1..50})╯${NC}"
  echo ""
}

# Print section header
print_section() {
  local title="$1"
  echo ""
  echo -e "${BLUE}${BOLD}━━━ $title ━━━${NC}"
  echo ""
}

# Print info message
info() {
  [[ "$QUIET_MODE" == true ]] && return
  echo -e "${BLUE}${SYM_INFO}${NC} $1"
}

# Print success message
success() {
  echo -e "${GREEN}${SYM_CHECK}${NC} $1"
}

# Print warning message
warn() {
  echo -e "${YELLOW}${SYM_DOT}${NC} $1"
}

# Print error message
error() {
  echo -e "${RED}${SYM_CROSS}${NC} $1" >&2
}

# Print progress spinner
spin() {
  local pid=$1
  local msg="$2"
  local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local i=0

  while kill -0 "$pid" 2>/dev/null; do
    local char="${spinstr:$i:1}"
    printf "\r%b%s%b %s" "$CYAN" "$char" "$NC" "$msg"
    i=$(( (i + 1) % ${#spinstr} ))
    sleep 0.1
  done
  printf "\r"
}

# Progress bar
progress_bar() {
  local current=$1
  local total=$2
  local width=30
  local percent=$((current * 100 / total))
  local filled=$((current * width / total))
  local empty=$((width - filled))

  printf "\r  %b[%b" "$DIM" "$NC"
  printf "%b%*s%b" "$GREEN" $filled '' "$NC" | tr ' ' '█'
  printf "%b%*s%b" "$DIM" $empty '' "$NC" | tr ' ' '░'
  printf "%b]%b %b%3d%%%b " "$DIM" "$NC" "$WHITE" $percent "$NC"
}

# Format duration
format_duration() {
  local seconds=$1
  if ((seconds < 60)); then
    printf "%ds" $seconds
  else
    printf "%dm %ds" $((seconds / 60)) $((seconds % 60))
  fi
}

# Confirm prompt (returns 0 for yes, 1 for no)
confirm() {
  local prompt="$1"
  local default="${2:-y}"  # y or n

  [[ "$AUTO_YES" == true ]] && return 0

  local yn_hint="Y/n"
  [[ "$default" == "n" ]] && yn_hint="y/N"

  printf "  %b?%b %s %b[%s]%b " "$YELLOW" "$NC" "$prompt" "$DIM" "$yn_hint" "$NC"
  read -r response

  response=${response:-$default}
  [[ "$response" =~ ^[Yy]$ ]]
}

# Ask yes/no/quit
ask_ynq() {
  local prompt="$1"

  [[ "$AUTO_YES" == true ]] && return 0

  printf "  %b?%b %s %b[Y/n/q]%b " "$YELLOW" "$NC" "$prompt" "$DIM" "$NC"
  read -r response

  case "$response" in
    [Qq]*)
      echo ""
      info "Operation cancelled"
      exit 0
      ;;
    [Nn]*)
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

# Show plugin preview table
show_plugin_preview() {
  local plugins=("$@")

  echo -e "  ${BOLD}${WHITE}#   PLUGIN          CMDS  AGENTS  SKILLS  HOOKS${NC}"
  echo -e "  ${DIM}$(printf '─%.0s' {1..55})${NC}"

  local i=1
  for plugin in "${plugins[@]}"; do
    local info=($(get_plugin_info "$plugin"))
    local cmd_count=${info[0]:-0}
    local agent_count=${info[1]:-0}
    local skill_count=${info[2]:-0}
    local has_hooks=${info[3]:-no}

    local hooks_icon="${DIM}─${NC}"
    [[ "$has_hooks" == "yes" ]] && hooks_icon="${YELLOW}${SYM_HOOK}${NC}"

    # Use %b for interpreting escape sequences
    printf "  %b%2d%b  %b%-15s%b %4s   %6s   %4s    %b\n" \
      "$CYAN" $i "$NC" "$GREEN" "$plugin" "$NC" "$cmd_count" "$agent_count" "$skill_count" "$hooks_icon"
    i=$((i + 1))
  done
  echo ""
}

# ============================================================================
# Plugin Functions
# ============================================================================

# Get plugins from marketplace.json
get_plugins() {
  if [[ ! -f "$MARKETPLACE_JSON" ]]; then
    error "marketplace.json not found: $MARKETPLACE_JSON"
    exit 1
  fi
  awk '/"plugins":/,/]/' "$MARKETPLACE_JSON" | grep '"name"' | sed 's/.*"name": *"\([^"]*\)".*/\1/'
}

# Get plugin description
get_plugin_description() {
  local plugin="$1"
  awk -v name="$plugin" '
    /"name":/ && $0 ~ "\"" name "\"" { found=1; next }
    found && /"description":/ {
      gsub(/.*"description": *"/, "")
      gsub(/".*/, "")
      print
      exit
    }
  ' "$MARKETPLACE_JSON"
}

# Get plugin version from marketplace.json
get_marketplace_version() {
  local plugin="$1"
  awk -v name="$plugin" '
    /"name":/ && $0 ~ "\"" name "\"" { found=1; next }
    found && /"version":/ {
      gsub(/.*"version": *"/, "")
      gsub(/".*/, "")
      print
      exit
    }
  ' "$MARKETPLACE_JSON"
}

# Get plugin version from plugin.json
get_plugin_meta_version() {
  local plugin="$1"
  local meta_file="${SOURCE_DIR}/${plugin}/.claude-plugin/plugin.json"

  [[ -f "$meta_file" ]] || return 0
  awk -F'"' '/"version":/ { print $4; exit }' "$meta_file"
}

# Resolve plugin version (marketplace preferred, fallback to metadata)
resolve_plugin_version() {
  local plugin="$1"
  local market_version
  local meta_version
  local version

  market_version=$(get_marketplace_version "$plugin")
  meta_version=$(get_plugin_meta_version "$plugin")

  if [[ -n "$market_version" ]]; then
    version="$market_version"
  elif [[ -n "$meta_version" ]]; then
    version="$meta_version"
  else
    version="1.0.0"
  fi

  if [[ -n "$market_version" && -n "$meta_version" && "$market_version" != "$meta_version" ]]; then
    [[ "$QUIET_MODE" != true ]] && warn "Version mismatch for ${GREEN}$plugin${NC}: plugin.json=$meta_version, marketplace.json=$market_version"
  fi

  echo "$version"
}

# Get plugin info (commands, skills, hooks count)
get_plugin_info() {
  local plugin="$1"
  local src="${SOURCE_DIR}/${plugin}"
  local cmd_count=0
  local agent_count=0
  local skill_count=0
  local has_hooks="no"

  if [[ -d "$src/commands" ]]; then
    cmd_count=$(find "$src/commands" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  fi

  if [[ -d "$src/agents" ]]; then
    agent_count=$(find "$src/agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  fi

  if [[ -d "$src/skills" ]]; then
    skill_count=$(find "$src/skills" -maxdepth 2 -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
  fi

  if [[ -f "$src/.claude-plugin/hooks.json" ]] || [[ -f "$src/hooks/hooks.json" ]] || [[ -f "$src/hooks/hooks/hooks.json" ]]; then
    has_hooks="yes"
  fi

  echo "$cmd_count $agent_count $skill_count $has_hooks"
}

# List all plugins with table format
list_plugins() {
  print_header "Available Plugins"

  local plugins=()
  while IFS= read -r plugin; do
    plugins+=("$plugin")
  done < <(get_plugins)

  # Table header
  printf "  %b%b%-15s %-6s %-7s %-7s %-6s %s%b\n" "$BOLD" "$WHITE" "NAME" "CMDS" "AGENTS" "SKILLS" "HOOKS" "DESCRIPTION" "$NC"
  echo -e "  ${DIM}$(printf '─%.0s' {1..75})${NC}"

  for plugin in "${plugins[@]}"; do
    local desc=$(get_plugin_description "$plugin")
    local info=($(get_plugin_info "$plugin"))
    local cmd_count=${info[0]:-0}
    local agent_count=${info[1]:-0}
    local skill_count=${info[2]:-0}
    local has_hooks=${info[3]:-no}

    # Truncate description if too long
    if [[ ${#desc} -gt 35 ]]; then
      desc="${desc:0:32}..."
    fi

    local hooks_icon="${DIM}─${NC}"
    [[ "$has_hooks" == "yes" ]] && hooks_icon="${YELLOW}${SYM_HOOK}${NC}"

    printf "  %b%-15s%b %b%4s%b    %b%4s%b    %b%4s%b    %b   %s\n" \
      "$GREEN" "$plugin" "$NC" "$CYAN" "$cmd_count" "$NC" "$BLUE" "$agent_count" "$NC" "$MAGENTA" "$skill_count" "$NC" "$hooks_icon" "$desc"
  done

  echo ""
  echo -e "  ${DIM}Total: ${WHITE}${#plugins[@]}${NC}${DIM} plugins${NC}"
  echo ""
}

# Interactive plugin selection
select_plugins() {
  local plugins=()
  while IFS= read -r plugin; do
    plugins+=("$plugin")
  done < <(get_plugins)

  print_header "Select Plugins to Sync"

  local selected=()
  local i=1

  echo -e "  ${DIM}Enter numbers separated by space, 'a' for all, 'q' to quit${NC}"
  echo ""

  for plugin in "${plugins[@]}"; do
    local desc=$(get_plugin_description "$plugin")
    [[ ${#desc} -gt 40 ]] && desc="${desc:0:37}..."
    printf "  %b%2d%b) %b%-15s%b %s\n" "$CYAN" $i "$NC" "$GREEN" "$plugin" "$NC" "$desc"
    i=$((i + 1))
  done

  echo ""
  printf "  %b%s%b Selection: " "$YELLOW" "$SYM_ARROW" "$NC"
  read -r selection

  if [[ "$selection" == "q" ]]; then
    echo ""
    info "Operation cancelled"
    exit 0
  fi

  if [[ "$selection" == "a" ]]; then
    PLUGIN_NAMES=("${plugins[@]}")
    return
  fi

  for num in $selection; do
    if [[ "$num" =~ ^[0-9]+$ ]] && ((num >= 1 && num <= ${#plugins[@]})); then
      PLUGIN_NAMES+=("${plugins[$((num-1))]}")
    fi
  done

  if [[ ${#PLUGIN_NAMES[@]} -eq 0 ]]; then
    error "No valid plugins selected"
    exit 1
  fi
}

# Sync a single plugin
sync_plugin() {
  local plugin="$1"
  local src="${SOURCE_DIR}/${plugin}"
  local version
  version=$(resolve_plugin_version "$plugin")
  local dst="${CACHE_DIR}/${plugin}/${version}"

  if [[ ! -d "$src" ]]; then
    error "Plugin not found: $plugin"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    return 1
  fi

  local info=($(get_plugin_info "$plugin"))
  local cmd_count=${info[0]:-0}
  local agent_count=${info[1]:-0}
  local skill_count=${info[2]:-0}
  local has_hooks=${info[3]:-no}

  if [[ $cmd_count -eq 0 && $agent_count -eq 0 && $skill_count -eq 0 && "$has_hooks" == "no" ]]; then
    warn "Skipped ${YELLOW}$plugin${NC} (no commands/agents/skills/hooks)"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    return 0
  fi

  if [[ "$DO_DRY_RUN" == true ]]; then
    echo -e "  ${DIM}[dry-run]${NC} Would sync ${GREEN}$plugin${NC}"
    echo -e "           ${SYM_ARROW} $src"
    echo -e "           ${SYM_ARROW} $dst"
    SYNC_COUNT=$((SYNC_COUNT + 1))
    return 0
  fi

  # Perform sync
  rm -rf "$dst"
  mkdir -p "$dst"
  cp -r "${src}"/. "$dst/"

  # Build info string
  local info_str=""
  [[ $cmd_count -gt 0 ]] && info_str+="${SYM_CMD}${cmd_count} "
  [[ $agent_count -gt 0 ]] && info_str+="${SYM_AGENT}${agent_count} "
  [[ $skill_count -gt 0 ]] && info_str+="${SYM_SKILL}${skill_count} "
  [[ "$has_hooks" == "yes" ]] && info_str+="${SYM_HOOK}"

  success "Synced ${GREEN}$plugin${NC} ${DIM}($info_str)${NC}"
  SYNC_COUNT=$((SYNC_COUNT + 1))
}

# Install plugins
install_plugins() {
  local plugins=("$@")

  print_section "Installing Plugins"

  if [[ "$DO_DRY_RUN" == true ]]; then
    echo -e "  ${DIM}[dry-run]${NC} Would add marketplace: ${CYAN}$PROJECT_ROOT${NC}"
    for plugin in "${plugins[@]}"; do
      echo -e "  ${DIM}[dry-run]${NC} Would install: ${GREEN}${plugin}@${MARKETPLACE_NAME}${NC}"
    done
    return 0
  fi

  # Add marketplace
  info "Adding local marketplace..."
  if claude plugin marketplace add "${PROJECT_ROOT}" 2>/dev/null; then
    success "Marketplace added: ${CYAN}${MARKETPLACE_NAME}${NC}"
  else
    warn "Marketplace already exists"
  fi

  echo ""

  # Install each plugin with progress
  local total=${#plugins[@]}
  local current=0

  for plugin in "${plugins[@]}"; do
    current=$((current + 1))
    [[ "$QUIET_MODE" != true ]] && progress_bar $current $total

    if claude plugin install "${plugin}@${MARKETPLACE_NAME}" 2>/dev/null; then
      printf "%b%s%b %s\n" "$GREEN" "$SYM_CHECK" "$NC" "$plugin"
    else
      printf "%b%s%b %s %b(already installed)%b\n" "$YELLOW" "$SYM_DOT" "$NC" "$plugin" "$DIM" "$NC"
    fi
  done

  echo ""
}

# Print summary
print_summary() {
  local end_time=$(date +%s)
  local duration=$((end_time - START_TIME))

  print_section "Summary"

  echo -e "  ${GREEN}${SYM_CHECK} Synced:${NC}  $SYNC_COUNT"
  [[ $SKIP_COUNT -gt 0 ]] && echo -e "  ${YELLOW}${SYM_DOT} Skipped:${NC} $SKIP_COUNT"
  [[ $FAIL_COUNT -gt 0 ]] && echo -e "  ${RED}${SYM_CROSS} Failed:${NC}  $FAIL_COUNT"
  echo -e "  ${DIM}${SYM_TIME} Time:${NC}    $(format_duration $duration)"
  echo ""
}

# Print help
print_help() {
  echo ""
  echo -e "${BOLD}${WHITE}sync-plugins.sh${NC} - Sync and install Claude Code plugins"
  echo ""
  echo -e "${BOLD}USAGE:${NC}"
  echo "  ./scripts/sync-plugins.sh [options] [plugin-name...]"
  echo ""
  echo -e "${BOLD}OPTIONS:${NC}"
  echo -e "  ${GREEN}-i, --install${NC}    Install plugins after syncing"
  echo -e "  ${GREEN}-l, --list${NC}       List all available plugins"
  echo -e "  ${GREEN}-s, --select${NC}     Interactive selection mode"
  echo -e "  ${GREEN}-y, --yes${NC}        Skip all confirmations"
  echo -e "  ${GREEN}-d, --dry-run${NC}    Show what would be done without doing it"
  echo -e "  ${GREEN}-q, --quiet${NC}      Minimal output (implies --yes)"
  echo -e "  ${GREEN}-h, --help${NC}       Show this help message"
  echo ""
  echo -e "${BOLD}EXAMPLES:${NC}"
  echo "  ./scripts/sync-plugins.sh                # interactive sync"
  echo "  ./scripts/sync-plugins.sh -y             # sync all without prompts"
  echo "  ./scripts/sync-plugins.sh commit tpd     # sync specific plugins"
  echo "  ./scripts/sync-plugins.sh -i             # sync all and install"
  echo "  ./scripts/sync-plugins.sh -s             # interactive selection"
  echo "  ./scripts/sync-plugins.sh -s -i          # select and install"
  echo "  ./scripts/sync-plugins.sh -d             # dry-run mode"
  echo ""
}

# ============================================================================
# Main
# ============================================================================

main() {
  START_TIME=$(date +%s)

  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      -i|--install)
        DO_INSTALL=true
        shift
        ;;
      -l|--list)
        DO_LIST=true
        shift
        ;;
      -s|--select)
        DO_SELECT=true
        shift
        ;;
      -y|--yes)
        AUTO_YES=true
        shift
        ;;
      -d|--dry-run)
        DO_DRY_RUN=true
        shift
        ;;
      -q|--quiet)
        QUIET_MODE=true
        AUTO_YES=true  # quiet implies yes
        shift
        ;;
      -h|--help)
        print_help
        exit 0
        ;;
      -*)
        error "Unknown option: $1"
        print_help
        exit 1
        ;;
      *)
        PLUGIN_NAMES+=("$1")
        shift
        ;;
    esac
  done

  # Handle --list
  if [[ "$DO_LIST" == true ]]; then
    list_plugins
    exit 0
  fi

  # Handle --select
  if [[ "$DO_SELECT" == true ]]; then
    select_plugins
  fi

  # Get all plugins if none specified
  if [[ ${#PLUGIN_NAMES[@]} -eq 0 ]]; then
    while IFS= read -r plugin; do
      PLUGIN_NAMES+=("$plugin")
    done < <(get_plugins)
  fi

  # Print header
  [[ "$QUIET_MODE" != true ]] && print_header "Plugin Sync"

  # Dry-run notice
  if [[ "$DO_DRY_RUN" == true ]]; then
    echo -e "  ${YELLOW}${BOLD}DRY-RUN MODE${NC} - No changes will be made"
    echo ""
  fi

  # Show preview and ask for confirmation (unless --yes or --select)
  if [[ "$AUTO_YES" != true && "$DO_SELECT" != true && "$QUIET_MODE" != true ]]; then
    echo -e "  ${BOLD}Plugins to sync:${NC}"
    echo ""
    show_plugin_preview "${PLUGIN_NAMES[@]}"

    if ! ask_ynq "Proceed with sync?"; then
      # User said no, offer selection mode
      echo ""
      if confirm "Would you like to select specific plugins instead?" "y"; then
        PLUGIN_NAMES=()
        select_plugins
        echo ""
      else
        echo ""
        info "Operation cancelled"
        exit 0
      fi
    fi
    echo ""
  fi

  # Sync plugins
  print_section "Syncing Plugins"

  for plugin in "${PLUGIN_NAMES[@]}"; do
    sync_plugin "$plugin"
  done

  # Print summary
  [[ "$QUIET_MODE" != true ]] && print_summary

  # Ask about installation (unless --install already specified or --yes)
  if [[ "$DO_INSTALL" == true ]]; then
    install_plugins "${PLUGIN_NAMES[@]}"
  elif [[ "$AUTO_YES" != true && "$QUIET_MODE" != true && $SYNC_COUNT -gt 0 ]]; then
    if confirm "Install synced plugins to Claude Code?" "y"; then
      install_plugins "${PLUGIN_NAMES[@]}"
    else
      echo ""
      echo -e "  ${DIM}To install later:${NC}"
      echo -e "    ${CYAN}./scripts/sync-plugins.sh -i${NC}"
      echo ""
    fi
  elif [[ "$QUIET_MODE" != true && "$DO_INSTALL" == false ]]; then
    echo -e "  ${DIM}To install plugins:${NC}"
    echo -e "    ${CYAN}./scripts/sync-plugins.sh -i${NC}"
    echo ""
  fi

  # Exit with error if any failed
  [[ $FAIL_COUNT -gt 0 ]] && exit 1
  exit 0
}

main "$@"
