---
name: change-analyzer
description: |
  【Trigger】Commit workflow step 2: analyze changes.
  【Output】${run_dir}/changes-analysis.json
  【Ask】If no staged changes, ask to analyze unstaged.
allowed-tools:
  [
    Read,
    Write,
    LSP,
    AskUserQuestion,
    mcp__auggie-mcp__codebase-retrieval,
    mcp__sequential-thinking__sequentialthinking,
  ]
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory (contains changes-raw.json)
---

# Change Analyzer

## Input/Output

| Item        | Value                                |
| ----------- | ------------------------------------ |
| Input       | `${run_dir}/changes-raw.json`        |
| Output      | `${run_dir}/changes-analysis.json`   |
| 🚨 Required | auggie-mcp (semantic), LSP (symbols) |

## Execution

### 1. Read changes-raw.json

Extract: staged, unstaged, untracked, diff_stat

### 1.5 🚨 Check staged status (AskUserQuestion)

**If `has_staged=false` but has unstaged/untracked files:**

```
AskUserQuestion({
  questions: [{
    question: "没有 staged 变更，是否要分析 unstaged 的变更并进行提交？",
    header: "暂存状态",
    options: [
      { label: "分析 unstaged", description: "分析所有 unstaged + untracked 变更，然后帮你分功能提交" },
      { label: "取消", description: "你可以先手动 git add 需要的文件" }
    ],
    multiSelect: false
  }]
})
```

- If user chooses "分析 unstaged" → continue with unstaged + untracked files
- If user chooses "取消" → exit skill, return early

### 2. 🚨 Semantic analysis (auggie-mcp)

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="Analyze files: ${file_list}. Return: 1) responsibilities 2) dependencies 3) feature grouping 4) commit types"
)
```

### 3. 🚨 Symbol analysis (LSP)

For each code file:

```
LSP(operation="documentSymbol", filePath="${path}")
```

Skip: config files, text files, LSP errors

### 4. Type inference

| Change      | Type     |
| ----------- | -------- |
| New file    | feat     |
| Code change | fix/feat |
| Delete      | refactor |
| Docs        | docs     |
| Tests       | test     |
| Config      | chore    |

### 5. Scope extraction (priority)

1. LSP symbols (AuthService → auth-service)
2. Semantic analysis (feature module)
3. Path (src/components/X → components)

### 6. Split evaluation

| Condition               | Recommendation |
| ----------------------- | -------------- |
| 2+ scopes               | split          |
| >10 files or >300 lines | split          |
| Mixed feat+fix          | optional       |
| Unrelated semantics     | split          |

### 7. Build output

```json
{
  "timestamp": "ISO8601",
  "analyzed_files": 3,
  "primary_type": "feat",
  "primary_scope": "auth-service",
  "complexity": "low|medium|high",
  "should_split": false,
  "split_recommendation": {
    "commits": [
      {
        "type": "feat",
        "scope": "auth",
        "emoji": "✨",
        "files": ["..."],
        "message": "feat(auth): ✨ description",
        "body": "Description\n\n变更文件:\n- file: purpose"
      }
    ]
  },
  "commit_strategy": {
    "suggested_type": "feat",
    "suggested_scope": "auth",
    "confidence": "high"
  }
}
```

## Emoji Table

| Type     | Emoji | Type   | Emoji |
| -------- | ----- | ------ | ----- |
| feat     | ✨    | test   | ✅    |
| fix      | 🐛    | build  | 📦    |
| docs     | 📝    | ci     | 👷    |
| style    | 💄    | chore  | 🔧    |
| refactor | ♻️    | revert | ⏪    |
| perf     | ⚡    |        |       |

## Complexity

| Level  | Condition               |
| ------ | ----------------------- |
| low    | ≤3 files, ≤50 lines     |
| medium | ≤10 files, ≤300 lines   |
| high   | >10 files or >300 lines |

## Return

```
📊 Analysis complete
Type: ${type} | Scope: ${scope} | Files: ${n} | Split: ${yes/no}
Output: ${run_dir}/changes-analysis.json
```
