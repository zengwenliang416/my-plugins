# Plugin Metadata Reference

This document summarizes the metadata schemas for plugin configuration.

## 1. Core Summary

Plugins use JSON metadata files for registration and YAML frontmatter in markdown files for component definitions. The marketplace system enables local plugin distribution.

## 2. Source of Truth

- **Plugin Metadata:** `plugins/{plugin}/.claude-plugin/plugin.json`
- **Marketplace Registry:** `.claude-plugin/marketplace.json`
- **Hook Definitions:** `plugins/hooks/hooks/hooks.json`
- **Sync Script:** `scripts/sync-plugins.sh`
- **Related Architecture:** `/llmdoc/architecture/plugin-architecture.md`

## 3. Schema Summaries

### plugin.json

| Field       | Type   | Required | Description       |
| ----------- | ------ | -------- | ----------------- |
| name        | string | yes      | Plugin identifier |
| description | string | yes      | Brief description |
| version     | string | yes      | Semantic version  |

### marketplace.json

| Field             | Type   | Description             |
| ----------------- | ------ | ----------------------- |
| name              | string | Marketplace identifier  |
| description       | string | Marketplace description |
| plugins[].name    | string | Plugin name             |
| plugins[].source  | string | Relative path to plugin |
| plugins[].version | string | Plugin version          |

### hooks.json

| Field                    | Type    | Description                                |
| ------------------------ | ------- | ------------------------------------------ |
| description              | string  | Hook collection description                |
| hooks.{HookPoint}[]      | array   | Array of hook definitions                  |
| hooks.{}.matcher         | string  | Tool name or regex pattern                 |
| hooks.{}.hooks[].command | string  | Script path (uses `${CLAUDE_PLUGIN_ROOT}`) |
| hooks.{}.hooks[].timeout | number  | Execution timeout (seconds)                |
| hooks.{}.hooks[].async   | boolean | Non-blocking execution                     |

**Hook Points:** `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Notification`

## 4. Installation

```bash
# Add local marketplace
claude plugin marketplace add .

# Install plugin
claude plugin install {plugin-name}@ccg-workflows

# Sync plugins to cache
./scripts/sync-plugins.sh
```
