#!/bin/bash
# Sync and install plugins to Claude Code
# Usage: ./scripts/sync-plugins.sh [plugin-name] [--install] [--list]
# Examples:
#   ./scripts/sync-plugins.sh                    # sync all plugins
#   ./scripts/sync-plugins.sh commit             # sync only commit plugin
#   ./scripts/sync-plugins.sh --install          # sync all and install
#   ./scripts/sync-plugins.sh commit --install   # sync commit and install
#   ./scripts/sync-plugins.sh --list             # list all available plugins

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CACHE_DIR="$HOME/.claude/plugins/cache/ccg-workflows"
SOURCE_DIR="${PROJECT_ROOT}/plugins"
MARKETPLACE_JSON="${PROJECT_ROOT}/.claude-plugin/marketplace.json"
MARKETPLACE_NAME="ccg-workflows"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get plugins from marketplace.json
get_plugins() {
  if [ -f "$MARKETPLACE_JSON" ]; then
    # Extract plugin names from plugins array (skip marketplace name)
    grep -A1 '"plugins"' "$MARKETPLACE_JSON" | head -1 > /dev/null
    # Use awk to extract names only from plugins array
    awk '/"plugins":/,/]/' "$MARKETPLACE_JSON" | grep '"name"' | sed 's/.*"name": *"\([^"]*\)".*/\1/'
  else
    echo "❌ marketplace.json not found: $MARKETPLACE_JSON" >&2
    exit 1
  fi
}

# List all plugins with descriptions
list_plugins() {
  echo ""
  echo -e "${CYAN}=== Available Plugins ===${NC}"
  echo ""

  # Use a simple approach to extract name and description pairs
  local in_plugin=false
  local name=""
  local desc=""

  while IFS= read -r line; do
    if [[ "$line" =~ \"name\":\ *\"([^\"]+)\" ]]; then
      name="${BASH_REMATCH[1]}"
    fi
    if [[ "$line" =~ \"description\":\ *\"([^\"]+)\" ]]; then
      desc="${BASH_REMATCH[1]}"
      if [ -n "$name" ] && [ "$name" != "ccg-workflows" ]; then
        printf "  ${GREEN}%-15s${NC} %s\n" "$name" "$desc"
      fi
      name=""
      desc=""
    fi
  done < "$MARKETPLACE_JSON"

  echo ""
  echo -e "Total: ${GREEN}$(get_plugins | wc -l | tr -d ' ')${NC} plugins"
  echo ""
}

sync_plugin() {
  local plugin="$1"
  local src="${SOURCE_DIR}/${plugin}"
  local dst="${CACHE_DIR}/${plugin}/1.0.0"

  if [ ! -d "$src" ]; then
    echo "❌ Plugin not found: $src"
    return 1
  fi

  echo -e "${BLUE}Syncing ${plugin}...${NC}"
  rm -rf "$dst"
  mkdir -p "$dst"
  # 复制所有文件包括隐藏文件夹
  cp -r "${src}"/. "$dst/"

  echo -e "${GREEN}✅ ${plugin} synced${NC}"
}

install_plugins() {
  local plugins=("$@")

  echo ""
  echo -e "${BLUE}=== Installing plugins ===${NC}"

  # Add marketplace if not already added
  echo -e "${BLUE}Adding local marketplace...${NC}"
  if claude plugin marketplace add "${PROJECT_ROOT}" 2>/dev/null; then
    echo -e "${GREEN}✅ Marketplace added: ${MARKETPLACE_NAME}${NC}"
  else
    echo -e "${YELLOW}ℹ️  Marketplace already exists or updated${NC}"
  fi

  # Install each plugin
  for plugin in "${plugins[@]}"; do
    echo -e "${BLUE}Installing ${plugin}...${NC}"
    if claude plugin install "${plugin}@${MARKETPLACE_NAME}" 2>/dev/null; then
      echo -e "${GREEN}✅ ${plugin} installed${NC}"
    else
      echo -e "${YELLOW}ℹ️  ${plugin} already installed or updated${NC}"
    fi
  done
}

# Parse arguments
PLUGIN_NAME=""
DO_INSTALL=false
DO_LIST=false

for arg in "$@"; do
  case $arg in
    --install)
      DO_INSTALL=true
      ;;
    --list|-l)
      DO_LIST=true
      ;;
    *)
      PLUGIN_NAME="$arg"
      ;;
  esac
done

# Handle --list
if [ "$DO_LIST" = true ]; then
  list_plugins
  exit 0
fi

# Get all plugins from marketplace.json (macOS compatible)
ALL_PLUGINS=()
while IFS= read -r plugin; do
  ALL_PLUGINS+=("$plugin")
done < <(get_plugins)

# Main
if [ -n "$PLUGIN_NAME" ] && [ "$PLUGIN_NAME" != "--install" ]; then
  # Sync specific plugin
  sync_plugin "$PLUGIN_NAME"
  PLUGINS_TO_INSTALL=("$PLUGIN_NAME")
else
  # Sync all plugins
  for plugin in "${ALL_PLUGINS[@]}"; do
    sync_plugin "$plugin"
  done
  PLUGINS_TO_INSTALL=("${ALL_PLUGINS[@]}")
fi

# Install if requested
if [ "$DO_INSTALL" = true ]; then
  install_plugins "${PLUGINS_TO_INSTALL[@]}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"

if [ "$DO_INSTALL" = false ]; then
  echo ""
  echo "To install plugins, run:"
  echo "  ./scripts/sync-plugins.sh --install"
  echo ""
  echo "Or install manually:"
  echo "  claude plugin marketplace add ${PROJECT_ROOT}"
  echo "  claude plugin install <plugin>@${MARKETPLACE_NAME}"
fi
