---
name: change-analyzer
description: |
  【Trigger】Step 2 of the commit workflow: analyze change type, scope, and split recommendation.
  【Core Output】Write ${run_dir}/changes-analysis.json with commit strategy suggestions.
  【Not Triggered】Collect changes (use change-collector), generate message (use message-generator).
  【Ask First】If there are no staged changes, ask whether to analyze unstaged files.
allowed-tools:
  - Read
  - Write
  - LSP
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory path (contains changes-raw.json)
---

# Change Analyzer - Atomic Change Analysis Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                     | Trigger        |
| --------------------- | ------------------------------------------- | -------------- |
| `sequential-thinking` | Structure analysis strategy and ensure completeness | 🚨 Required every run |
| `auggie-mcp`          | Semantic retrieval of the codebase to understand business meaning | 🚨 Must be used first |

## Execution Flow

### Step 0: Structured Analysis Plan (sequential-thinking)

🚨 **You must first use sequential-thinking to plan the analysis strategy.**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan the change analysis strategy. Need: 1) read change data 2) semantic analysis (auggie-mcp) 3) symbol analysis (LSP) 4) extract type and scope 5) split evaluation and result construction",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking steps**:

1. **Read change data**: extract file list and stats from changes-raw.json
2. **Semantic analysis**: use auggie-mcp to understand business meaning and feature grouping
3. **Symbol analysis**: use LSP to get symbol structure of changed files
4. **Type & scope extraction**: infer Conventional Commit type and scope
5. **Split evaluation**: decide whether to split and build analysis result

---

## Responsibility Boundaries

- **Input**: `run_dir` (contains `changes-raw.json`)
- **Output**: `${run_dir}/changes-analysis.json`
- **Single responsibility**: only analyze changes; no collection, no message generation

---

## Execution Flow

### Step 1: Read change data

Read `${run_dir}/changes-raw.json` and extract:

- `staged` array (staged file list)
- `unstaged` array (unstaged file list)
- `untracked` array (untracked file list)
- `diff_stat` (change stats)

### Step 2: Determine analysis target

**Determine target based on change state**:

| Case                                         | Target                 | Mode               |
| -------------------------------------------- | ---------------------- | ------------------ |
| `has_staged=true`                            | `staged` files         | Normal commit mode |
| `has_staged=false` but `unstaged/untracked`  | `unstaged` + `untracked` | Smart staging mode |
| All empty                                    | None                   | Error out          |

**Smart staging mode**:

- Analyze all unstaged/untracked files
- Use LSP + auggie-mcp to group by feature module
- Generate split staging suggestions

### Step 3: 🚨 Mandatory semantic analysis (auggie-mcp)

**Must call `mcp__auggie-mcp__codebase-retrieval`**. Do not skip:

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="Analyze the responsibilities and relationships of the following files and group them by feature module:
  File list: ${file_list}

  Please answer:
  1. The primary responsibility of each file
  2. Dependency relationships between files
  3. Suggested grouping by feature module
  4. Commit type for each module (feat/fix/chore/docs)"
)
```

**Outputs**:

- `semantic_groups`: files grouped by feature module
- `semantic_summary`: semantic summary of changes
- `affected_features`: list of affected features

### Step 4: 🚨 Mandatory symbol analysis (LSP)

**For each code file (.ts/.tsx/.js/.jsx/.py/.go, etc.), you must call LSP**:

```
LSP(operation="documentSymbol", filePath="${file_path}", line=1, character=1)
```

**Skip conditions** (only these are allowed):

- Config files (.json, .yaml, .toml, etc.)
- Plain text files (.md, .txt, etc.)
- LSP returns an error

**Extract**:

- Functions/classes/method names involved in changes
- Primary symbol types (function, class, interface, variable)

**Example**:

```json
{
  "symbols": [
    { "name": "validateToken", "kind": "function", "line": 42 },
    { "name": "AuthService", "kind": "class", "line": 10 }
  ]
}
```

### Step 5: Basic type analysis

Infer Conventional Commit type from file changes (as a supplement to auggie-mcp):

| File change     | Inferred type                 |
| --------------- | ----------------------------- |
| New file        | feat                          |
| Code file change| fix or feat (context-dependent) |
| Deleted file    | refactor                      |
| Doc change      | docs                          |
| Test change     | test                          |
| Config change   | chore                         |

### Step 6: Smart scope extraction (based on LSP + auggie-mcp)

**Priority (high → low)**:

1. **LSP symbols**: if changes are concentrated in a single class/module
   - `AuthService` → scope: `auth-service`
   - `validateToken` → scope: `auth/validate`

2. **Semantic analysis**: if auggie-mcp identifies a clear feature
   - "User authentication flow" → scope: `auth`

3. **Path inference** (fallback):
   - `src/components/Button.tsx` → scope: `components`
   - `docs/README.md` → scope: `docs`
   - `package.json` → scope: `root`

### Step 7: Evaluate whether to split

**Split rules:**

| Rule          | Trigger condition                         | Recommendation |
| ------------- | ----------------------------------------- | -------------- |
| Multiple scopes | 2+ distinct scopes                      | Recommend split |
| Large change  | >10 files or >300 lines                   | Recommend split |
| Mixed types   | feat + fix together                       | Optional split  |
| Add + delete  | New and deleted files together            | Recommend split |
| Unrelated semantics | auggie-mcp judges semantics unrelated | Recommend split |

### Step 8: Build analysis result

```json
{
  "timestamp": "2026-01-16T10:30:00Z",
  "analyzed_files": 3,
  "primary_type": "feat",
  "primary_scope": "auth-service",
  "scopes": ["auth-service", "utils"],
  "complexity": "low",
  "should_split": false,
  "split_recommendation": null,
  "commit_strategy": {
    "suggested_type": "feat",
    "suggested_scope": "auth-service",
    "confidence": "high",
    "reason": "All 3 files modify AuthService; semantics are consistent"
  },
  "semantic_analysis": {
    "summary": "Add token refresh capability with automatic renewal",
    "affected_features": ["User authentication", "Session management"],
    "type_confidence": "high"
  },
  "symbol_analysis": {
    "primary_symbols": ["AuthService", "refreshToken"],
    "symbol_types": {"AuthService": "class", "refreshToken": "function"}
  },
  "files_by_type": {
    "feat": [...],
    "fix": [...]
  }
}
```

**Split recommendation example (when should_split=true):**

**🚨 Each commit must include a `message` field in the format `type(scope): emoji description`.**

**Emoji mapping:**

| Type     | Emoji |
| -------- | ----- |
| feat     | ✨    |
| fix      | 🐛    |
| docs     | 📝    |
| style    | 💄    |
| refactor | ♻️    |
| perf     | ⚡    |
| test     | ✅    |
| build    | 📦    |
| ci       | 👷    |
| chore    | 🔧    |
| revert   | ⏪    |

```json
{
  "should_split": true,
  "split_recommendation": {
    "reason": "Contains multiple independent features; recommend splitting into 2 commits",
    "commits": [
      {
        "type": "feat",
        "scope": "auth-service",
        "emoji": "✨",
        "files": ["src/auth/AuthService.ts"],
        "description": "新增 token 刷新功能",
        "message": "feat(auth-service): ✨ 新增 token 刷新功能",
        "symbols": ["refreshToken", "TokenManager"],
        "priority": 1
      },
      {
        "type": "docs",
        "scope": "docs",
        "emoji": "📝",
        "files": ["docs/README.md"],
        "description": "更新认证文档",
        "message": "docs(docs): 📝 更新认证文档",
        "priority": 2
      }
    ]
  }
}
```

### Step 9: Write results

Use the Write tool to write JSON to `${run_dir}/changes-analysis.json`.

---

## Complexity Assessment

| Complexity | Condition                    |
| ---------- | ---------------------------- |
| low        | ≤3 files and ≤50 lines        |
| medium     | ≤10 files and ≤300 lines      |
| high       | >10 files or >300 lines       |

## Confidence Assessment

| Confidence | Condition                                             |
| ---------- | ----------------------------------------------------- |
| high       | Single scope + single type + low complexity + consistent semantics |
| medium     | Single scope or medium complexity                      |
| low        | Multiple scopes + high complexity + inconsistent semantics |

---

## Tool Usage Strategy

### Prefer auggie-mcp when

- You need to understand the business semantics of changes
- Decide whether it is a new feature or a bug fix
- Identify affected feature modules

### Prefer LSP when

- You need symbol structure of changed files
- Identify modified function/class names
- Extract precise scope

### Fallback strategy

If auggie-mcp or LSP is unavailable:

1. Skip semantic analysis and use basic type inference
2. Skip symbol analysis and use path-based scope inference
3. Mark the result with `"analysis_mode": "basic"`

---

## Return Value

After execution, return:

```
📊 Change analysis completed

Primary type: ${primary_type}
Primary scope: ${primary_scope}
Core symbols: ${primary_symbols}
Semantic summary: ${semantic_summary}
File count: ${analyzed_files}
Complexity: ${complexity}
Split needed: ${should_split}
Confidence: ${confidence}

Output: ${run_dir}/changes-analysis.json
```

---

## Constraints

- Do not collect change data (handled by change-collector)
- Do not generate commit messages (handled by message-generator)
- Analysis results are advisory; the user has final decision
- **🚨 Must call auggie-mcp for semantic analysis**
- **🚨 Must call LSP for code files to get symbols**
- Only fall back when tools return errors
