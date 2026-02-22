---
name: change-collector
description: |
  [Trigger] Commit workflow step 1: collect git changes.
  [Output] ${run_dir}/changes-raw.json.
  [Skip] When current directory is not a git repo and user refuses to initialize.
  [Ask] If not a git repo, ask to initialize.
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/get-git-status.ts`).
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
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

- Shared index: `../_shared/references/_index.md`
- Reference docs: `references/git-status-codes.json`
- Assets: `assets/changes-raw.template.json`
- Execution script: `scripts/get-git-status.ts`

## Input/Output

| Item           | Value                         |
| -------------- | ----------------------------- |
| Input          | `run_dir`                     |
| Output         | `${run_dir}/changes-raw.json` |
| Responsibility | Collect only; no analysis     |

## 上下文加载策略（方案3：渐进式）

1. 先读 `../_shared/references/_index.md`，确认仅需“变更采集”相关资源。
2. 先执行 git 命令采集原始结果，再按字段映射填充模板。
3. 优先使用 `references/git-status-codes.json` 做状态码与文件类型映射。
4. 仅在映射不确定时读取 `references/git-status-mapping.md`，不要全量加载说明文档。

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
  "diffStat": { "filesChanged": 2, "insertions": 45, "deletions": 12 },
  "hasStaged": true,
  "hasUnstaged": false,
  "hasUntracked": true
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
