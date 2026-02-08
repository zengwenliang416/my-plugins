---
name: code-implementer
description: |
  [Trigger] Dev workflow step 4: Refactor prototype and implement code into the project.
  [Output] Outputs ${run_dir}/changes.md + actual code changes.
  [Skip] Prototype generation (use prototype-generator), audit review (use audit-reviewer).
  [Ask First] If prototype-{model}.diff is missing, ask whether to execute prototype generation first
  [Mandatory Tool] Must invoke codex-cli or gemini-cli Skill to refactor prototype, Claude self-implementation is prohibited.
---

# Code Implementer - Code Implementation Atomic Skill

## 🚨 CRITICAL: Must Invoke codex-cli or gemini-cli Skill

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Prohibited: Claude implementing code itself (skipping       │
│     external model)                                              │
│  ❌ Prohibited: Directly calling codeagent-wrapper via Terminal │
│  ✅ Required: Invoke codex-cli or gemini-cli                    │
│                                                                  │
│  This is the core of multi-model collaboration!                  │
│  Claude cannot replace Codex/Gemini implementation!              │
│                                                                  │
│  Execution order (must follow):                                  │
│  1. Read 工具读取 prototype-{model}.diff                        │
│  2. 调用 /codex-cli 或 /gemini-cli 进行重构                     │
│  3. Verify and apply changes, write to changes.md                │
│                                                                  │
│  If Step 2 is skipped, the entire multi-model collaboration     │
│  fails!                                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Responsibility Boundary

- **Input**: `run_dir` + `model` + `focus` (contains `${run_dir}/prototype-{model}.diff`)
- **Output**: Actual code changes + `${run_dir}/changes-{model}.md`
- **Single Responsibility**: Only do code refactoring and implementation, no analysis or audit
- **Core Principle**: External model refactors prototype, Claude verifies and applies

## MCP Tool Integration

| MCP Tool | Purpose | Trigger |
| -------- | ------- | ------- |

## Execution Flow

```
  thought: "Planning code implementation strategy. Need: 1) Understand prototype content 2) LSP impact analysis 3) Identify refactoring points 4) Plan application order 5) Define verification strategy",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Prototype Content Understanding**: Extract changes from prototype-{model}.diff
2. **LSP Impact Analysis**: Use LSP to confirm references for each symbol
3. **Refactoring Point Identification**: Identify parts of prototype needing refactoring
4. **Application Order Planning**: Determine file modification order to avoid circular dependencies
5. **Verification Strategy**: Plan type checking, syntax checking, tests

### Step 1: Read Prototype

```bash
Read 工具读取 ${run_dir}/prototype-{model}.diff
Parse: Files involved, change content, additions/deletions
```

### Step 2: Use LSP to Confirm Impact Scope (🚨 Required)

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨🚨🚨 Must call LSP before modifying any code! 🚨🚨🚨          │
│                                                                  │
│  For each symbol/file to modify, must execute:                   │
│                                                                  │
│  1. LSP.findReferences(symbol)  - Confirm impact (who uses it?) │
│  2. LSP.goToDefinition(symbol)  - Confirm definition location   │
│  3. LSP.incomingCalls(func)     - Who calls this function?      │
│  4. LSP.outgoingCalls(func)     - What does this function call? │
│                                                                  │
│  Skipping LSP and directly modifying code = Workflow failure!    │
└─────────────────────────────────────────────────────────────────┘
```

**Execute LSP call sequence immediately:**

```
# For each symbol to modify in prototype.diff
LSP(operation="findReferences", filePath="<file>", line=<line>, character=<char>)
LSP(operation="goToDefinition", filePath="<file>", line=<line>, character=<char>)

# For functions/methods, additional calls
LSP(operation="incomingCalls", filePath="<file>", line=<line>, character=<char>)
LSP(operation="outgoingCalls", filePath="<file>", line=<line>, character=<char>)
```

**Verification**: changes.md must contain LSP impact analysis

### Step 3: Invoke External Model to Refactor Prototype (🚨 Required)

**🚨🚨🚨 This is the critical step!**

**❌ Prohibited Actions:**

- ❌ Using Terminal to call codeagent-wrapper
- ❌ Implementing code yourself
- ❌ Using Write/Edit tool to directly write code

**✅ Only Correct Approach: Invoke skill**

**For Codex model (backend implementation), execute immediately:**

```
调用 /codex-cli，参数："--role architect --prompt 'Refactor and improve prototype code. Prototype file path: ${RUN_DIR}/prototype-codex.diff. Please read that file first, then refactor. Requirements: 1.Adjust to project code style 2.Remove redundancy 3.Add type definitions 4.Enhance error handling 5.Fix security vulnerabilities. OUTPUT FORMAT: Unified Diff Patch + change notes'"
```

**For Gemini model (frontend implementation), execute immediately:**

```
调用 /gemini-cli，参数："--role frontend --prompt 'Refactor and improve prototype code. Prototype file path: ${RUN_DIR}/prototype-gemini.diff. Please read that file first, then refactor. Requirements: 1.Adjust to project code style 2.Optimize component structure 3.Improve styling 4.Ensure responsiveness 5.Enhance accessibility. OUTPUT FORMAT: Unified Diff Patch + change notes'"
```

**⚠️ If you find yourself using Terminal/Write/Edit to write code, stop immediately and use skill invocation instead!**

### Step 4: Verify Refactoring Results

External model returns refactored diff, Claude verifies:

| Check Item          | Action            |
| ------------------- | ----------------- |
| Diff format valid   | Ensure applicable |
| Code syntax correct | Syntax check      |
| Type definitions    | Type check        |
| No vulnerabilities  | Security scan     |
| Follows standards   | Style check       |

### Step 5: Apply Changes

```bash
for each file_change in refactored_diff:
    Read 工具读取 target file
    使用 Edit 工具应用 changes
    Verify change correctness
```

### Step 6: Verification

Terminal command:

```bash
# Type check (if applicable)
if [ -f "tsconfig.json" ]; then
    npx tsc --noEmit
fi

# Syntax check (if applicable)
if [ -f "package.json" ]; then
    npm run lint 2>/dev/null || true
fi
```

### Step 7: Output Change List

使用 Edit 工具写入 `${run_dir}/changes-{model}.md`:

```markdown
# Code Implementation Report ({model})

## Implementation Overview

- Based on prototype: prototype-{model}.diff
- Implementation model: {codex|gemini}
- Implementation time: [timestamp]
- Focus area: {focus}

## Change List

### New Files

| File       | Description      | Lines |
| ---------- | ---------------- | ----- |
| src/new.ts | New feature impl | 50    |

### Modified Files

| File             | Change Type | Description      |
| ---------------- | ----------- | ---------------- |
| src/foo.ts:20-35 | New method  | Added newMethod  |
| src/bar.ts:10    | Import      | Imported new dep |

### Deleted Files

None

## Refactoring Notes

| Prototype Content | Refactoring Change   | Reason                 |
| ----------------- | -------------------- | ---------------------- |
| Direct throw      | Custom error wrapper | Unified error handling |
| any type          | Concrete type def    | Type safety            |

## Verification Results

- [x] Type check passed
- [x] Syntax check passed
- [ ] Unit tests (pending)

---

Next step: Invoke audit-reviewer for audit
```

## Parallel Execution (Background Mode)

Supports dual-model parallel implementation, coordinated by orchestrator using Task tool:

```
# Orchestrator invocation
调用 @code-implementer，参数："run_dir=${RUN_DIR} model=codex focus=backend,api,logic"（后台执行）
调用 @code-implementer，参数："run_dir=${RUN_DIR} model=gemini focus=frontend,ui,styles"（后台执行）
# Wait for completion and merge change lists
```

Output files:

- `${run_dir}/changes-codex.md` (backend changes)
- `${run_dir}/changes-gemini.md` (frontend changes)
- `${run_dir}/changes.md` (merged)

## Return Value

Upon completion, return:

```
Code implementation complete ({model}).
Output file: ${run_dir}/changes-{model}.md
Files changed: X
Lines added: +Y
Lines deleted: -Z

✅ Type check: Passed
✅ Syntax check: Passed

Next step: Use audit-reviewer for audit
```

## Quality Gates

- ✅ 🚨 Called LSP (findReferences + goToDefinition) at least 3 times before modification
- ✅ changes.md contains LSP impact analysis
- ✅ All changes applied
- ✅ Type check passed
- ✅ No breaking changes (unless explicitly required)
- ✅ Code style follows project standards

## Constraints

- No requirements analysis (handled by multi-model-analyzer)
- No prototype generation (handled by prototype-generator)
- No audit (handled by audit-reviewer)
- Must use LSP to confirm impact scope before modification
- Each change must be traceable (recorded in changes.md)

## 🚨 Mandatory Tool Verification

**After executing this Skill, the following conditions must be met:**

| Check Item            | Requirement | Verification Method                  |
| --------------------- | ----------- | ------------------------------------ |
| Skill invocation      | Required    | Check codex-cli or gemini-cli called |
| External model output | Required    | changes-{model}.md contains result   |
| Claude self-impl      | Prohibited  | Cannot skip Skill and write code     |
| Direct Terminal call  | Prohibited  | Must invoke via skill                |

**If codex-cli or gemini-cli Skill was not invoked, this Skill execution fails!**
