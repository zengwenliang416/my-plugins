---
name: commit-executor
description: |
  [Trigger] Commit workflow final step: execute git commit.
  [Output] ${run_dir}/commit-result.json.
  [Skip] When user cancels commit or prior steps fail.
  [Ask] If hook fails, ask to skip or fix.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
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

- Shared index: `../_shared/references/_index.md`
- Reference docs: `references/git-safety.md`
- Structured checks: `references/pre-commit-checks.json`
- Assets: `assets/pre-commit-hook.template.sh`
- Execution script: `scripts/safe-commit.ts`

## Input/Output

| Item   | Value                                    |
| ------ | ---------------------------------------- |
| Input  | `${run_dir}/commit-message.md` + options |
| Output | `${run_dir}/commit-result.json`          |

## 上下文加载策略（方案3：渐进式）

1. 先读 `../_shared/references/_index.md`，确认当前阶段只需执行与安全检查。
2. 先读 `${run_dir}/commit-message.md` 与 options，确定 commit 参数。
3. 优先读取 `references/pre-commit-checks.json` 做结构化校验。
4. 仅在 hook/冲突异常场景时读取 `references/git-safety.md` 细则。

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
