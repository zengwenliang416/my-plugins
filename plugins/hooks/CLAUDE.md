# Hooks Plugin - CLAUDE.md Example

Add the following to your project's `.claude/CLAUDE.md` for optimal Hooks integration.

## Recommended Configuration

```markdown
<system-reminder>

<available-hooks>

| Hook               | Lifecycle        | Description                        |
| ------------------ | ---------------- | ---------------------------------- |
| intent-evaluator   | UserPromptSubmit | 意图评估，强制工具优先级           |
| unified-eval       | UserPromptSubmit | 智能插件路由系统                   |
| privacy-firewall   | PreToolUse       | 敏感信息检测，阻止泄露             |
| db-guard           | PreToolUse       | 危险 SQL 检测，阻止破坏性操作      |
| git-conflict-guard | PreToolUse       | Git 冲突标记检测，阻止提交冲突代码 |
| auto-format        | PostToolUse      | 代码自动格式化（写入后）           |
| mcp-logger         | PostToolUse      | MCP 调用日志记录                   |

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

| Category | Hooks                                          | Purpose      |
| -------- | ---------------------------------------------- | ------------ |
| Security | privacy-firewall, db-guard, git-conflict-guard | 阻止危险操作 |
| Quality  | auto-format                                    | 代码质量保障 |
| Logging  | mcp-logger                                     | 调试和审计   |
| Routing  | intent-evaluator, unified-eval                 | 智能意图路由 |

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
# Lifecycle: PreToolUse | PostToolUse | UserPromptSubmit
# Description: What this hook does

# Read input from stdin
INPUT=$(cat)

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
