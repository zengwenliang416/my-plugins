# Git Safety Reference

Git commit safety checklist and error handling guide.

---

## 1. Safety checklist

### 1.1 Pre-commit checks

| Check | Description | Severity |
|-------|-------------|----------|
| Sensitive files | Check .env, credentials, keys | 🔴 Critical |
| Large files | Check files >10MB | 🟡 Warning |
| Binary files | Check unexpected binary files | 🟡 Warning |
| Merge conflict markers | Check `<<<<<<<` etc. | 🔴 Critical |
| TODO/FIXME | Check unfinished markers | 🟢 Info |
| Console.log | Check debug code | 🟡 Warning |

### 1.2 Sensitive file patterns

```
# Must never commit
.env
.env.*
*.pem
*.key
*_rsa
credentials.json
secrets.yaml
.aws/credentials
.gcloud/
*.p12
*.pfx

# Should warn
config.local.*
*.local.json
*secret*
*password*
*token*
```

---

## 2. Pre-commit hook handling

### 2.1 Common hook types

| Hook | Purpose | Failure handling |
|------|---------|------------------|
| `pre-commit` | Code checks | Fix issues or skip |
| `commit-msg` | Message format validation | Adjust message format |
| `prepare-commit-msg` | Message template | Usually does not fail |

### 2.2 Hook failure handling flow

```
Hook failed
    ↓
Analyze error type
    ↓
┌─────────────────┬──────────────────┐
│ Lint errors     │ Format errors     │
│                 │                  │
│ → Auto-fix      │ → Adjust message  │
│   npm run lint  │                  │
│   --fix         │                  │
└─────────────────┴──────────────────┘
    ↓
Retry commit
    ↓
Still failing? → Ask user whether to skip
```

### 2.3 Skip hook options

```bash
# Skip all hooks
git commit --no-verify

# Skip a specific hook (requires custom config)
SKIP=eslint git commit
```

**Warning**: Skipping hooks should be the last resort and requires explicit user confirmation.

---

## 3. Error handling

### 3.1 Common errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `nothing to commit` | Staging area is empty | Run `git add` first |
| `Changes not staged` | There are unstaged changes | Stage or ignore |
| `commit message empty` | Message is empty | Provide a valid message |
| `hook failed` | Pre-commit failed | Fix issues or skip |
| `detached HEAD` | Not on a branch | Create or switch branch |
| `merge conflict` | Conflicts exist | Resolve conflicts then commit |

### 3.2 Exit code mapping

| Exit code | Meaning |
|-----------|---------|
| 0 | Success |
| 1 | General error |
| 128 | Git repository error |

---

## 4. Commit strategy

### 4.1 Atomic commit principle

```
✅ Good commits
- One commit solves one problem
- Code compiles and runs after the commit
- Commit message is clear

❌ Bad commits
- One commit includes multiple unrelated changes
- Code fails to compile after the commit
- Message is vague like "fix bugs"
```

### 4.2 Commit frequency

```
Recommended: small and frequent commits
- Commit after each small feature
- Easier to review
- Easier to roll back

Avoid: large and infrequent commits
- Days of work merged into one commit
- Hard to review
- Expensive to roll back
```

---

## 5. Dangerous operations warning

### 5.1 Forbidden operations

| Operation | Risk | Alternative |
|-----------|------|-------------|
| `--amend` after push | Rewrites history | Create a new commit |
| `push --force` | Overwrites remote | Use `--force-with-lease` |
| `reset --hard` | Data loss | Use `stash` or `reset --soft` |
| `rebase` on shared branch | Breaks history | Use merge |

### 5.2 Operations requiring confirmation

```
⚠️ The following operations require explicit user confirmation:

1. --amend: modify the latest commit
2. --no-verify: skip pre-commit hooks
3. Push to protected branch (main/master)
4. Commit includes sensitive files
5. Commit includes large files (>10MB)
```

---

## 6. Commit result format

### 6.1 Success result

```json
{
  "status": "success",
  "commit_hash": "abc1234",
  "branch": "main",
  "message_title": "feat(auth): add JWT authentication",
  "files_committed": 3,
  "insertions": 150,
  "deletions": 20
}
```

### 6.2 Failure result

```json
{
  "status": "failed",
  "error_type": "hook_failed",
  "error_message": "eslint: 3 errors found",
  "recoverable": true,
  "suggestions": [
    "Run 'npm run lint:fix' to auto-fix",
    "Use --no-verify to skip hooks"
  ]
}
```
