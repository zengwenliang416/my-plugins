---
name: change-analyzer
description: |
  【触发条件】Commit workflow step 2: analyze changes.
  【核心产出】${run_dir}/changes-analysis.json
  【不触发】没有可分析的 staged/unstaged 变更时
  【先问什么】If no staged changes, ask to analyze unstaged.
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/analyze-changes.ts`).
allowed-tools:
  [
    Read,
    Write,
    LSP,
    AskUserQuestion,
    mcp__auggie-mcp__codebase-retrieval,
  ]
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory (contains changes-raw.json)
---

# Change Analyzer

## Script Entry

```bash
npx tsx scripts/analyze-changes.ts [args]
```

## Resource Usage

- Shared index: `../_shared/references/_index.md`
- Shared taxonomy: `../_shared/references/commit-taxonomy.json`
- Reference docs: `references/analysis-rules.json`
- Assets: `assets/changes-analysis.template.json`
- Execution script: `scripts/analyze-changes.ts`

## Input/Output

| Item        | Value                                |
| ----------- | ------------------------------------ |
| Input       | `${run_dir}/changes-raw.json`        |
| Output      | `${run_dir}/changes-analysis.json`   |
| 🚨 Required | auggie-mcp (semantic), LSP (symbols) |

## 上下文加载策略（方案3：渐进式）

1. 先读 `../_shared/references/_index.md`，确认当前阶段仅需分析规则与阈值。
2. 先读 `${run_dir}/changes-raw.json` 提取文件列表、diff 统计与 staged 状态。
3. 优先读取 `references/analysis-rules.json` 与 `../_shared/references/commit-taxonomy.json` 的结构化规则。
4. 仅在冲突/歧义时再读取 `references/analysis-rules.md` 进行人工解释。
5. 输出优先复用 `assets/changes-analysis.template.json`，避免展开完整大样例。

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
  "analyzedFiles": 3,
  "primaryType": "feat",
  "primaryScope": "auth-service",
  "complexity": "low|medium|high",
  "shouldSplit": false,
  "splitRecommendation": {
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
  "commitStrategy": {
    "suggestedType": "feat",
    "suggestedScope": "auth",
    "confidence": "high"
  }
}
```

## Emoji Mapping

统一映射请读取 `../_shared/references/commit-taxonomy.json` 的 `emoji_by_type`，不要在本技能重复维护。

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
