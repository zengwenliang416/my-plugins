# Hook Scripts Reference

## 1. Core Summary

The hooks plugin provides 14 shell scripts executed at 7 lifecycle points. Scripts receive JSON via stdin and output JSON responses. Organized into 8 categories: security (4), optimization (1), quality (1), logging (2), permission (2), evaluation (1), notification (1), orchestration (2).

## 2. Source of Truth

- **Configuration:** `plugins/hooks/hooks/hooks.json` - Master registry with matchers, timeouts, async flags.
- **Plugin Metadata:** `plugins/hooks/.claude-plugin/plugin.json` - Plugin definition.
- **Related Architecture:** `/llmdoc/architecture/hooks-system.md` - Lifecycle points, JSON protocol.

## 3. Hook Scripts by Category

### Security (UserPromptSubmit, PreToolUse)

| Script                                   | Hook Point       | Matcher     | Timeout | Key Feature                                                |
| ---------------------------------------- | ---------------- | ----------- | ------- | ---------------------------------------------------------- |
| `scripts/security/privacy-firewall.sh`   | UserPromptSubmit | `*`         | 3s      | Detects 9 sensitive patterns (API keys, SSN, credit cards) |
| `scripts/security/db-guard.sh`           | PreToolUse       | `Bash`      | 3s      | Blocks DROP, TRUNCATE, unsafe DELETE                       |
| `scripts/security/git-conflict-guard.sh` | PreToolUse       | `Bash`      | 5s      | Blocks commits with unresolved conflict markers            |
| `scripts/security/killshell-guard.sh`    | PreToolUse       | `KillShell` | 5s      | Protects codeagent-wrapper via task registry               |

### Optimization (PreToolUse)

| Script                               | Hook Point | Matcher | Timeout | Key Feature                                                                                   |
| ------------------------------------ | ---------- | ------- | ------- | --------------------------------------------------------------------------------------------- |
| `scripts/optimization/read-limit.sh` | PreToolUse | `Read`  | 5s      | Auto-injects limit for files >1000 lines or >50KB. Configurable via `CC_READ_LINES_THRESHOLD` |

### Quality (PostToolUse)

| Script                           | Hook Point  | Matcher                  | Timeout | Key Feature                          |
| -------------------------------- | ----------- | ------------------------ | ------- | ------------------------------------ |
| `scripts/quality/auto-format.sh` | PostToolUse | `Write\|Edit\|MultiEdit` | 30s     | Runs Prettier, Black, gofmt, rustfmt |

### Logging (PreToolUse, async)

| Script                           | Hook Point | Matcher   | Timeout | Key Feature                                   |
| -------------------------------- | ---------- | --------- | ------- | --------------------------------------------- |
| `scripts/logging/auto-backup.sh` | PreToolUse | `Write`   | 10s     | Timestamped backups, 7-day retention, max 500 |
| `scripts/logging/mcp-logger.sh`  | PreToolUse | `mcp__.*` | 5s      | Logs MCP calls with parameter filtering       |

### Permission (PermissionRequest)

| Script                                  | Hook Point        | Matcher       | Timeout | Key Feature                                   |
| --------------------------------------- | ----------------- | ------------- | ------- | --------------------------------------------- |
| `scripts/permission/auto-approve.sh`    | PermissionRequest | `Bash`        | 3s      | Auto-approves safe read-only and dev commands |
| `scripts/permission/file-permission.sh` | PermissionRequest | `Write\|Edit` | 3s      | Manages file write permissions                |

### Evaluation (UserPromptSubmit)

| Script                               | Hook Point       | Matcher | Timeout | Key Feature                                                           |
| ------------------------------------ | ---------------- | ------- | ------- | --------------------------------------------------------------------- |
| `scripts/evaluation/unified-eval.sh` | UserPromptSubmit | `*`     | 10s     | Smart plugin router, enforces tool priority (auggie-mcp > LSP > Grep) |

### Notification (Notification)

| Script                                 | Hook Point   | Matcher | Timeout | Key Feature                  |
| -------------------------------------- | ------------ | ------- | ------- | ---------------------------- |
| `scripts/notification/smart-notify.sh` | Notification | `*`     | 5s      | Workflow event notifications |

### Orchestration (TeammateIdle, TaskCompleted)

| Script                                    | Hook Point    | Matcher | Timeout | Key Feature                                       |
| ----------------------------------------- | ------------- | ------- | ------- | ------------------------------------------------- |
| `scripts/orchestration/teammate-idle.sh`  | TeammateIdle  | `*`     | 5s      | Logs idle events, outputs orchestration directive |
| `scripts/orchestration/task-completed.sh` | TaskCompleted | `*`     | 5s      | Logs task completion, outputs metrics             |
