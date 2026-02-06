# How to Create a Hook

A step-by-step guide to creating and registering a new hook script in the ccg-workflows hooks system.

1. **Create the hook script** in the appropriate category directory under `plugins/hooks/scripts/`:
   - Security: `scripts/security/` - Validators that block operations
   - Optimization: `scripts/optimization/` - Pre-processors that modify inputs
   - Logging: `scripts/logging/` - Async auditors for backup/logging
   - Permission: `scripts/permission/` - Auto-approve handlers
   - Evaluation: `scripts/evaluation/` - Context injectors
   - Notification: `scripts/notification/` - Workflow event notifiers
   - Orchestration: `scripts/orchestration/` - Agent Teams coordination (TeammateIdle, TaskCompleted)

2. **Implement JSON input parsing** using jq. Every hook receives JSON via stdin:

   ```bash
   #!/bin/bash
   set -euo pipefail
   input=$(cat)
   tool_name=$(echo "$input" | jq -r '.tool_name // empty')
   file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
   ```

   Reference: `plugins/hooks/scripts/optimization/read-limit.sh:44-58`

3. **Implement hook logic** based on hook type:
   - **Blocker:** Output `{"decision": "block", "reason": "..."}` - see `scripts/security/privacy-firewall.sh:88`
   - **Modifier:** Output `updatedInput` to modify tool parameters - see `scripts/optimization/read-limit.sh:174-184`
   - **Permission:** Output `{"hookSpecificOutput": {"decision": {"behavior": "allow"}}}` - see `scripts/permission/auto-approve.sh:137-146`
   - **Pass-through:** Exit 0 with no output to allow normal execution

4. **Register in hooks.json** at `plugins/hooks/hooks/hooks.json`:

   ```json
   {
     "matcher": "ToolName|OtherTool",
     "hooks": [
       {
         "type": "command",
         "command": "${CLAUDE_PLUGIN_ROOT}/scripts/category/your-hook.sh",
         "timeout": 5,
         "async": false
       }
     ]
   }
   ```

   - `matcher`: Regex pattern (`Write|Edit`, `mcp__.*`, `*` for all)
   - `timeout`: 3-30s recommended
   - `async`: `true` for non-blocking (logging, backup)

5. **Test the hook** by invoking the target tool and checking:
   - Hook executes (check stderr logs via `echo "msg" >&2`)
   - Expected behavior occurs (block, modify, or allow)
   - Timeout does not trigger for normal operations

## Output API Reference

| API Field                | Hook Points                 | Purpose                             |
| ------------------------ | --------------------------- | ----------------------------------- |
| `updatedInput`           | PreToolUse                  | Modify tool parameters              |
| `permissionDecision`     | PreToolUse                  | `allow`/`deny` decision             |
| `additionalContext`      | PreToolUse                  | Inject context message              |
| `decision.behavior`      | PermissionRequest           | `allow` for auto-approve            |
| `orchestrationDirective` | TeammateIdle, TaskCompleted | Coordination signal for Agent Teams |

## Orchestration Hooks

TeammateIdle and TaskCompleted are lifecycle events fired during Agent Teams mode. They use wildcard matcher (`*`) and do not filter by tool name.

**Template for orchestration hooks:**

```bash
#!/bin/bash
# Hook: your-orchestration-hook
# Lifecycle: TeammateIdle | TaskCompleted
# Description: What this hook does
set -euo pipefail

input=$(cat)

# Validate JSON input
if ! echo "$input" | jq empty 2>/dev/null; then
  echo '{}'
  exit 0
fi

hook_event=$(echo "$input" | jq -r '.hook_event_name // empty')

# Your orchestration logic here

# Output with orchestration directive
echo "{\"hookSpecificOutput\": {\"orchestrationDirective\": \"continue\", \"metrics\": {}}}"
```

**Key differences from PreToolUse hooks:**

- Matcher is always `*` (no tool-specific filtering)
- Input payload contains `hook_event_name` instead of `tool_name` (field names are best-effort; schemas may evolve)
- Output uses `orchestrationDirective` field for coordination signals
