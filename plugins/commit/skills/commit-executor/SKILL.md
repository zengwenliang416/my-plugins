---
name: commit-executor
description: |
  【Trigger】Final step of the commit workflow: execute git commit.
  【Core Output】Write ${run_dir}/commit-result.json with commit hash and result.
  【Not Triggered】Generate message (use message-generator), analyze changes (use change-analyzer).
  【Ask First】If a pre-commit hook fails, ask whether to skip the hook or fix the issue.
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory path (contains commit-message.md)
  - name: options
    type: string
    required: false
    description: Git commit options JSON (e.g. '{"no_verify": true, "amend": false}')
---

# Commit Executor - Atomic Commit Execution Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                  | Trigger        |
| --------------------- | ---------------------------------------- | -------------- |
| `sequential-thinking` | Structure commit execution strategy and ensure safety | 🚨 Required every run |

## Execution Flow

### Step 0: Structured Execution Plan (sequential-thinking)

🚨 **You must first use sequential-thinking to plan the execution strategy.**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan the commit execution strategy. Need: 1) read commit message 2) parse options 3) verify staging area 4) build and execute command 5) collect results and write",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking steps**:

1. **Read commit message**: extract title, body, footer from commit-message.md
2. **Parse options**: handle no_verify, amend, signoff, dry_run
3. **Verify staging area**: check for staged changes (except amend)
4. **Execute command**: build HEREDOC command and run git commit
5. **Collect results**: fetch commit hash, write commit-result.json

---

## Responsibility Boundaries

- **Input**: `run_dir` (contains `commit-message.md`) + `options`
- **Output**: `${run_dir}/commit-result.json`
- **Single responsibility**: only execute git commit; no analysis, no message generation

---

## Execution Flow

### Step 1: Read commit message

Read `${run_dir}/commit-message.md` and extract:

- Title (content under `## Title`)
- Body (content under `## Body`)
- Footer (content under `## Footer`, if any)

### Step 2: Parse options

Parse from `options` (if provided):

| Option      | Description         | Default |
| ----------- | ------------------- | ------- |
| `no_verify` | Skip git hooks      | false   |
| `amend`     | Amend last commit   | false   |
| `signoff`   | Add Signed-off-by   | false   |
| `dry_run`   | Dry run only        | false   |

### Step 3: Verify staging area

```bash
# Check for staged changes (except amend)
git diff --cached --quiet
```

If there are no staged changes and it is not amend mode, error out.

### Step 4: Build commit command

Build the git commit command:

```bash
git commit \
  -m "Title" \
  -m "Body" \
  ${no_verify:+--no-verify} \
  ${amend:+--amend} \
  ${signoff:+--signoff}
```

**Important**: use HEREDOC to pass multi-line message:

```bash
git commit -m "$(cat <<'EOF'
feat(components): ✨ 新增 Button 组件

新增可复用的 Button 组件，支持多种样式和尺寸。

变更文件:
- src/components/Button.tsx: 组件实现

Closes #123
EOF
)"
```

### Step 5: Execute commit

Run the git commit command.

**If dry_run=true**:

- Do not perform the actual commit
- Output simulated results

### Step 6: Collect results

After a successful commit, collect:

```bash
# Get commit hash
git rev-parse HEAD

# Get short hash
git rev-parse --short HEAD

# Get current branch
git branch --show-current

# Get change stats
git show --stat --oneline HEAD
```

### Step 7: Write results

Use the Write tool to write `${run_dir}/commit-result.json`:

**Success example**:

```json
{
  "success": true,
  "commit_hash": "abc123def456...",
  "commit_hash_short": "abc123d",
  "commit_message_title": "feat(components): ✨ 新增 Button 组件",
  "committed_at": "2026-01-16T10:30:00Z",
  "branch": "feature/button",
  "files_committed": 2,
  "insertions": 80,
  "deletions": 0
}
```

**Failure example**:

```json
{
  "success": false,
  "error": "hook_failed",
  "error_message": "pre-commit hook returned non-zero exit code",
  "hook_output": "ESLint found 3 errors...",
  "suggestion": "Use --no-verify to skip hooks, or fix errors and retry"
}
```

---

## Error Handling

| Error type     | Handling                                  |
| -------------- | ----------------------------------------- |
| Not a Git repo | Error out                                 |
| No staged changes | Error out (except amend)              |
| Hook failure   | Record error; suggest --no-verify         |
| Conflicts      | Error out; instruct to resolve conflicts  |

---

## Return Value

After execution, return:

**Success**:

```
✅ Commit succeeded!

📝 Message: ${commit_message_title}
📦 Hash: ${commit_hash_short}
🔀 Branch: ${branch}
📊 Changes: ${files_committed} files, +${insertions}/-${deletions} lines

Output: ${run_dir}/commit-result.json
```

**Failure**:

```
❌ Commit failed

Error: ${error_message}
Suggestion: ${suggestion}

Output: ${run_dir}/commit-result.json
```

---

## Constraints

- Do not analyze changes (handled by change-analyzer)
- Do not generate commit messages (handled by message-generator)
- Use HEREDOC for multi-line messages to ensure correct format
- Do not use interactive options like `-i`
- Do not run `git push` (user decides)
