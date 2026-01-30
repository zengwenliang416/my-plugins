# Change Analysis Rules Reference

Rules for change analysis: type inference, scope extraction, split recommendations.

---

## 1. Type inference rules

### 1.1 Based on file changes

| File change pattern | Inferred type | Confidence |
|---------------------|---------------|------------|
| New feature code files | `feat` | high |
| Modify existing feature code | `feat` or `fix` | medium |
| Delete code files | `refactor` | high |
| Modify test files | `test` | high |
| Modify documentation files | `docs` | high |
| Modify config files | `chore` or `build` | medium |
| Modify CI/CD files | `ci` | high |
| Modify style files | `style` | high |

### 1.2 Based on semantic analysis

| Semantic signal | Inferred type |
|-----------------|---------------|
| Add new interface/API | `feat` |
| Fix error handling | `fix` |
| Performance optimization | `perf` |
| Refactor code structure | `refactor` |
| Add/update dependencies | `build` |
| Code formatting | `style` |

### 1.3 Type priority (on conflict)

```
feat > fix > perf > refactor > style > docs > test > chore
```

---

## 2. Scope extraction rules

### 2.1 LSP symbols first

**Prefer LSP symbols as scope**:

```typescript
// Changes concentrated in a single class
class AuthService { ... }  → scope: "auth-service"

// Changes concentrated in a single function
function validateToken() { ... }  → scope: "auth/validate"

// Changes involve multiple related symbols
AuthService + TokenManager  → scope: "auth"
```

### 2.2 Semantic analysis second

**Use feature modules identified by auggie-mcp**:

```
"User authentication flow" → scope: "auth"
"Payment processing" → scope: "payment"
"Database connection" → scope: "db"
```

### 2.3 Path inference (fallback)

**When LSP and semantic analysis are unavailable**:

| Path pattern | Inferred scope |
|-------------|----------------|
| `src/components/*` | `components` |
| `src/services/*` | `services` |
| `src/utils/*` | `utils` |
| `src/api/*` | `api` |
| `packages/core/*` | `core` |
| `apps/web/*` | `web` |

---

## 3. Complexity assessment

### 3.1 Dimensions

| Dimension | Low | Medium | High |
|-----------|-----|--------|------|
| Files | ≤3 | ≤10 | >10 |
| Lines changed | ≤50 | ≤300 | >300 |
| Scopes | 1 | 2-3 | >3 |
| Types | 1 | 2 | >2 |

### 3.2 Overall scoring

```
low: files ≤3 and lines ≤50 and scopes =1
medium: files ≤10 and lines ≤300
high: files >10 or lines >300 or scopes >3
```

---

## 4. Split recommendation rules

### 4.1 Split triggers

| Rule | Trigger | Recommendation |
|------|---------|----------------|
| Multiple scopes | 2+ distinct scopes | Split by scope |
| Large change | files >10 or lines >300 | Split by feature |
| Mixed types | feat + fix together | Separate commits |
| Add + delete | new and deleted files together | Consider split |
| Unrelated semantics | auggie-mcp deems semantics unrelated | Split by semantics |

### 4.2 Split priority

```
1. feat first
2. fix next
3. refactor/perf after
4. docs/test/chore last
```

### 4.3 Split recommendation format

```json
{
  "should_split": true,
  "split_recommendation": {
    "reason": "Contains multiple independent features; recommend splitting into 2 commits",
    "commits": [
      {
        "type": "feat",
        "scope": "auth-service",
        "files": ["src/auth/AuthService.ts"],
        "description": "新增 token 刷新功能",
        "priority": 1
      },
      {
        "type": "docs",
        "scope": "docs",
        "files": ["docs/README.md"],
        "description": "更新认证文档",
        "priority": 2
      }
    ]
  }
}
```

---

## 5. Confidence assessment

### 5.1 Factors

| Factor | high | medium | low |
|--------|------|--------|-----|
| Scope | single | 2 | 3+ |
| Type | single | 2 | 3+ |
| Complexity | low | medium | high |
| Semantic consistency | highly consistent | partially related | unrelated |

### 5.2 Overall confidence

```
high: single scope + single type + low complexity + consistent semantics
medium: single scope or medium complexity
low: multiple scopes + high complexity + inconsistent semantics
```
