# Hooks System Architecture

## 1. Identity

- **What it is:** A lifecycle interception system that executes shell scripts at 7 hook points during Claude Code's tool execution flow.
- **Purpose:** Provides cross-cutting automation for security, optimization, logging, and evaluation without modifying core tool behavior.

## 2. Core Components

- `plugins/hooks/hooks/hooks.json:1-152` (Master Configuration): Defines all 14 hooks across 7 lifecycle events with trigger points, matchers, timeouts, and async flags. Uses `${CLAUDE_PLUGIN_ROOT}` for portable paths.
- `plugins/hooks/scripts/security/privacy-firewall.sh:36-72` (`pattern_regexes`): Detects 9 types of sensitive data via regex patterns.
- `plugins/hooks/scripts/security/killshell-guard.sh:39-54` (`TASK_REGISTRY`): Protects codeagent-wrapper processes via task registry lookup.
- `plugins/hooks/scripts/optimization/read-limit.sh:153-184` (`updatedInput`): Auto-injects limit parameter for large files.
- `plugins/hooks/scripts/evaluation/unified-eval.sh:19-82` (`collect_plugin_catalog`): Dynamically collects enabled plugin metadata for routing.
- `plugins/hooks/scripts/logging/auto-backup.sh:51-79`: Implements cleanup strategies (7-day retention, max 500 backups).

## 3. Hook Lifecycle Points

| Hook Point          | Trigger                 | Scripts                                                                                              | Async              |
| ------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------ |
| `UserPromptSubmit`  | Before prompt to LLM    | privacy-firewall.sh (3s), unified-eval.sh (10s)                                                      | No                 |
| `PreToolUse`        | Before tool execution   | read-limit.sh, db-guard.sh, git-conflict-guard.sh, killshell-guard.sh, auto-backup.sh, mcp-logger.sh | backup/logger: Yes |
| `PostToolUse`       | After tool execution    | auto-format.sh (30s)                                                                                 | No                 |
| `PermissionRequest` | Permission prompt shown | auto-approve.sh (3s), file-permission.sh (3s)                                                        | No                 |
| `Notification`      | Workflow events         | smart-notify.sh (5s)                                                                                 | No                 |
| `TeammateIdle`      | Agent idle in team mode | teammate-idle.sh (5s)                                                                                | No                 |
| `TaskCompleted`     | Agent task completed    | task-completed.sh (5s)                                                                               | No                 |

## 4. Execution Flow (LLM Retrieval Map)

- **1. Registration:** Claude Code loads `plugins/hooks/hooks/hooks.json` at startup.
- **2. Matcher Evaluation:** Regex patterns (`Write|Edit|MultiEdit`, `mcp__.*`, `*`) evaluated against tool name.
- **3. Script Execution:** JSON passed via stdin with `tool_name`, `tool_input`, and context.
- **4. Response Processing:** Hook outputs JSON to stdout with `hookSpecificOutput` structure.
- **5. Timeout Enforcement:** Configurable 3-30s per hook. Exceeding kills the script.

## 5. JSON Protocol

**Input (stdin):**

```json
{ "tool_name": "Read", "tool_input": { "file_path": "/path" }, "prompt": "..." }
```

**Output Types:**

- **Block:** `{"decision": "block", "reason": "..."}` - `privacy-firewall.sh:88`
- **Allow + Modify:** `{"hookSpecificOutput": {"updatedInput": {...}, "additionalContext": "..."}}` - `read-limit.sh:174-184`
- **Permission:** `{"hookSpecificOutput": {"decision": {"behavior": "allow"}}}` - `auto-approve.sh:137-146`
- **Pass-through:** Exit 0 with no output

## 6. Async vs Sync Execution

- **Sync (default):** Block tool execution until complete. Used for guards and modifiers.
- **Async (`async: true`):** Run in background. Used for `auto-backup.sh` and `mcp-logger.sh` to avoid blocking writes and MCP calls.

## 7. Design Rationale

- **Multi-layered defense:** Security at prompt level (privacy-firewall), command level (db-guard), shell level (killshell-guard).
- **Matcher patterns:** Fine-grained tool targeting via regex prevents unnecessary hook execution.
- **Environment config:** `CC_READ_LINES_THRESHOLD`, `CC_READ_MAX_LINES` for user customization without code changes.
