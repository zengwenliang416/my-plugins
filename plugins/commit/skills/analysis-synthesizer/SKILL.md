---
name: analysis-synthesizer
description: |
  [Trigger] Commit workflow Phase 4: merge parallel analysis results.
  [Output] ${run_dir}/changes-analysis.json.
  [Skip] When semantic or symbol analysis input files are missing.
  [Ask] If analyses conflict, ask user to resolve.
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory (contains semantic-analysis.json and symbol-analysis.json)
---

# Analysis Synthesizer

## Resource Usage

- Shared index: `../_shared/references/_index.md`
- Shared taxonomy: `../_shared/references/commit-taxonomy.json`
- Optional fallback rules: `../change-analyzer/references/analysis-rules.json`

## Input/Output

| Item        | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Input       | `${run_dir}/semantic-analysis.json`, `${run_dir}/symbol-analysis.json` |
| Output      | `${run_dir}/changes-analysis.json`                                     |
| 🚨 Required | Both parallel analysis files must exist                                |

## 上下文加载策略（方案3：渐进式）

1. 先读 `../_shared/references/_index.md`，确认本阶段仅做“分析结果合成”。
2. 只读取 `${run_dir}/semantic-analysis.json` 与 `${run_dir}/symbol-analysis.json`。
3. 阈值、emoji、split 判定优先读取 `../_shared/references/commit-taxonomy.json`。
4. 仅在合成冲突时按需读取 `../change-analyzer/references/analysis-rules.json`。
5. 禁止预加载 message/changelog/commit 执行阶段文档。

## Execution

### 1. Read parallel analysis results

Load both JSON files:

- `semantic-analysis.json` - from semantic-analyzer agent
- `symbol-analysis.json` - from symbol-analyzer agent

### 2. Merge semantic groups with symbol scopes

For each semantic group:

1. Match files with symbol analysis results
2. Use symbol-derived scope if confidence is high
3. Fall back to semantic-derived scope otherwise

Priority for scope:

1. LSP symbols (high confidence) → e.g., `AuthService` → `auth-service`
2. Semantic analysis → e.g., feature module name
3. Path-based fallback → e.g., `src/components/X` → `components`

### 3. Resolve conflicts

If semantic and symbol analyses suggest different types/scopes:

```
  thought: "Analyzing conflict between semantic (${semantic_type}/${semantic_scope}) and symbol (${symbol_scope}) analysis...",
  thoughtNumber: 1,
  totalThoughts: 3,
  nextThoughtNeeded: true
})
```

Resolution rules:

- Type: Prefer semantic analysis (understands change purpose)
- Scope: Prefer symbol analysis if confidence is high

### 4. Calculate complexity

| Level  | Condition                            |
| ------ | ------------------------------------ |
| low    | ≤3 files, ≤50 lines, single scope    |
| medium | ≤10 files, ≤300 lines, ≤2 scopes     |
| high   | >10 files OR >300 lines OR >2 scopes |

### 5. Determine split recommendation

| Condition                     | Recommendation |
| ----------------------------- | -------------- |
| 2+ distinct semantic groups   | split          |
| >10 files or >300 lines       | split          |
| Mixed feat+fix types          | optional       |
| Cross-module changes detected | split          |

### 6. Build unified output

```json
{
  "timestamp": "ISO8601",
  "analyzed_files": "number",
  "primary_type": "feat|fix|refactor|docs|test|chore",
  "primary_scope": "string",
  "complexity": "low|medium|high",
  "should_split": "boolean",
  "split_recommendation": {
    "commits": [
      {
        "type": "string",
        "scope": "string",
        "emoji": "string",
        "files": ["paths"],
        "message": "type(scope): emoji description",
        "body": "Description with file list"
      }
    ]
  },
  "commit_strategy": {
    "suggested_type": "string",
    "suggested_scope": "string",
    "confidence": "high|medium|low"
  },
  "synthesis_metadata": {
    "semantic_groups_count": "number",
    "symbol_scopes_count": "number",
    "conflicts_resolved": "number"
  }
}
```

## Emoji Mapping

统一映射请读取 `../_shared/references/commit-taxonomy.json` 的 `emoji_by_type`。

## Return

```
📊 Analysis synthesized
Type: ${type} | Scope: ${scope} | Complexity: ${level} | Split: ${yes/no}
Output: ${run_dir}/changes-analysis.json
```
