---
name: change-collector
description: |
  【Trigger】Step 1 of the commit workflow: collect git change information.
  【Core Output】Write ${run_dir}/changes-raw.json, including staged changes, unstaged changes, and stats.
  【Not Triggered】Change analysis (use change-analyzer), message generation (use message-generator).
  【Ask First】If the current directory is not a Git repository, ask whether to initialize.
allowed-tools:
  - Bash
  - Write
  - AskUserQuestion
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory path (passed from the commit command)
---

# Change Collector - Atomic Change Collection Skill

## MCP Tool Integration

| MCP Tool              | Purpose                               | Trigger        |
| --------------------- | ------------------------------------- | -------------- |
| `sequential-thinking` | Structure the collection strategy and ensure data completeness | 🚨 Required every run |

## Execution Flow

### Step 0: Structured Collection Plan (sequential-thinking)

🚨 **You must first use sequential-thinking to plan the collection strategy.**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan the change collection strategy. Need: 1) create runtime dir 2) verify Git repo 3) collect change data 4) parse status and build JSON 5) write output file",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking steps**:

1. **Create runtime dir**: ensure run_dir exists
2. **Verify Git repo**: check whether we are inside a Git repo and handle initialization
3. **Collect change data**: run git status/diff commands
4. **Build JSON**: parse git output into structured data
5. **Write results**: write changes-raw.json

---

## Responsibility Boundaries

- **Input**: `run_dir`
- **Output**: `${run_dir}/changes-raw.json`
- **Single responsibility**: only collect git change data; no analysis

---

## Execution Flow

### Step 1: Create runtime directory

```bash
mkdir -p ${run_dir}
```

### Step 2: Check Git repository status

```bash
# Verify we are inside a Git repo
git rev-parse --is-inside-work-tree
```

**If not a Git repo**, use AskUserQuestion:

```
Question: The current directory is not a Git repository. Initialize?
Options:
  - Initialize a new repo (git init)
  - Cancel
```

**If the user chooses to initialize**:

```bash
git init
```

**Continue to get branch info**:

```bash
# Get current branch
git branch --show-current
```

**Note**: A new repo may have no branch (no commits). In that case, branch is empty and recorded as `"branch": null`.

### Step 3: Collect change information

Run the following git commands:

```bash
# 1. Get file status (porcelain format)
git status --porcelain

# 2. Get staged diff stats
git diff --staged --numstat

# 3. Get staged file list
git diff --staged --name-status
```

### Step 4: Parse and build JSON

Build JSON with the following structure based on git output:

```json
{
  "timestamp": "2026-01-16T10:30:00Z",
  "branch": "main",
  "staged": [
    {
      "status": "M",
      "path": "src/utils/helper.ts",
      "type": "modified",
      "file_type": "typescript",
      "scope": "utils"
    }
  ],
  "unstaged": [],
  "untracked": [],
  "diff_stat": {
    "files_changed": 2,
    "insertions": 45,
    "deletions": 12
  },
  "has_staged": true,
  "has_unstaged": false,
  "has_untracked": true
}
```

**Field descriptions:**

| Field       | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| `status`    | Git status code (M=modified, A=added, D=deleted, R=renamed)                  |
| `type`      | Change type (modified, added, deleted, renamed)                             |
| `file_type` | File type (by extension: ts→typescript, py→python, etc.)                     |
| `scope`     | Scope (second-level directory, e.g. src/components/Foo.tsx → components)    |

### Step 5: Write results

Use the Write tool to write JSON to `${run_dir}/changes-raw.json`.

---

## File Type Mapping

| Extension  | file_type  |
| ---------- | ---------- |
| ts, tsx    | typescript |
| js, jsx    | javascript |
| py         | python     |
| go         | go         |
| rs         | rust       |
| md, mdx    | markdown   |
| json       | json       |
| yaml, yml  | yaml       |
| sh, bash   | shell      |
| other      | other      |

## Git Status Code Mapping

| Status | type      |
| ------ | --------- |
| `M`    | modified  |
| `A`    | added     |
| `D`    | deleted   |
| `R`    | renamed   |
| `C`    | copied    |
| `??`   | untracked |

---

## Return Value

After execution, return:

```
📊 Change collection completed

Branch: ${branch}
Staged: ${staged_count} files
Unstaged: ${unstaged_count} files
Untracked: ${untracked_count} files
Diff stats: +${insertions}/-${deletions} lines

Output: ${run_dir}/changes-raw.json
```

---

## Error Handling

| Case           | Handling                              |
| -------------- | ------------------------------------- |
| Not a Git repo | Ask whether to initialize; exit if user declines |
| No staged changes | Output normally; has_staged=false  |
| Git command failed | Error out                           |
| New repo without branch | Output normally; branch=null    |

---

## Constraints

- Do not analyze changes (use change-analyzer)
- Do not generate commit messages (use message-generator)
- Only collect data; keep it atomic
