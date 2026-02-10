---
name: context-retriever
description: |
  【触发条件】 Dev workflow step 1: Retrieve context related to feature requirements.
  【核心产出】 Outputs ${run_dir}/context.md containing internal code + external documentation.
  【不触发】 Direct analysis (use multi-model-analyzer), code generation (use prototype-generator).
  【先问什么】 If requirement description is vague, ask what context to retrieve specifically
  [Mandatory Tool] Internal code uses auggie-mcp + LSP; external docs use context7/WebSearch.
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/retrieve-context.ts`).
allowed-tools:
  - Write
  - Skill
  - LSP
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

# Context Retriever - Context Retrieval Atomic Skill

## Script Entry

```bash
npx tsx scripts/retrieve-context.ts [args]
```

## Resource Usage

- Reference docs: `references/retrieval-strategies.json`
- Assets: `assets/context.template.md`
- Execution script: `scripts/retrieve-context.ts`

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Internal Code Retrieval (existing codebase)                  │
│     ✅ Required: auggie-mcp → LSP                                │
│     ❌ Prohibited: Read, Grep, Glob                              │
│                                                                  │
│  🌐 External Doc Retrieval (when new tech/new project - Required)│
│     ✅ Required: context7 / WebSearch / WebFetch                 │
│     ❌ Prohibited: 仅依赖未验证来源                                │
│     ❌ Prohibited: 跳过来源记录与日期标注                          │
│                                                                  │
│  ⚠️  New project/empty codebase → Must do external retrieval     │
│      Cannot skip external doc retrieval just because "no         │
│      internal code"!                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP Tool Integration

| MCP Tool              | Purpose                                         | Trigger      |
| --------------------- | ----------------------------------------------- | ------------ |
| `auggie-mcp`          | Semantic retrieval (preferred)                  | 🚨 Use first |

## Execution Flow



```
  thought: "Planning context retrieval strategy. Need: 1) Analyze requirement keywords 2) Determine retrieval scope 3) Select retrieval method 4) Plan symbol analysis 5) Plan evidence collection",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Keyword Extraction**: Extract search keywords from feature requirements
2. **Scope Determination**: Internal code vs external docs
3. **Method Selection**: auggie-mcp → LSP → context7/WebSearch
4. **Symbol Analysis Planning**: Key symbols requiring deep analysis
5. **Evidence Collection Strategy**: How to organize and record findings

### Step 1: Determine Retrieval Type

Determine retrieval type based on feature requirements:

| Scenario                   | Retrieval Type | Tools            |
| -------------------------- | -------------- | ---------------- |
| Modify/extend existing     | Internal code  | auggie-mcp + LSP |
| Use new tech/framework     | External docs  | context7/WebSearch |
| Both (common)              | Internal + Ext | All tools        |
| New project/empty codebase | External only  | context7/WebSearch |

### Step 2A: Internal Code Retrieval (Required when codebase exists)

**2A.1 Semantic Retrieval**

```
mcp__auggie-mcp__codebase-retrieval({
  "information_request": "Find code related to ${FEATURE}:
    - Classes, functions, modules implementing this feature
    - Related data models and interface definitions
    - Existing similar implementations or patterns
    - Internal modules and external libraries depended on"
})
```

**2A.2 LSP Symbol Analysis (🚨 Required)**

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨🚨🚨 LSP calls are mandatory, not optional! 🚨🚨🚨            │
│                                                                  │
│  After auggie-mcp returns results, must immediately call LSP    │
│  for each related file:                                          │
│                                                                  │
│  1. LSP.documentSymbol(filePath)     - Get file structure       │
│  2. LSP.goToDefinition(symbol)       - Jump to definition       │
│  3. LSP.findReferences(symbol)       - Find all references      │
│  4. LSP.hover(symbol)                - Get type information     │
│                                                                  │
│  Minimum 5 LSP calls, otherwise this Skill execution fails!      │
└─────────────────────────────────────────────────────────────────┘
```

**Execute LSP call sequence immediately:**

```
# 1. For each related file, get structure first
LSP(operation="documentSymbol", filePath="<file>", line=1, character=1)

# 2. For key symbols, get definition
LSP(operation="goToDefinition", filePath="<file>", line=<line>, character=<char>)

# 3. For symbols to modify, find all references
LSP(operation="findReferences", filePath="<file>", line=<line>, character=<char>)

# 4. Get type information
LSP(operation="hover", filePath="<file>", line=<line>, character=<char>)
```

**Verification**: context.md must contain LSP analysis results table

### Step 2B: External Doc Retrieval (🚨 Required for new tech/new project)

**Must retrieve at least 3 categories of external evidence:**

1. Official docs (context7 preferred)
2. Code examples (WebSearch/WebFetch)
3. Best practices / migration guides (WebSearch)

**Typical search example (macOS speech recognition):**

```
WebSearch(query="SFSpeechRecognizer macOS Swift tutorial")
WebSearch(query="Speech framework macOS example github")
WebSearch(query="macOS speech recognition best practices")
```

**🚨 Mandatory Verification**: For new project or new tech, external retrieval must include at least 2 independent sources.

### Step 3: Structured Output

Write retrieval results to `${run_dir}/context.md`:

```markdown
# Context Retrieval Report

## Retrieval Method Verification

### Internal Code Retrieval

- [x] auggie-mcp semantic retrieval
- [x] LSP.documentSymbol analysis
- [x] LSP.goToDefinition location
- [x] LSP.findReferences references

### External Doc Retrieval

- [x] context7/WebSearch official docs
- [x] WebSearch/WebFetch code examples
- [x] WebSearch best practices

## Requirements Overview

[One sentence feature requirement description]

## Internal Code (from auggie-mcp + LSP)

### Related Files

| File Path | Relevance | Key Symbols | Notes     |
| --------- | --------- | ----------- | --------- |
| src/...   | High      | FooClass    | Core impl |

### Symbol Analysis

| Symbol | Location        | References | Notes      |
| ------ | --------------- | ---------- | ---------- |
| Foo    | src/foo.ts:10:1 | 15         | Core class |

## External Docs (from context7/WebSearch)

### Official Documentation

| Source          | Title              | URL         | Key Content Summary    |
| --------------- | ------------------ | ----------- | ---------------------- |
| Apple Developer | SFSpeechRecognizer | https://... | Speech recognition API |

### Code Examples

| Source | Title       | URL         | Key Code Snippet |
| ------ | ----------- | ----------- | ---------------- |
| GitHub | speech-demo | https://... | Complete impl    |

### Best Practices

- [Practice 1]: Description "Source: URL"
- [Practice 2]: Description "Source: URL"

## Architecture Patterns

- Current architecture: [Identified patterns]
- Recommended patterns: [From external docs]

## Dependency Analysis

| Dependency       | Type     | Source   | Purpose            |
| ---------------- | -------- | -------- | ------------------ |
| Speech.framework | System   | Apple    | Speech recognition |
| ./utils          | Internal | Codebase | Utilities          |

---

Retrieval time: [timestamp]
Next step: Invoke multi-model-analyzer for analysis
```

---

## Quality Gates

### Tool Usage Verification

**Internal code (when codebase exists):**

- [ ] Called `mcp__auggie-mcp__codebase-retrieval` at least 1 time
- [ ] 🚨 Called LSP operations **at least 5 times** (documentSymbol + goToDefinition + findReferences + hover)
- [ ] context.md contains LSP analysis results table
- [ ] Did **NOT** use Read/Grep/Glob to read source code

**External docs (for new tech or new project - 🚨 Required):**

- [ ] Invoked context7 or WebSearch at least 2 times
- [ ] Retrieved official doc links
- [ ] Retrieved code examples
- [ ] Did **NOT** skip external doc retrieval

### Output Quality Verification

- [ ] Internal: Identified related files and symbols
- [ ] External: Retrieved latest docs and examples
- [ ] Analyzed dependency relationships
- [ ] Evaluated technical feasibility

---

## Constraints

- No plan analysis (handled by multi-model-analyzer)
- No code generation (handled by prototype-generator)
- **Internal code: Prohibited skipping auggie-mcp/LSP and reading files directly**
- **External docs: Must use context7/WebSearch/WebFetch with source attribution**
- **For new project/empty codebase: Must perform external retrieval**

## 🚨 Mandatory Tool Verification

**After executing this Skill, the following conditions must be met:**

| Check Item               | Requirement                   | Verification Method              |
| ------------------------ | ----------------------------- | -------------------------------- |
| Internal retrieval       | auggie-mcp at least 1 time    | Check MCP call records           |
| LSP analysis             | At least 3 operations         | Check LSP call records           |
| External docs (new proj) | context7/WebSearch at least 2 times | Check tool call records |
| Unverified sources       | Prohibited                    | Must record source + date        |
| Skip external retrieval  | Prohibited (new tech/proj)    | context.md must have ext docs    |

**If it's a new project and external retrieval was skipped, this Skill execution fails!**
