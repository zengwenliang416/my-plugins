---
name: change-collector
description: |
  【触发条件】Commit workflow step 1: collect git changes.
  【核心产出】${run_dir}/changes-raw.json
  【不触发】当前目录不是 git 仓库且用户拒绝初始化时
  【先问什么】If not a git repo, ask to initialize.
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/get-git-status.ts`).
allowed-tools:
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory path
---

# Change Collector

## Script Entry

```bash
npx tsx scripts/get-git-status.ts [args]
```

## Resource Usage

- Reference docs: `references/git-status-codes.json`
- Assets: `assets/changes-raw.template.json`
- Execution script: `scripts/get-git-status.ts`

## Input/Output

| Item           | Value                         |
| -------------- | ----------------------------- |
| Input          | `run_dir`                     |
| Output         | `${run_dir}/changes-raw.json` |
| Responsibility | Collect only; no analysis     |

## Execution

### 1. Create directory

```bash
mkdir -p ${run_dir}
```

### 2. Verify git repo

```bash
git rev-parse --is-inside-work-tree
```

If not a repo → Ask: Initialize? (git init) / Cancel

### 3. Collect changes

```bash
git branch --show-current
git status --porcelain
git diff --staged --numstat
git diff --staged --name-status
```

### 4. Build JSON

```json
{
  "timestamp": "ISO8601",
  "branch": "main",
  "staged": [
    {
      "status": "M",
      "path": "...",
      "type": "modified",
      "file_type": "typescript",
      "scope": "utils"
    }
  ],
  "unstaged": [],
  "untracked": [],
  "diff_stat": { "files_changed": 2, "insertions": 45, "deletions": 12 },
  "has_staged": true,
  "has_unstaged": false,
  "has_untracked": true
}
```

### 5. Write output

Write JSON to `${run_dir}/changes-raw.json`

## Mappings

**Status codes:** M→modified, A→added, D→deleted, R→renamed, ??→untracked

**File types:** ts/tsx→typescript, js/jsx→javascript, py→python, go→go, md→markdown, json→json, yaml→yaml

**Scope:** Second directory level (src/components/Foo.tsx → components)

## Return

```
📊 Changes collected
Branch: ${branch} | Staged: ${n} | Unstaged: ${n} | Untracked: ${n}
Output: ${run_dir}/changes-raw.json
```
