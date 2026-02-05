---
name: change-collector
description: |
  【触发】Commit 工作流步骤 1：收集 git 变更
  【输出】${run_dir}/changes-raw.json
  【询问】如果不是 git 仓库，询问是否初始化
---

# Change Collector

## 输入/输出

| 项目 | 值                            |
| ---- | ----------------------------- |
| 输入 | `run_dir`                     |
| 输出 | `${run_dir}/changes-raw.json` |
| 职责 | 仅收集；不分析                |

## 参数

- **run_dir** (必需): 运行目录路径

## 执行

### 1. 创建目录

```bash
mkdir -p ${run_dir}
```

### 2. 验证 git 仓库

```bash
git rev-parse --is-inside-work-tree
```

如果不是仓库 → 询问用户:

- (a) 初始化 (git init)
- (b) 取消

### 3. 收集变更

```bash
git branch --show-current
git status --porcelain
git diff --staged --numstat
git diff --staged --name-status
```

### 4. 构建 JSON

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

### 5. 写入输出

写入 JSON 到 `${run_dir}/changes-raw.json`

## 映射

**状态码:** M→modified, A→added, D→deleted, R→renamed, ??→untracked

**文件类型:** ts/tsx→typescript, js/jsx→javascript, py→python, go→go, md→markdown, json→json, yaml→yaml

**Scope:** 第二级目录 (src/components/Foo.tsx → components)

## 返回

```
📊 变更已收集
Branch: ${branch} | Staged: ${n} | Unstaged: ${n} | Untracked: ${n}
Output: ${run_dir}/changes-raw.json
```
