# How to Create a Hook

A step-by-step guide for implementing custom hooks in the Claude Code plugin system.

1. **Create the hook script** in `plugins/hooks/scripts/<category>/<name>.sh`. The script receives JSON via stdin containing `tool_name`, `tool_input`, and `tool_use_id`. Reference: `plugins/hooks/scripts/optimization/read-limit.sh:44-58`.

2. **Parse input with jq** to extract required fields:

   ```bash
   input=$(cat)
   tool_name=$(echo "$input" | jq -r '.tool_name // empty')
   file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
   ```

3. **Implement hook logic** based on hook type:
   - **Validator:** Check conditions, output `{"decision": "block", "reason": "..."}` to block.
   - **Pre-processor:** Output `hookSpecificOutput.updatedInput` to modify tool parameters.
   - **Permission handler:** Output `hookSpecificOutput.decision.behavior` as `allow` or `deny`.

4. **Output the appropriate response** using `hookSpecificOutput` structure:

   ```bash
   cat <<EOF
   {
     "hookSpecificOutput": {
       "hookEventName": "PreToolUse",
       "permissionDecision": "allow",
       "updatedInput": {"file_path": "$path", "limit": 500},
       "additionalContext": "Context message for Claude"
     }
   }
   EOF
   ```

5. **Register in hooks.json** at `plugins/hooks/hooks/hooks.json`:

   ```json
   {
     "PreToolUse": [
       {
         "matcher": "Read",
         "hooks": [
           {
             "type": "command",
             "command": "${CLAUDE_PLUGIN_ROOT}/scripts/your-hook.sh",
             "timeout": 5
           }
         ]
       }
     ]
   }
   ```

6. **Test the hook** by triggering the matched tool. Verify logs in stderr (use `echo "message" >&2`) and check that the expected behavior occurs.

## Available Output APIs

| API Field            | Hook Points                   | Purpose                                 |
| -------------------- | ----------------------------- | --------------------------------------- |
| `updatedInput`       | PreToolUse                    | Modify tool parameters before execution |
| `permissionDecision` | PreToolUse, PermissionRequest | `allow`/`deny` decision                 |
| `additionalContext`  | PreToolUse                    | Inject context message to Claude        |
| `decision.behavior`  | PermissionRequest             | `allow` for auto-approve                |
