#!/bin/bash
# Sync plugins to Claude Code cache
# Usage: ./scripts/sync-plugins.sh [plugin-name]
# Examples:
#   ./scripts/sync-plugins.sh          # sync all plugins
#   ./scripts/sync-plugins.sh commit   # sync only commit plugin

set -e

CACHE_DIR="$HOME/.claude/plugins/cache/ccg-workflows"
SOURCE_DIR="plugins/commands"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Main
if [ -n "$1" ]; then
  # Sync specific plugin
  sync_plugin "$1"
else
  # Sync all plugins
  for plugin in brainstorm commit dev hooks plan ui-design; do
    sync_plugin "$plugin"
  done
fi

echo ""
echo -e "${GREEN}Done! Restart Claude Code to apply changes.${NC}"
