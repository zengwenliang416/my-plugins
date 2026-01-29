---
name: prototype-generator
description: |
  [Trigger] Dev workflow step 3: Generate code prototype based on analysis plan.
  [Output] Outputs ${run_dir}/prototype-{model}.diff containing Unified Diff format code changes.
  [Skip] Analysis plan (use multi-model-analyzer), final implementation (use code-implementer).
  [Ask First] If analysis-{model}.md is missing, ask whether to execute requirements analysis first
  [Mandatory Tool] Must invoke codex-cli or gemini-cli Skill, Claude self-generation is prohibited.
allowed-tools:
  - Read
  - Write
  - Skill
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path (passed by orchestrator)
  - name: model
    type: string
    required: true
    description: Model type (codex or gemini)
  - name: focus
    type: string
    required: false
    description: Focus area (backend,api,logic or frontend,ui,styles)
---

# Prototype Generator - Prototype Generation Atomic Skill

## 🚨 CRITICAL: Must Invoke codex-cli or gemini-cli Skill

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Prohibited: Claude generating code itself (skipping         │
│     external model)                                              │
│  ❌ Prohibited: Directly calling codeagent-wrapper via Bash     │
│  ✅ Required: Invoke codex-cli or gemini-cli via Skill tool     │
│                                                                  │
│  This is the core of multi-model collaboration!                  │
│  Claude cannot replace Codex/Gemini generation!                  │
│                                                                  │
│  Execution order (must follow):                                  │
│  1. Read analysis-{model}.md                                     │
│  2. Skill invocation to codex-cli or gemini-cli                  │
│  3. Write external model output to prototype-{model}.diff        │
│                                                                  │
│  If Step 2 is skipped, the entire multi-model collaboration     │
│  fails!                                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Responsibility Boundary

- **Input**: `run_dir` + `model` + `focus`
- **Output**:
  - Parallel mode: `${run_dir}/prototype-{codex|gemini}.diff`
  - After merge: `${run_dir}/prototype.diff`
- **Single Responsibility**: Only do prototype generation, no final implementation

## MCP Tool Integration

| MCP Tool              | Purpose                                          | Trigger     |
| --------------------- | ------------------------------------------------ | ----------- |
| `sequential-thinking` | Structured prototype generation for code quality | 🚨 Required |

## Execution Flow

### Step 0: Structured Generation Planning (sequential-thinking)

🚨 **Must first use sequential-thinking to plan generation strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning prototype generation strategy. Need: 1) Understand analysis plan 2) Determine code structure 3) Identify dependencies 4) Plan file organization 5) Define interface contracts",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Analysis Plan Understanding**: Extract implementation steps from analysis-{model}.md
2. **Code Structure**: Determine module/class/function organization
3. **Dependency Identification**: Identify internal modules and external library dependencies
4. **File Organization Planning**: Determine new/modified file list
5. **Interface Contract Definition**: Define inter-module communication interfaces

### Step 1: Read Analysis Report

```bash
Read ${run_dir}/analysis-{model}.md
Extract: Implementation plan, tech selection, implementation steps
```

### Step 2: Determine Routing Strategy

Select corresponding Skill based on model parameter:

| model  | Skill      | Focus Areas                   |
| ------ | ---------- | ----------------------------- |
| codex  | codex-cli  | backend, api, logic, security |
| gemini | gemini-cli | frontend, ui, styles, ux      |

### Step 3: Invoke External Model Skill (🚨 Required)

**🚨🚨🚨 This is the critical step!**

**❌ Prohibited Actions:**

- ❌ Using Bash tool to call codeagent-wrapper
- ❌ Generating code yourself
- ❌ Using Write tool to write code

**✅ Only Correct Approach: Use Skill tool**

**For Codex model (model=codex), execute immediately:**

```
Skill(skill="codex-cli", args="--role architect --prompt 'Generate code based on analysis plan. Analysis report path: ${RUN_DIR}/analysis-codex.md. Please read that file first, then generate code. Requirements: 1.Complete code changes 2.Follow project code style 3.Include type definitions 4.Add key comments. OUTPUT FORMAT: Unified Diff Patch ONLY, no explanations'")
```

**For Gemini model (model=gemini), execute immediately:**

```
Skill(skill="gemini-cli", args="--role frontend --prompt 'Generate frontend code based on analysis plan. Analysis report path: ${RUN_DIR}/analysis-gemini.md. Please read that file first, then generate code. Requirements: 1.React component code 2.Tailwind CSS styles 3.Responsive design 4.Accessibility considerations. OUTPUT FORMAT: Unified Diff Patch ONLY, no explanations'")
```

**⚠️ If you find yourself using Bash or Write to write code, stop immediately and use Skill tool instead!**

### Step 4: Handle Parallel Results (fullstack tasks)

```bash
if task_type == fullstack:
    Wait for both models to complete
    Merge diffs (handle conflicts)
    Mark sections requiring manual review
```

### Step 5: Output Prototype

Write generated diff to `${run_dir}/prototype-{model}.diff`:

```diff
# Prototype Diff
# Generated by: {codex|gemini}
# Task type: {frontend|backend|fullstack}
# Generated at: [timestamp]

diff --git a/src/foo.ts b/src/foo.ts
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -10,6 +10,15 @@ export class Foo {
+  // New method
+  async newMethod(): Promise<void> {
+    // Implementation logic
+  }

diff --git a/src/bar.ts b/src/bar.ts
...
```

## Parallel Execution (Background Mode)

Supports parallel generation for fullstack tasks, coordinated by orchestrator using Task tool:

```
# Orchestrator invocation
Task(skill="prototype-generator", args="run_dir=${RUN_DIR} model=codex focus=backend,api,logic", run_in_background=true) &
Task(skill="prototype-generator", args="run_dir=${RUN_DIR} model=gemini focus=frontend,ui,styles", run_in_background=true) &
wait
# Merge results → prototype.diff
```

Output files:

- `${run_dir}/prototype-codex.diff` (backend prototype)
- `${run_dir}/prototype-gemini.diff` (frontend prototype)
- `${run_dir}/prototype.diff` (merged)

## Return Value

Upon completion, return:

```
Prototype generation complete.
Output file: ${run_dir}/prototype-{model}.diff
Files changed: X
Lines added: +Y
Lines deleted: -Z
Generated by: {codex|gemini}

⚠️ Note: This is a "dirty prototype", requires refactoring via code-implementer before applying

Next step: Use code-implementer for refactoring implementation
```

## Quality Gates

- ✅ Diff format is valid
- ✅ Files involved match analysis report
- ✅ Code syntax is correct (compilable)
- ✅ No obvious security vulnerabilities

## Constraints

- No requirements analysis (handled by multi-model-analyzer)
- No final implementation (handled by code-implementer)
- Output must be Unified Diff format
- Prototype is treated as "dirty code", requires Claude review and refactoring
- External model has no write permission, only generates diff

## 🚨 Mandatory Tool Verification

**After executing this Skill, the following conditions must be met:**

| Check Item             | Requirement | Verification Method                  |
| ---------------------- | ----------- | ------------------------------------ |
| Skill invocation       | Required    | Check codex-cli or gemini-cli called |
| External model output  | Required    | prototype-{model}.diff contains resp |
| Claude self-generation | Prohibited  | Cannot skip Skill and write directly |
| Direct Bash codeagent  | Prohibited  | Must invoke via Skill tool           |

**If codex-cli or gemini-cli Skill was not invoked, this Skill execution fails!**
