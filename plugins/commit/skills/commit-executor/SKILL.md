---
name: commit-executor
description: |
  【触发条件】Commit workflow final step: execute git commit.
  【核心产出】${run_dir}/commit-result.json
  【不触发】用户取消提交或前置步骤失败时
  【先问什么】If hook fails, ask to skip or fix.
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory (contains commit-message.md)
  - name: options
    type: string
    required: false
    description: 'JSON options: {"no_verify": true, "amend": false}'
---

# Commit Executor

## Script Entry

```bash
npx tsx scripts/safe-commit.ts [args]
```

## Resource Usage

- Reference docs: `references/git-safety.md`
- Assets: `assets/pre-commit-hook.template.sh`
- Execution script: `scripts/safe-commit.ts`

## Input/Output

| Item   | Value                                    |
| ------ | ---------------------------------------- |
| Input  | `${run_dir}/commit-message.md` + options |
| Output | `${run_dir}/commit-result.json`          |

## Options

| Option    | Default | Description       |
| --------- | ------- | ----------------- |
| no_verify | false   | Skip hooks        |
| amend     | false   | Amend last commit |
| signoff   | false   | Add Signed-off-by |
| dry_run   | false   | Simulate only     |

## Execution

### 1. Read commit-message.md

Extract: Title, Body, Footer

### 2. Verify staging

```bash
git diff --cached --quiet
```

Error if no staged changes (except amend)

### 3. Execute commit

```bash
git commit -m "$(cat <<'EOF'
feat(components): ✨ 新增 Button 组件

新增可复用的 Button 组件。

变更文件:
- src/components/Button.tsx: 组件实现

Closes #123
EOF
)"
```

Add flags: `--no-verify`, `--amend`, `--signoff` as needed

### 4. Collect results

```bash
git rev-parse HEAD
git rev-parse --short HEAD
git branch --show-current
git show --stat --oneline HEAD
```

### 5. Write commit-result.json

```json
{
  "success": true,
  "commit_hash": "abc123...",
  "commit_hash_short": "abc123d",
  "commit_message_title": "feat(components): ✨ 新增 Button 组件",
  "branch": "feature/button",
  "files_committed": 2,
  "insertions": 80,
  "deletions": 0
}
```

## Errors

| Error       | Handling                          |
| ----------- | --------------------------------- |
| No staged   | Error (except amend)              |
| Hook failed | Record error, suggest --no-verify |
| Conflicts   | Error, instruct to resolve        |

## Return

```
✅ Commit succeeded!
📝 ${title} | 📦 ${hash} | 🔀 ${branch} | 📊 ${files} files
Output: ${run_dir}/commit-result.json
```
