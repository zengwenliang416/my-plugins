---
name: plan-context-retriever
description: |
  【触发条件】 Plan workflow Step 2: Retrieve code context related to requirements
  【核心产出】 Outputs ${run_dir}/context.md
  [🚨 Mandatory Tool 🚨] auggie-mcp must be first choice! LSP symbol analysis! context7/WebSearch for external retrieval (new projects)
  [Prohibited] Skipping auggie-mcp and using Grep/Glob directly
  【不触发】 Direct analysis (use architecture-analyzer)
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, assets/.
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - LSP
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
  - WebSearch
  - WebFetch
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path (passed by orchestrator)
---

# Plan Context Retriever - Context Retrieval Atomic Skill

## Responsibility Boundary

- **Input**: `run_dir` + `${run_dir}/requirements.md`
- **Output**: `${run_dir}/context.md`
- **Single Responsibility**: Only do context retrieval, no architecture analysis

## MCP Tool Integration

| MCP Tool              | Purpose                           | Trigger                            |
| --------------------- | --------------------------------- | ---------------------------------- |
| `auggie-mcp`          | Semantic retrieval (first choice) | 🚨 Must use first                  |
| `LSP`                 | Symbol-level precise operations   | Deep analysis of retrieval results |

## Execution Flow



```
  thought: "Planning context retrieval strategy. Need: 1) Analyze requirement keywords 2) Determine retrieval scope 3) Select retrieval methods 4) Plan evidence collection",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Requirement Keyword Extraction**: Extract search keywords from requirements.md
2. **Retrieval Scope Determination**: Internal code vs external documentation
3. **Retrieval Method Selection**: auggie-mcp → LSP → Grep/Glob
4. **Symbol Analysis Planning**: Key symbols needing deep analysis
5. **Evidence Collection Strategy**: How to organize and record findings

### Step 1: Read Requirements

```bash
REQUIREMENTS=$(cat "${run_dir}/requirements.md")
```

Extract from requirements file:

- Functional requirements list
- Technical constraints
- Task type

### Step 2: Determine Project Status

Check if this is a new project:

```bash
# Check if codebase has substantial content
FILE_COUNT=$(find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" | wc -l)
```

| Status           | Criteria         | Retrieval Strategy                    |
| ---------------- | ---------------- | ------------------------------------- |
| New project      | Code files < 10  | Use context7/WebSearch for external retrieval |
| Existing project | Code files >= 10 | Use auggie-mcp for internal retrieval |

### Step 3: Internal Code Retrieval (Existing Project)

## 🚨🚨🚨 Mandatory Tool Priority 🚨🚨🚨

**Code retrieval must follow this order, no skipping:**

| Priority | Tool                                  | Purpose                    | Mandatory                    |
| -------- | ------------------------------------- | -------------------------- | ---------------------------- |
| 1        | `mcp__auggie-mcp__codebase-retrieval` | Semantic retrieval (first) | **Must use first**           |
| 2        | `LSP`                                 | Symbol-level operations    | Deep analysis of results     |
| 3        | `Grep/Glob`                           | Fallback option            | Only when auggie unavailable |

**Prohibited Actions**:

- ❌ Skipping auggie-mcp and using Grep/Glob directly
- ❌ Completing retrieval without calling LSP
- ❌ Only using Read to manually browse files

**Mandatory call to `mcp__auggie-mcp__codebase-retrieval`**:

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Find code related to <functional requirement>:
    - Related classes, functions, modules
    - Data models and interface definitions
    - Existing similar implementations
    - External library dependencies
    - Configuration files and environment variables"
})
```

**Verify retrieval complete**: Must obtain at least 3 relevant code snippets, otherwise expand search scope.

### Step 4: LSP Symbol-Level Analysis

For key symbols in semantic retrieval results, use LSP for deep analysis:

| Scenario                      | LSP Operation                     | Output              |
| ----------------------------- | --------------------------------- | ------------------- |
| Understand file structure     | `documentSymbol`                  | File symbol list    |
| View symbol definition        | `goToDefinition`                  | Definition location |
| Find all references           | `findReferences`                  | Reference list      |
| Understand call relationships | `incomingCalls` / `outgoingCalls` | Call graph          |
| Interface implementation      | `goToImplementation`              | Implementation list |

### Step 5: External Documentation Retrieval (New Project or Best Practices Needed)

Call context7/WebSearch to get external resources:

```
WebSearch(query="<tech stack> best practices implementation")
```

Retrieval content:

- Official documentation
- Best practice guides
- Example codebases
- Common problem solutions

### Step 6: Evidence Collection

Collect all discovered evidence:

```json
{
  "internal_evidence": [
    {
      "file": "src/auth/login.ts",
      "line": 42,
      "symbol": "authenticateUser",
      "relevance": "High",
      "reason": "Existing authentication implementation"
    }
  ],
  "external_evidence": [
    {
      "source": "https://docs.example.com/auth",
      "title": "Authentication Best Practices",
      "relevance": "Medium",
      "reason": "Industry standard reference"
    }
  ]
}
```

### Step 7: Structured Output

Write retrieval results to `${run_dir}/context.md`:

```markdown
# Context Retrieval Report

## Metadata

- Retrieval Time: [timestamp]
- Project Status: [New project|Existing project]
- Retrieval Scope: [Internal|External|Mixed]

## Requirement Overview

[Core requirement extracted from requirements.md]

## Internal Code Context

### Related Files

| File Path              | Relevance | Key Symbols      | Description     |
| ---------------------- | --------- | ---------------- | --------------- |
| src/auth/login.ts      | High      | authenticateUser | Core auth logic |
| src/models/user.ts     | High      | UserModel        | User data model |
| src/middleware/auth.ts | Medium    | authMiddleware   | Auth middleware |

### Architecture Patterns

- **Current Architecture**: [Identified architecture pattern]
- **Data Flow**: [How data flows]
- **Key Interfaces**: [Interfaces to implement/extend]

### Dependency Analysis

| Dependency     | Type            | Version | Purpose       |
| -------------- | --------------- | ------- | ------------- |
| express        | External lib    | 4.18.2  | Web framework |
| jsonwebtoken   | External lib    | 9.0.0   | JWT handling  |
| ./utils/crypto | Internal module | -       | Crypto utils  |

### Call Relationship Diagram
```

authenticateUser()
├── validateCredentials()
│ └── hashPassword()
├── generateToken()
└── saveSession()

```

## External Documentation Context

### Reference Materials

| Source | Title | Relevance | Key Points |
|-----|-----|-------|-----|
| [URL] | [Title] | High/Medium/Low | [Key information] |

### Best Practices

- [Best practices extracted from external documentation]

### Technology Selection Recommendations (New Project)

| Domain | Recommended Solution | Reason |
|-----|---------|-----|
| Authentication | JWT + OAuth2 | Industry standard |
| Database | PostgreSQL | Complex query support |

## Potential Impact

- **Potentially Affected Modules**: [List]
- **Files Requiring Modification**: [List]
- **Test Coverage Status**: [Existing tests]

## Evidence Chain

[Complete evidence JSON]

---

Next step: Call architecture-analyzer for architecture analysis
```

## Return Value

After execution, return:

```
Context retrieval complete.
Output file: ${run_dir}/context.md
Project status: [New project|Existing project]
Related files: X
External references: Y

Next step: Use tpd:architecture-analyzer for architecture analysis
```

## Quality Gates

- ✅ Identified related code files
- ✅ Extracted key symbols and interfaces
- ✅ Analyzed dependencies
- ✅ Assessed potential impact scope
- ✅ Collected evidence chain

## Constraints

- Do not do architecture analysis (delegated to architecture-analyzer)
- Do not generate code (delegated to subsequent phases)
- Retrieval scope can be broad, but output must be focused
- Must use LSP for symbol-level precise analysis
