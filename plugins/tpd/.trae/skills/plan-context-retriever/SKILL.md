---
name: plan-context-retriever
description: |
  [Trigger] Plan workflow Step 2: Retrieve code context related to requirements.
  [Output] Outputs ${run_dir}/context.md.
  [🚨 Mandatory Tool 🚨] Use Trae native SearchCodebase as first choice for internal retrieval.
  [Prohibited] Skipping SearchCodebase and directly doing blind file browsing.
  [Skip] Direct analysis (use architecture-analyzer).
---

# Plan Context Retriever - Context Retrieval Atomic Skill

## Responsibility Boundary

- **Input**: `run_dir` + `${run_dir}/requirements.md`
- **Output**: `${run_dir}/context.md`
- **Single Responsibility**: Only do context retrieval, no architecture analysis

## Tool Integration

| Tool | Purpose | Trigger |
| --- | --- | --- |
| `SearchCodebase` | 代码语义定位（首选） | Existing project internal retrieval |
| `Read` | 精读命中代码并提炼证据 | After SearchCodebase returns candidates |
| `Web Search` | 新技术/空项目时补充外部依据 | New project or best-practice lookup |

## Execution Flow

```
thought: "Planning context retrieval strategy. Need: 1) Analyze requirement keywords 2) Determine retrieval scope 3) Run SearchCodebase 4) Consolidate evidence with Read 5) Produce context.md"
```

### Step 1: Read Requirements

使用 Read 工具读取 `${run_dir}/requirements.md`，提取：

- 功能需求列表
- 技术约束
- 任务类型（frontend/backend/fullstack）

### Step 2: Determine Project Status

Terminal command: `find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) | wc -l`

| Status | Criteria | Retrieval Strategy |
| --- | --- | --- |
| New project | Code files < 10 | Web Search + Read |
| Existing project | Code files >= 10 | SearchCodebase + Read |

### Step 3: Internal Code Retrieval (Existing Project)

## 🚨 Mandatory Priority

| Priority | Tool | Purpose | Mandatory |
| --- | --- | --- | --- |
| 1 | `SearchCodebase` | Semantic code retrieval | Must use first |
| 2 | `Read` | Verify and extract evidence from matched files | Must follow |
| 3 | `Grep/Glob` | Supplemental exact-match lookup | Optional fallback |

**Prohibited Actions**:

- ❌ Skipping SearchCodebase and using only Grep/Glob
- ❌ Writing context without concrete code evidence
- ❌ Only listing filenames without key symbol notes

**Mandatory query template**:

```
使用 SearchCodebase："Find code related to <functional requirement>:
- Related classes/functions/modules
- Data models and interface definitions
- Existing similar implementations
- External library dependencies
- Configuration files and env vars"
```

### Step 4: Evidence Consolidation (Read-based)

对 SearchCodebase 高相关命中执行 Read，并记录：

- 关键文件（路径 + relevance）
- 关键符号（名称 + 定位）
- 依赖关系（上游调用/下游依赖）
- 约束点（鉴权、事务、幂等、超时、重试等）

### Step 5: External Documentation Retrieval (when needed)

调用 Web Search（至少 3 次），覆盖：

- 官方文档
- 高质量示例仓库
- 生产最佳实践

并用 Read 固化来源和关键结论。

### Step 6: Structured Output

使用 Edit 工具写入 `${run_dir}/context.md`:

```markdown
# Context Retrieval Report

## Metadata

- Retrieval Time: [timestamp]
- Project Status: [New project|Existing project]
- Retrieval Scope: [Internal|External|Mixed]

## Requirement Overview

[Core requirement extracted from requirements.md]

## Internal Code Context (SearchCodebase + Read)

### Related Files

| File Path | Relevance | Key Symbols | Description |
| --- | --- | --- | --- |
| src/auth/login.ts | High | authenticateUser | Core auth logic |

### Architecture/Dependency Notes

- Current architecture: [identified pattern]
- Key interfaces: [interface list]
- Dependency chain: [caller → callee]

## External Documentation Context

### Reference Materials

| Source | Title | Relevance | Key Points |
| --- | --- | --- | --- |
| [URL] | [Title] | High/Medium/Low | [Key information] |

### Best Practices

- [Best practice from source]

## Potential Impact

- Potentially affected modules: [list]
- Files requiring modification: [list]
- Test coverage status: [existing tests]

## Evidence Chain

[Structured JSON evidence]

---

Next step: Call architecture-analyzer for architecture analysis
```

## Return Value

```
Context retrieval complete.
Output file: ${run_dir}/context.md
Project status: [New project|Existing project]
Related files: X
External references: Y

Next step: Use /architecture-analyzer for architecture analysis
```

## Quality Gates

- ✅ SearchCodebase called at least once for existing project
- ✅ Read used to verify key matches
- ✅ Captured file/symbol/dependency evidence
- ✅ External references included when needed

## Constraints

- Do not do architecture analysis (delegated to architecture-analyzer)
- Do not generate code (delegated to subsequent phases)
- Output must be evidence-based, not assumption-based
