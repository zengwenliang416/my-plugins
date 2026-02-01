# Hooks System Architecture

## 1. Identity

- **What it is:** A lifecycle interception system that executes custom scripts at defined points during Claude Code operations.
- **Purpose:** Provides extensible automation for security enforcement, optimization, logging, and permission management.

## 2. Core Components

- `plugins/hooks/hooks/hooks.json` (`hooks`): Master configuration defining all hook points, matchers, and command bindings.
- `plugins/hooks/scripts/security/*.sh` (`privacy-firewall`, `db-guard`, `killshell-guard`): Security validators blocking sensitive data and dangerous operations.
- `plugins/hooks/scripts/optimization/read-limit.sh` (`updatedInput`): Pre-processor injecting limits for large file reads.
- `plugins/hooks/scripts/quality/auto-format.sh`: Post-processor running formatters after file modifications.
- `plugins/hooks/scripts/permission/*.sh` (`auto-approve`, `file-permission`): Permission decision handlers.
- `plugins/hooks/scripts/logging/*.sh` (`auto-backup`, `mcp-logger`): Async auditors for backup and logging.

## 3. Execution Flow (LLM Retrieval Map)

### Hook Points (5 total)

| Hook Point            | Trigger                   | Primary Use Cases                        |
| --------------------- | ------------------------- | ---------------------------------------- |
| **UserPromptSubmit**  | Before prompt sent to LLM | Privacy filtering, intent evaluation     |
| **PreToolUse**        | Before tool execution     | Validation, parameter injection, logging |
| **PostToolUse**       | After tool execution      | Auto-formatting, checks                  |
| **PermissionRequest** | Permission prompt shown   | Auto-approve safe commands               |
| **Notification**      | Workflow events           | Smart notifications                      |

### Execution Order

- **1. UserPromptSubmit:** `privacy-firewall.sh` -> `unified-eval.sh` (sequential, matcher: `*`)
- **2. PreToolUse:** Matcher-specific hooks (Read -> `read-limit.sh`, Bash -> `db-guard.sh`, Write -> `auto-backup.sh` async)
- **3. PostToolUse:** `auto-format.sh` (matcher: `Write|Edit|MultiEdit`)
- **4. PermissionRequest:** `auto-approve.sh` (Bash), `file-permission.sh` (Write|Edit)
- **5. Notification:** `smart-notify.sh` (matcher: `*`)

### Hook Type Classification

| Type                    | Purpose                 | Example                                       |
| ----------------------- | ----------------------- | --------------------------------------------- |
| **Validators**          | Block unsafe operations | `privacy-firewall.sh`, `db-guard.sh`          |
| **Pre-processors**      | Modify tool inputs      | `read-limit.sh` (uses `updatedInput`)         |
| **Post-processors**     | Process tool outputs    | `auto-format.sh`                              |
| **Permission Handlers** | Auto-approve/deny       | `auto-approve.sh` (uses `permissionDecision`) |
| **Auditors**            | Async logging/backup    | `auto-backup.sh`, `mcp-logger.sh`             |

## 4. Design Rationale

- **Multi-layered defense:** Security hooks at prompt level (privacy), command level (db-guard), and shell level (killshell).
- **Non-blocking async:** Backup and logging hooks run with `async: true` to avoid blocking tool execution.
- **Matcher patterns:** Regex-based matchers (`Write|Edit|MultiEdit`, `mcp__.*`) enable precise hook targeting.
- **Timeout enforcement:** All hooks have configurable timeouts (default 3-30s) to prevent blocking.
