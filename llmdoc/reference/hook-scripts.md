# Hook Scripts Reference

## 1. Core Summary

The hooks plugin provides 11 scripts across 5 categories: security (3), optimization (1), quality (1), logging (2), permission (2), notification (1), and evaluation (1). All scripts are shell-based, receive JSON via stdin, and output JSON responses.

## 2. Source of Truth

### Security Scripts

- **Primary Code:** `plugins/hooks/scripts/security/privacy-firewall.sh` - Detects API keys, tokens, PII in prompts (UserPromptSubmit).
- **Primary Code:** `plugins/hooks/scripts/security/db-guard.sh` - Blocks DROP, TRUNCATE, unsafe DELETE (PreToolUse Bash).
- **Primary Code:** `plugins/hooks/scripts/security/killshell-guard.sh` - Guards shell termination (PreToolUse KillShell).

### Optimization Scripts

- **Primary Code:** `plugins/hooks/scripts/optimization/read-limit.sh` - Auto-injects limit for files >1000 lines or >50KB (PreToolUse Read).

### Quality Scripts

- **Primary Code:** `plugins/hooks/scripts/quality/auto-format.sh` - Runs Prettier/Black/gofmt/rustfmt after writes (PostToolUse Write|Edit|MultiEdit).

### Logging Scripts

- **Primary Code:** `plugins/hooks/scripts/logging/auto-backup.sh` - Creates timestamped backups before writes (PreToolUse Write, async).
- **Primary Code:** `plugins/hooks/scripts/logging/mcp-logger.sh` - Logs MCP tool invocations (PreToolUse mcp\_\_.\*, async).

### Permission Scripts

- **Primary Code:** `plugins/hooks/scripts/permission/auto-approve.sh` - Auto-approves safe read-only and dev commands (PermissionRequest Bash).
- **Primary Code:** `plugins/hooks/scripts/permission/file-permission.sh` - Manages file write permissions (PermissionRequest Write|Edit).

### Other Scripts

- **Primary Code:** `plugins/hooks/scripts/evaluation/unified-eval.sh` - Enforces tool usage hierarchy (UserPromptSubmit).
- **Primary Code:** `plugins/hooks/scripts/notification/smart-notify.sh` - Smart workflow notifications (Notification).

### Configuration

- **Configuration:** `plugins/hooks/hooks/hooks.json` - Master hook registration with matchers and timeouts.
- **Related Architecture:** `/llmdoc/architecture/hooks-system.md` - Hook system architecture and execution flow.
- **External Docs:** `git-repos/everything-claude-code/schemas/hooks.schema.json` - JSON schema for hooks configuration.
