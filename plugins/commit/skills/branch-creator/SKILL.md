---
name: branch-creator
description: |
  【Trigger】Commit workflow Phase 3.5: create feature branch.
  【Output】${run_dir}/branch-info.json + new branch
  【Ask】If on feature branch, ask to reuse or create new.
allowed-tools:
  [
    Bash,
    Read,
    Write,
    AskUserQuestion,
    mcp__sequential-thinking__sequentialthinking,
  ]
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory (contains changes-analysis.json)
  - name: branch_name
    type: string
    required: false
    description: Custom branch name (auto-generated if omitted)
  - name: skip_branch
    type: boolean
    required: false
    description: Skip branch creation
---

# Branch Creator

## Input/Output

| Item   | Value                                                     |
| ------ | --------------------------------------------------------- |
| Input  | `${run_dir}/changes-analysis.json` + optional branch_name |
| Output | `${run_dir}/branch-info.json` + new branch                |

## Naming Convention

Format: `<type>/<scope>-<description>`

| Type | Scope  | Branch                     |
| ---- | ------ | -------------------------- |
| feat | auth   | `feat/auth-add-login`      |
| fix  | button | `fix/button-style-issue`   |
| docs | readme | `docs/readme-update-guide` |

Rules: lowercase, hyphens, max 50 chars, alphanumeric only

## Execution

### 1. Check current branch

```bash
git branch --show-current
```

| Current             | Action                                   |
| ------------------- | ---------------------------------------- |
| main/master/develop | Create new branch                        |
| Feature branch      | Ask: reuse / create new / switch to main |
| Detached HEAD       | Error                                    |

### 2. Read analysis

From changes-analysis.json: primary_type, primary_scope, summary

### 3. Generate name

If no custom name: `${type}/${scope}-${keywords}`

### 4. Check conflicts

```bash
git show-ref --verify --quiet refs/heads/${name}
```

If exists → Ask: switch / rename (-v2) / delete / cancel

### 5. Create branch

```bash
git checkout -b ${branch_name}
```

### 6. Write branch-info.json

```json
{
  "previous_branch": "main",
  "new_branch": "feat/auth-add-login",
  "branch_type": "created|switched|reused",
  "status": "success"
}
```

## Return

```
🌿 Branch: ${new_branch}
Previous: ${previous} | Type: ${type} | Scope: ${scope}
Output: ${run_dir}/branch-info.json
```
