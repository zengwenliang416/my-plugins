---
name: multi-model-analyzer
description: |
  [Trigger] Dev workflow step 2: Multi-model parallel analysis of requirements to generate implementation plan.
  [Output] Outputs ${run_dir}/analysis-{model}.md containing implementation plan.
  [Skip] Context retrieval (use context-retriever), prototype generation (use prototype-generator).
  [Ask First] If context.md is missing, ask whether to execute context retrieval first
  [Mandatory Tool] Must invoke codex-cli or gemini-cli Skill, Claude self-analysis is prohibited.
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
---

# Multi-Model Analyzer - Multi-Model Analysis Atomic Skill

## 🚨 CRITICAL: Must Invoke codex-cli or gemini-cli Skill

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Prohibited: Claude doing analysis itself (skipping external │
│     model)                                                       │
│  ❌ Prohibited: Directly calling codeagent-wrapper via Bash     │
│  ✅ Required: Invoke codex-cli or gemini-cli via Skill tool     │
│                                                                  │
│  This is the core of multi-model collaboration!                  │
│  Claude cannot replace Codex/Gemini analysis!                    │
│                                                                  │
│  Execution order (must follow):                                  │
│  1. Read context.md                                              │
│  2. Skill invocation to codex-cli or gemini-cli                  │
│  3. Write external model output to analysis-{model}.md           │
│                                                                  │
│  If Step 2 is skipped, the entire multi-model collaboration     │
│  fails!                                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Responsibility Boundary

- **Input**: `run_dir` + `model` type
- **Output**: `${run_dir}/analysis-{codex|gemini}.md`
- **Single Responsibility**: Only do plan analysis, no code generation

## MCP Tool Integration

| MCP Tool              | Purpose                                         | Trigger     |
| --------------------- | ----------------------------------------------- | ----------- |
| `sequential-thinking` | Structured analysis strategy for plan coherence | 🚨 Required |

## Execution Flow

### Step 0: Structured Analysis Planning (sequential-thinking)

🚨 **Must first use sequential-thinking to plan analysis strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning multi-model analysis strategy. Need: 1) Understand context 2) Determine analysis perspective 3) Build analysis prompt 4) Evaluate tech choices 5) Identify risk points",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Context Understanding**: Extract core requirements and constraints from context.md
2. **Analysis Perspective**: Determine backend/frontend perspective based on model parameter
3. **Prompt Construction**: Build targeted prompts
4. **Tech Selection Evaluation**: Evaluate existing architecture and recommended solutions
5. **Risk Identification**: Identify potential technical risks and dependency conflicts

### Step 1: Read Context

```bash
# Read context
Read ${run_dir}/context.md
Extract: Requirements overview, related files, architecture patterns, dependency analysis
```

### Step 2: Build Analysis Prompt

Build focus areas based on model type:

| Model  | Analysis Perspective | Focus Areas                                     |
| ------ | -------------------- | ----------------------------------------------- |
| Codex  | Backend/Logic        | API design, data models, business logic, errors |
| Gemini | Frontend/UI          | Component structure, state mgmt, UX, styling    |

### Step 3: Invoke External Model Skill (🚨 Required)

**🚨🚨🚨 This is the critical step!**

**❌ Prohibited Actions:**

- ❌ Using Bash tool to call codeagent-wrapper
- ❌ Analyzing requirements yourself

**✅ Only Correct Approach: Use Skill tool**

**For Codex model (model=codex), execute immediately:**

```
Skill(skill="codex-cli", args="--role analyzer --prompt 'Analyze requirements and generate implementation plan. Context file path: ${RUN_DIR}/context.md. Please read that file first, then output: 1.Implementation overview 2.Tech selection recommendations 3.Key implementation steps 4.Potential risk points 5.Integration approach with existing code. OUTPUT FORMAT: Markdown'")
```

**For Gemini model (model=gemini), execute immediately:**

```
Skill(skill="gemini-cli", args="--role analyzer --prompt 'Analyze frontend requirements and generate UI implementation plan. Context file path: ${RUN_DIR}/context.md. Please read that file first, then output: 1.UI component structure 2.State management plan 3.Styling and responsive strategy 4.User interaction flow 5.Accessibility considerations. OUTPUT FORMAT: Markdown'")
```

**⚠️ If you find yourself using Bash to call codeagent-wrapper, stop immediately and use Skill tool instead!**

### Step 4: Structured Output

Write analysis results to `${run_dir}/analysis-{model}.md`:

```markdown
# {Codex|Gemini} Analysis Report

## Model Information

- Model: {codex|gemini}
- Perspective: {Backend/Logic|Frontend/UI}
- Analysis Time: [timestamp]

## Implementation Plan

### Overview

[One paragraph describing overall approach]

### Tech Selection

| Area        | Choice | Rationale |
| ----------- | ------ | --------- |
| Data Layer  | ...    | ...       |
| Logic Layer | ...    | ...       |
| API Layer   | ...    | ...       |

### Implementation Steps

1. **Step 1**: [Description]
   - Files involved: [File list]
   - Key code: [Pseudocode or interface]

2. **Step 2**: [Description]
   ...

### Risk Assessment

| Risk | Level        | Mitigation |
| ---- | ------------ | ---------- |
| ...  | High/Med/Low | ...        |

### Integration Plan

- Integration with existing module X: [Description]
- API contracts: [Interface definition]

---

Based on context: context.md
Next step: Invoke prototype-generator after synthesizing analysis
```

## Parallel Execution (Background Mode)

Supports multi-model parallel analysis, coordinated by orchestrator using Task tool:

```
# Orchestrator invocation
Task(skill="multi-model-analyzer", args="run_dir=${RUN_DIR} model=codex", run_in_background=true) &
Task(skill="multi-model-analyzer", args="run_dir=${RUN_DIR} model=gemini", run_in_background=true) &
wait
```

## Return Value

Upon completion, return:

```
{Model} analysis complete.
Output file: ${run_dir}/analysis-{model}.md
Plan overview: [One sentence]
Risk level: [High/Medium/Low]

Next step: Wait for all analyses to complete for synthesis
```

## Quality Gates

- ✅ Plan matches context
- ✅ Steps are executable (specific files and interfaces)
- ✅ Risks identified with mitigation measures
- ✅ Integration plan is clear

## Constraints

- No context retrieval (handled by context-retriever)
- No actual code generation (handled by prototype-generator)
- Analysis must be based on actual context.md content
- External model output is for reference, requires Claude final review

## 🚨 Mandatory Tool Verification

**After executing this Skill, the following conditions must be met:**

| Check Item            | Requirement | Verification Method                   |
| --------------------- | ----------- | ------------------------------------- |
| Skill invocation      | Required    | Check codex-cli or gemini-cli called  |
| External model output | Required    | analysis-{model}.md contains response |
| Claude self-analysis  | Prohibited  | Cannot skip Skill and write directly  |
| Direct Bash codeagent | Prohibited  | Must invoke via Skill tool            |

**If codex-cli or gemini-cli Skill was not invoked, this Skill execution fails!**
