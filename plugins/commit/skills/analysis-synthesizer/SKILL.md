---
name: analysis-synthesizer
description: |
  【Trigger】Commit workflow Phase 4: merge parallel analysis results.
  【Output】${run_dir}/changes-analysis.json
  【Ask】If analyses conflict, ask user to resolve.
allowed-tools:
  [Read, Write, AskUserQuestion, mcp__sequential-thinking__sequentialthinking]
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory (contains semantic-analysis.json and symbol-analysis.json)
---

# Analysis Synthesizer

## Input/Output

| Item        | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Input       | `${run_dir}/semantic-analysis.json`, `${run_dir}/symbol-analysis.json` |
| Output      | `${run_dir}/changes-analysis.json`                                     |
| 🚨 Required | Both parallel analysis files must exist                                |

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
mcp__sequential-thinking__sequentialthinking({
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

## Emoji Table

| Type     | Emoji | Type   | Emoji |
| -------- | ----- | ------ | ----- |
| feat     | ✨    | test   | ✅    |
| fix      | 🐛    | build  | 📦    |
| docs     | 📝    | ci     | 👷    |
| style    | 💄    | chore  | 🔧    |
| refactor | ♻️    | revert | ⏪    |
| perf     | ⚡    |        |       |

## Return

```
📊 Analysis synthesized
Type: ${type} | Scope: ${scope} | Complexity: ${level} | Split: ${yes/no}
Output: ${run_dir}/changes-analysis.json
```
