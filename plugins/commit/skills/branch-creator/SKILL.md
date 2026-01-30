---
name: branch-creator
description: |
  【Trigger】Commit workflow Phase 3.5: create a feature branch before committing.
  【Core Output】Create and checkout a new branch; write ${run_dir}/branch-info.json.
  【Not Triggered】Analyze changes (use change-analyzer), execute commit (use commit-executor).
  【Ask First】If already on a feature branch, ask whether to create a new one or use the current one.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory path (contains changes-analysis.json)
  - name: branch_name
    type: string
    required: false
    description: Custom branch name (optional, auto-generated if not provided)
  - name: skip_branch
    type: boolean
    required: false
    description: Skip branch creation (use current branch)
---

# Branch Creator - Atomic Branch Creation Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                            | Trigger            |
| --------------------- | -------------------------------------------------- | ------------------ |
| `sequential-thinking` | Structure branch naming strategy and ensure safety | Required every run |

## Execution Flow

### Step 0: Structured Branch Plan (sequential-thinking)

Use sequential-thinking to plan the branch creation strategy.

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan branch creation strategy. Need: 1) check current branch status 2) read changes-analysis.json 3) generate branch name 4) handle conflicts 5) create and checkout branch",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking steps**:

1. **Check current branch**: determine if on main/master or already on a feature branch
2. **Read analysis**: extract type and scope from changes-analysis.json
3. **Generate name**: build branch name following naming convention
4. **Handle conflicts**: check if branch already exists
5. **Create branch**: execute git checkout -b

---

## Responsibility Boundaries

- **Input**: `run_dir` (contains `changes-analysis.json`) + optional `branch_name`
- **Output**: `${run_dir}/branch-info.json` + new branch created
- **Single responsibility**: only create branch; no analysis, no commit execution

---

## Execution Flow

### Step 1: Check current branch status

```bash
# Get current branch name
git branch --show-current

# Check if on main/master/develop
git symbolic-ref --short HEAD
```

**Decision logic**:

| Current branch                           | Action                               |
| ---------------------------------------- | ------------------------------------ |
| `main`, `master`, `develop`              | Proceed to create new branch         |
| Feature branch (e.g., `feat/*`, `fix/*`) | Ask user: create new or use current? |
| Detached HEAD                            | Error: must be on a branch           |

**If already on feature branch**, use AskUserQuestion:

```
Current branch: ${current_branch}

Options:
1. Use current branch (continue with existing branch)
2. Create new branch (will be based on current branch)
3. Switch to main first (create branch from main)
```

### Step 2: Read changes analysis

Read `${run_dir}/changes-analysis.json` and extract:

- `primary_type`: feat, fix, docs, refactor, etc.
- `primary_scope`: auth, api, utils, etc.
- `semantic_analysis.summary`: brief description

### Step 3: Generate branch name

**Naming convention**:

```
<type>/<scope>-<description>
```

**Examples**:

| Type     | Scope  | Description      | Branch name                     |
| -------- | ------ | ---------------- | ------------------------------- |
| feat     | auth   | add login        | `feat/auth-add-login`           |
| fix      | button | style issue      | `fix/button-style-issue`        |
| docs     | readme | update guide     | `docs/readme-update-guide`      |
| refactor | api    | cleanup handlers | `refactor/api-cleanup-handlers` |

**Name generation rules**:

1. Convert type to lowercase
2. Convert scope to lowercase, replace spaces with hyphens
3. Extract 2-4 keywords from summary
4. Join with hyphens, max 50 characters total
5. Remove special characters, keep alphanumeric and hyphens only

**If `branch_name` argument provided**, use it directly (after sanitization).

### Step 4: Check for conflicts

```bash
# Check if branch already exists locally
git show-ref --verify --quiet refs/heads/${branch_name}

# Check if branch exists on remote
git ls-remote --heads origin ${branch_name}
```

**If branch exists**, use AskUserQuestion:

```
Branch "${branch_name}" already exists.

Options:
1. Switch to existing branch
2. Generate alternative name (add suffix: -v2, -v3, etc.)
3. Delete existing and create new (CAUTION: may lose work)
4. Cancel and specify custom name
```

### Step 5: Create and checkout branch

```bash
# Create and checkout new branch
git checkout -b ${branch_name}

# Verify branch creation
git branch --show-current
```

---

## Output Format

### branch-info.json

```json
{
  "timestamp": "2026-01-29T10:30:00Z",
  "previous_branch": "main",
  "new_branch": "feat/auth-add-login",
  "branch_type": "created",
  "naming_source": {
    "type": "feat",
    "scope": "auth",
    "description": "add-login"
  },
  "status": "success"
}
```

**Field descriptions:**

| Field             | Description                      |
| ----------------- | -------------------------------- |
| `timestamp`       | ISO 8601 timestamp               |
| `previous_branch` | Branch before creation           |
| `new_branch`      | New branch name                  |
| `branch_type`     | `created`, `switched`, `reused`  |
| `naming_source`   | Components used to generate name |
| `status`          | `success` or `skipped`           |

---

## Return Value

After execution, return:

**Success (created)**:

```
Created branch: ${new_branch}

Previous: ${previous_branch}
Current: ${new_branch}
Type: ${primary_type}
Scope: ${primary_scope}

Output: ${run_dir}/branch-info.json
```

**Success (reused)**:

```
Using existing branch: ${current_branch}

Status: Branch reused (user choice)

Output: ${run_dir}/branch-info.json
```

**Skipped**:

```
Branch creation skipped (--skip-branch flag)

Current branch: ${current_branch}

Output: ${run_dir}/branch-info.json
```

---

## Error Handling

| Error type                            | Handling                           |
| ------------------------------------- | ---------------------------------- |
| Not a Git repo                        | Error out                          |
| Detached HEAD                         | Error: must be on a branch         |
| Uncommitted changes blocking checkout | Warn user; suggest stash or commit |
| Branch name invalid                   | Sanitize and retry                 |
| Permission denied                     | Error out                          |

---

## Constraints

- Do not analyze changes (handled by change-analyzer)
- Do not execute commit (handled by commit-executor)
- Do not modify any files except branch-info.json
- Branch names must follow convention
- Never force-delete existing branches without explicit user consent

## Verification Checklist

After execution, self-check:

- [ ] branch-info.json written to run_dir
- [ ] New branch created and checked out (or reused with user consent)
- [ ] Previous branch recorded
- [ ] No uncommitted changes lost
