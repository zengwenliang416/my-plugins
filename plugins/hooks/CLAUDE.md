# Hooks Plugin - CLAUDE.md Example

Add the following to your project's `.claude/CLAUDE.md` for optimal Hooks integration.

## Recommended Configuration

```markdown
<system-reminder>

<available-hooks>

| Hook               | Lifecycle         | Description                        |
| ------------------ | ----------------- | ---------------------------------- |
| privacy-firewall   | UserPromptSubmit  | 敏感信息检测，阻止泄露             |
| unified-eval       | UserPromptSubmit  | 智能插件路由系统                   |
| read-limit         | PreToolUse        | 大文件自动注入 limit 参数          |
| db-guard           | PreToolUse        | 危险 SQL 检测，阻止破坏性操作      |
| git-conflict-guard | PreToolUse        | Git 冲突标记检测，阻止提交冲突代码 |
| auto-backup        | PreToolUse        | 写入前自动备份（异步）             |
| mcp-logger         | PreToolUse        | MCP 调用日志记录（异步）           |
| auto-format        | PostToolUse       | 代码自动格式化（写入后）           |
| auto-approve       | PermissionRequest | 安全命令自动审批                   |
| file-permission    | PermissionRequest | 文件写入权限管理                   |
| smart-notify       | Notification      | 工作流事件通知                     |
| teammate-idle      | TeammateIdle      | Agent Teams 空闲事件协调           |
| task-completed     | TaskCompleted     | Agent Teams 任务完成事件协调       |

</available-hooks>

</system-reminder>
```

## Git Conflict Guard

The `git-conflict-guard` hook automatically detects conflict markers before `git commit`:

### What It Detects

- `<<<<<<<` - Conflict start marker
- `=======` - Conflict separator
- `>>>>>>>` - Conflict end marker

### Behavior

- **On detection**: Returns `permissionDecision: deny` to block the commit
- **No conflicts**: Returns success message and allows commit
- **Non-commit commands**: Passes through without checking

### Example Output

**Blocked:**

```json
{
  "hookSpecificOutput": {
    "permissionDecision": "deny",
    "permissionDecisionReason": "❌ Conflict markers detected in staged files. Please resolve conflicts before committing."
  }
}
```

**Allowed:**

```json
{
  "hookSpecificOutput": {
    "message": "✅ No conflict markers detected"
  }
}
```

## Hook Categories

| Category      | Hooks                                          | Purpose          |
| ------------- | ---------------------------------------------- | ---------------- |
| Security      | privacy-firewall, db-guard, git-conflict-guard | 阻止危险操作     |
| Optimization  | read-limit                                     | 输入预处理优化   |
| Quality       | auto-format                                    | 代码质量保障     |
| Logging       | auto-backup, mcp-logger                        | 调试和审计       |
| Permission    | auto-approve, file-permission                  | 权限自动化       |
| Evaluation    | unified-eval                                   | 智能插件路由     |
| Notification  | smart-notify                                   | 工作流事件通知   |
| Orchestration | teammate-idle, task-completed                  | Agent Teams 协调 |

## Agent Teams Integration

The orchestration hooks (`teammate-idle`, `task-completed`) fire automatically during Agent Teams mode when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set. They provide structured logging and orchestration directives for team coordination. These hooks are passive observers and do not block execution.

## Customization

### Adding Custom Hooks

1. Create script in `plugins/hooks/scripts/<category>/`
2. Register in `plugins/hooks/hooks/hooks.json`

Example registration:

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "${CLAUDE_PLUGIN_ROOT}/scripts/security/your-hook.sh",
      "timeout": 5
    }
  ]
}
```

### Hook Script Template

```bash
#!/bin/bash
# Hook: your-hook-name
# Lifecycle: PreToolUse | PostToolUse | UserPromptSubmit | PermissionRequest | Notification | TeammateIdle | TaskCompleted
# Description: What this hook does
set -euo pipefail

# Read and validate input
INPUT=$(cat)
if ! echo "$INPUT" | jq empty 2>/dev/null; then
  echo '{}'
  exit 0
fi

# Parse tool input (for PreToolUse/PostToolUse)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Your logic here
if [[ "$COMMAND" =~ dangerous_pattern ]]; then
  echo '{"hookSpecificOutput": {"permissionDecision": "deny", "permissionDecisionReason": "Blocked by your-hook"}}'
  exit 0
fi

# Pass through
echo '{}'
```
