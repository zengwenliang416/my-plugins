---
name: context-retriever
description: |
  [Trigger] Dev workflow step 1: Retrieve context related to feature requirements.
  [Output] Outputs ${run_dir}/context.md containing internal code + external documentation.
  [Skip] Direct analysis (use multi-model-analyzer), code generation (use prototype-generator).
  [Ask First] If requirement description is vague, ask what context to retrieve specifically.
  [Mandatory Tool] Internal code must use Trae native SearchCodebase first, then Read for evidence consolidation.
---

# Context Retriever - Context Retrieval Atomic Skill

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Internal Code Retrieval (existing codebase)                │
│     ✅ Required: SearchCodebase → Read                         │
│     ❌ Prohibited: 仅靠记忆输出、直接跳过检索                    │
│                                                                 │
│  🌐 External Doc Retrieval (new tech/new project - Required)   │
│     ✅ Required: Web Search → Read 固化关键来源                 │
│     ❌ Prohibited: 仅凭经验输出未验证结论                        │
│                                                                 │
│  ⚠️  New project/empty codebase → Must retrieve external docs! │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Integration

| Tool | Purpose | Trigger |
| --- | --- | --- |
| `SearchCodebase` | 在仓库内做语义级代码定位（首选） | 任何内部代码检索 |
| `Read` | 精读 SearchCodebase 命中内容并沉淀证据 | 命中候选文件后 |
| `Web Search` | 外部文档与最佳实践检索 | 新技术 / 新项目 / 规范核验 |

## Execution Flow

```
thought: "Planning context retrieval strategy. Need: 1) Analyze requirement keywords 2) Determine retrieval scope 3) Select retrieval path 4) Consolidate evidence 5) Produce context.md"
```

**Thinking Steps**:

1. **Keyword Extraction**: Extract search keywords from feature requirements
2. **Scope Determination**: Internal code vs external docs
3. **Method Selection**: SearchCodebase → Read → Web Search + Read
4. **Evidence Consolidation**: 结构化记录代码证据与外部证据
5. **Output Generation**: 写入可复用 `context.md`

### Step 1: Determine Retrieval Type

| Scenario | Retrieval Type | Tools |
| --- | --- | --- |
| Modify/extend existing | Internal code | SearchCodebase + Read |
| Use new tech/framework | External docs | Web Search + Read |
| Both (common) | Internal + Ext | All tools |
| New project/empty codebase | External only | Web Search + Read |

### Step 2A: Internal Code Retrieval (Required when codebase exists)

**2A.1 SearchCodebase query template**

```
使用 SearchCodebase："Find code related to ${FEATURE}:
- Classes/functions/modules implementing this feature
- Related data models and interface definitions
- Existing similar implementations or patterns
- Internal modules and external libraries depended on"
```

**2A.2 Read-based deep dive (required)**

- 对 SearchCodebase 返回的高相关文件进行精读
- 至少覆盖 3 个候选文件（或覆盖全部命中但不少于 2 个）
- 提取以下证据并写入 context.md：
  - 关键符号（函数/类/接口）
  - 调用方向（谁调用它、它依赖谁）
  - 约束点（鉴权、配置、边界条件）

### Step 2B: External Doc Retrieval (🚨 Required for new tech/new project)

**Must execute at least 3 Web Search queries and keep sources:**

1. Official docs search: `${tech_keywords} official documentation tutorial`
2. Code examples search: `${tech_keywords} example code implementation github`
3. Best practices search: `${tech_keywords} best practices production`

**Source handling requirements:**

- Must include source URL and key summary in `context.md`
- Prefer official docs + high-quality example repos
- If conflicting sources appear, record conflict and reasoning

### Step 3: Structured Output

使用 Edit 工具写入 `${run_dir}/context.md`:

```markdown
# Context Retrieval Report

## Retrieval Method Verification

### Internal Code Retrieval

- [x] SearchCodebase retrieval
- [x] Read deep-dive on candidate files

### External Doc Retrieval

- [x] Web Search official docs
- [x] Web Search code examples
- [x] Web Search best practices

## Requirements Overview

[One sentence feature requirement description]

## Internal Code Context (from SearchCodebase + Read)

### Related Files

| File Path | Relevance | Key Symbols | Notes |
| --- | --- | --- | --- |
| src/... | High | FooClass | Core impl |

### Symbol & Dependency Notes

| Symbol | Location | Dependency/Caller | Notes |
| --- | --- | --- | --- |
| Foo | src/foo.ts:10:1 | used by BarService | Core class |

## External Docs (from Web Search + Read)

### Official Documentation

| Source | Title | URL | Key Content Summary |
| --- | --- | --- | --- |
| Apple Developer | SFSpeechRecognizer | https://... | Speech recognition API |

### Code Examples

| Source | Title | URL | Key Code Snippet |
| --- | --- | --- | --- |
| GitHub | speech-demo | https://... | Complete impl |

### Best Practices

- [Practice 1]: Description "Source: URL"
- [Practice 2]: Description "Source: URL"

## Architecture Patterns

- Current architecture: [Identified patterns]
- Recommended patterns: [From external docs]

## Dependency Analysis

| Dependency | Type | Source | Purpose |
| --- | --- | --- | --- |
| Speech.framework | System | Apple | Speech recognition |
| ./utils | Internal | Codebase | Utilities |

---

Retrieval time: [timestamp]
Next step: Invoke multi-model-analyzer for analysis
```

---

## Quality Gates

### Tool Usage Verification

**Internal code (when codebase exists):**

- [ ] Called SearchCodebase at least 1 time
- [ ] Read at least 2-3 related files based on retrieval results
- [ ] context.md includes symbol and dependency evidence

**External docs (for new tech or new project - required):**

- [ ] Ran Web Search queries at least 3 times
- [ ] Retrieved official doc links
- [ ] Retrieved code examples
- [ ] Captured at least 2 credible external references

### Output Quality Verification

- [ ] Internal: Identified related files and key symbols
- [ ] External: Retrieved current docs and examples
- [ ] Analyzed dependency relationships
- [ ] Evaluated technical feasibility

## Constraints

- No plan analysis (handled by multi-model-analyzer)
- No code generation (handled by prototype-generator)
- Internal retrieval must start from SearchCodebase, then Read evidence
- External retrieval must include verifiable URLs
