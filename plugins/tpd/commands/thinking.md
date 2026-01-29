---
description: "Deep Thinking Workflow: Complexity assessment → Context boundary exploration → Constraint integration → Conclusion generation → Handoff summary. Supports auto/light/deep/ultra."
argument-hint: "[--depth=auto|light|deep|ultra] [--parallel] [--verbose] <problem description>"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Write
  - Bash
  - Task
  - mcp__sequential-thinking__sequentialthinking
  - mcp__auggie-mcp__codebase-retrieval
---

# /tpd:thinking - Deep Thinking Workflow Command

## Overview

Integrates Claude Code ultrathink, Codex-CLI reasoning, and Gemini Deep Think - three thinking modes providing multi-level, multi-perspective deep analysis capabilities.

**Core Features**:

- **Smart Routing**: Automatically selects thinking depth based on problem complexity
- **Multi-Boundary Parallel**: Parallel exploration by context boundaries, forming constraint sets
- **Multi-Model Supplementation**: Codex/Gemini provide supplementary perspectives on constraints and risks
- **Thinking Visualization**: Complete display of reasoning chains and thinking processes
- **Conclusion Integration**: Synthesizes multi-model outputs to generate high-quality conclusions

---

## Core Philosophy (Aligned with GudaSpec Research)

- **Output is Constraint Set**: Output "constraint set + verifiable success criteria", not information piles
- **Convergence Direction**: Constraints are for "excluding directions", enabling zero-decision execution in subsequent plan
- **No Architecture Decisions**: Only expose constraints, risks, and questions to be confirmed
- **OpenSpec Rules**: thinking phase **writes directly to `openspec/` specification**, does not modify project code

## Guardrails (Must Follow)

- **Forbidden to split sub-agents by role** (e.g., "architect/security expert")
- **Must split by context boundary** (module/directory/domain)
- **Must use `mcp__auggie-mcp__codebase-retrieval`** for semantic retrieval
- **Sub-agent output must follow unified JSON template** (see Phase 3)
- **Forbidden to modify project code** (allowed to write to `openspec/` specification files)

---

## 🚨🚨🚨 Mandatory Execution Rules (Cannot Skip)

**You must follow the Phase order below, using the Skill tool to call the corresponding skill.**

**Forbidden Actions (Workflow fails if violated):**

- ❌ Skip Skill calls and analyze directly
- ❌ Omit any Phase
- ❌ Not exploring by context boundaries (deep/ultra must be parallel)
- ❌ Not using sequential-thinking for structured reasoning
- ❌ Modifying project business code (allowed to write to `openspec/` specification files)

**For each Phase you must:**

1. Call the specified Skill (using the Skill tool)
2. Wait for Skill execution to complete
3. **Verify output file exists**
4. Then proceed to the next Phase

### Execution Model

```
┌─────────────────────────────────────────────────────────────────┐
│  Auto Execute (No asking)     │  Hard Stop (Must ask)           │
├─────────────────────────────────────────────────────────────────┤
│  Phase 1 → Phase 2            │  ⏸️ Phase 2: Depth confirm (opt) │
│  Phase 3 → Phase 4            │  ⏸️ Phase 4: Constraint clarify  │
│  Phase 4 → Phase 5            │  ⏸️ Phase 5: Conclusion confirm  │
│  Phase 5 → Phase 6            │     (ultra mode)                │
└─────────────────────────────────────────────────────────────────┘
```

### Phase Flow

```
Phase 1: Initialization   → Create THINKING_DIR, parse arguments
Phase 2: Complexity       → Skill("complexity-analyzer")
                          → If --depth not specified, auto-route or ask user
Phase 3: Context Explore  → Semantic retrieval + boundary split + parallel sub-agent exploration + multi-model constraint analysis
Phase 4: Constraint Integ → Skill("thought-synthesizer")
                          → Aggregate constraints/risks/dependencies/success criteria
Phase 5: Conclusion Gen   → Skill("conclusion-generator")
                          → Generate reasoning chain and final conclusion
Phase 6: Delivery         → Output thinking report
```

> For complete reasoning chains or raw outputs, use `--verbose` or directly view files in run_dir.

---

## Phase 1: Initialization

### Argument Parsing

| Option          | Description                             | Default |
| --------------- | --------------------------------------- | ------- |
| `--depth=value` | Thinking depth (auto/light/deep/ultra)  | auto    |
| `--parallel`    | Force multi-model parallel (even light) | false   |
| `--verbose`     | Verbose output of thinking process      | false   |

### Parsing Logic

```bash
# Initialize options
DEPTH="auto"
PARALLEL=false
VERBOSE=false

# Parse each option
[[ "$ARGUMENTS" =~ --depth=([^ ]+) ]] && DEPTH="${BASH_REMATCH[1]}"
[[ "$ARGUMENTS" =~ --parallel ]] && PARALLEL=true
[[ "$ARGUMENTS" =~ --verbose ]] && VERBOSE=true

# Extract problem description
QUESTION=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
```

### OpenSpec Status Check (Required)

OpenSpec must also be bound in the thinking phase:

```bash
openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
```

If OpenSpec not initialized:

- Prompt user to first execute `/tpd:init`
- Continue Phase 2 after completion

### Generate proposal_id (Only for artifact path, not for workflow chaining)

```bash
RAW_SLUG=$(echo "$QUESTION" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g')
SHORT_ID=$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 6)

if [[ -n "$RAW_SLUG" ]] && [[ "$RAW_SLUG" =~ ^[a-z][a-z0-9-]{2,50}$ ]]; then
  PROPOSAL_ID="$RAW_SLUG"
else
  PROPOSAL_ID="add-${SHORT_ID}"
fi
```

### Run Directory Creation (Fixed path, under OpenSpec)

```bash
THINKING_ID=$(date -u +%Y%m%dT%H%M%SZ)
THINKING_DIR="openspec/changes/${PROPOSAL_ID}/artifacts/thinking"
mkdir -p "$THINKING_DIR"

```

**Note**: THINKING_ID is only written to state.json as a record, does not participate in path or workflow chaining

### Create State File

```bash
cat > "${THINKING_DIR}/state.json" << EOF
{
  "domain": "thinking",
  "workflow_id": "${THINKING_ID}",
  "proposal_id": "${PROPOSAL_ID}",
  "question": "${QUESTION}",
  "options": {
    "depth": "${DEPTH}",
    "parallel": ${PARALLEL},
    "verbose": ${VERBOSE}
  },
  "phases": [
    {"id": "initialization", "status": "completed"},
    {"id": "complexity-analysis", "status": "pending"},
    {"id": "multi-model-thinking", "status": "pending"},
    {"id": "thought-synthesis", "status": "pending"},
    {"id": "conclusion-generation", "status": "pending"},
    {"id": "delivery", "status": "pending"}
  ],
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "$QUESTION" > "${THINKING_DIR}/input.md"
```

**🚨 Execute Phase 2 immediately after completion!**

---

## Phase 2: Complexity Assessment

### 🚨🚨🚨 Mandatory Execution 🚨🚨🚨

**Call Skill immediately:**

```
Skill(skill="tpd:complexity-analyzer", args="run_dir=${THINKING_DIR}")
```

**Skill Execution Content**:

1. Use `mcp__sequential-thinking__sequentialthinking` to analyze the problem
2. Assess complexity dimensions:
   - Problem length and structure
   - Domain depth
   - Number of reasoning steps
   - Degree of ambiguity
3. Output complexity score and recommended depth

**Verify**: Confirm `${THINKING_DIR}/complexity-analysis.md` is generated

### Depth Routing Rules (Only effective when `DEPTH=auto`)

| Complexity Score | Recommended Depth | Trigger Condition                                                           |
| ---------------- | ----------------- | --------------------------------------------------------------------------- |
| 1-3              | light             | Simple Q&A, fact queries, single-step tasks                                 |
| 4-6              | deep              | Requires reasoning, comparative analysis, medium complexity design          |
| 7-10             | ultra             | Complex architecture, multi-step reasoning, requires multi-domain knowledge |

### Keyword Triggers (Override auto-routing)

| User Input Keywords                                 | Forced Depth |
| --------------------------------------------------- | ------------ |
| "think about it", "think", "simple analysis"        | light        |
| "think carefully", "think hard", "deep analysis"    | deep         |
| "deep dive", "ultrathink", "comprehensive analysis" | ultra        |

### ⏸️ Optional Hard Stop

**If `--depth=auto` and complexity score is between 4-6**, use AskUserQuestion:

```
Question: Recommend using Deep thinking mode, confirm?
Options:
  - Deep Thinking (Recommended) - Multi-model parallel, 30-60 seconds
  - Light Thinking - Fast response, 5-15 seconds
  - Ultra Thinking - Deepest analysis, 60-180 seconds
```

**🚨 Execute Phase 3 immediately after confirmation!**

---

## Phase 3: Context Boundary Exploration + Multi-Model Analysis (Aligned with Research)

### 🚨🚨🚨 Mandatory Execution - Core Phase 🚨🚨🚨

**Goal**: Explore codebase by context boundaries, output **constraint sets**, and use multi-model to supplement constraints/risks/success criteria.

### Step 3.1 Initial Assessment (Must use auggie)

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Quickly identify the main module/directory boundaries, core domains, and configuration scopes of this project for splitting context boundary exploration."
})
```

### Step 3.2 Define Context Boundaries (Forbidden to split by role)

**Boundary examples (examples only, must be based on codebase):**

- user-domain (user-related models/services/UI)
- auth-session (authentication/session/middleware)
- config-infra (configuration/deployment/build scripts)

**Write boundary list to**: `${THINKING_DIR}/boundaries.json`

Example structure:

```json
{
  "boundaries": [
    { "id": "user-domain", "scope": "user-related models/services/UI" },
    { "id": "auth-session", "scope": "authentication/session/middleware" }
  ]
}
```

**Decision Principles**:

- If code spans multiple subdirectories/modules → **must parallel** split boundaries
- If scale is small/single directory → can keep only 1 core boundary

### Step 3.3 Sub-agent Parallel Exploration (Unified JSON Template)

**Unified Output Template (must be consistent)**:

```json
{
  "module_name": "string - context boundary explored",
  "existing_structures": ["..."],
  "existing_conventions": ["..."],
  "constraints_discovered": ["..."],
  "open_questions": ["..."],
  "dependencies": ["..."],
  "risks": ["..."],
  "success_criteria_hints": ["..."]
}
```

#### Light Mode (Single Boundary)

```
Skill(skill="tpd:context-explorer", args="run_dir=${THINKING_DIR} boundary=<boundaries[0].id>")
```

#### Deep/Ultra Mode (Multi-Boundary Parallel)

> The following are examples only, actual boundaries must be based on `boundaries.json`.

```
Task(
  subagent_type="general-purpose",
  description="Explore boundary: user-domain",
  prompt="Skill(skill=\"tpd:context-explorer\", args=\"run_dir=${THINKING_DIR} boundary=user-domain scope=user-related models/services/UI\")",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Explore boundary: auth-session",
  prompt="Skill(skill=\"tpd:context-explorer\", args=\"run_dir=${THINKING_DIR} boundary=auth-session scope=authentication/session/middleware\")",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Explore boundary: config-infra",
  prompt="Skill(skill=\"tpd:context-explorer\", args=\"run_dir=${THINKING_DIR} boundary=config-infra scope=configuration/deployment/build scripts\")",
  run_in_background=true
)
```

### Step 3.4 Multi-Model Constraint Analysis (Deep/Ultra Must Execute)

**Principle**: Only do constraint/risk/success criteria analysis, **forbidden to generate code or modify project**.

```
Task(
  subagent_type="general-purpose",
  description="Codex constraints analysis",
  prompt="Skill(skill=\"tpd:codex-thinker\", args=\"run_dir=${THINKING_DIR} level=low\")",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Gemini constraints analysis",
  prompt="Skill(skill=\"tpd:gemini-thinker\", args=\"run_dir=${THINKING_DIR} level=medium\")",
  run_in_background=true
)
```

Light mode can skip; if multi-model supplementation needed, use `--parallel` to force execution.

### Verification Checklist

**After Phase 3 completion, verify:**

- [ ] `${THINKING_DIR}/boundaries.json` is generated
- [ ] `${THINKING_DIR}/explore-*.json` at least 1 exists
- [ ] Deep/Ultra: `${THINKING_DIR}/codex-thought.md` and `${THINKING_DIR}/gemini-thought.md` are generated
- [ ] Output JSON conforms to template

**🚨 Execute Phase 4 immediately after verification passes!**

---

## Phase 4: Constraint Integration

### 🚨🚨🚨 Mandatory Execution 🚨🚨🚨

**Call Skill immediately:**

```
Skill(skill="tpd:thought-synthesizer", args="run_dir=${THINKING_DIR} depth=${DEPTH}")
```

**Skill Execution Content**:

1. Read `${THINKING_DIR}/explore-*.json` (core input)
2. If \*-thought.md exists, can use as supplementary perspective
3. Use sequential-thinking for structured integration:
   - Aggregate hard/soft constraints
   - Summarize open questions and ambiguity points
   - Aggregate dependencies and risks
   - Form verifiable success criteria hints
4. Generate integration report (synthesis.md)

**Verify**: Confirm `${THINKING_DIR}/synthesis.md` is generated

**⏸️ Constraint Clarification Hard Stop**:

- If synthesis.md contains open_questions, must use AskUserQuestion for clarification
- Write user answers to `${THINKING_DIR}/clarifications.md`

**🚨 Execute Phase 5 after confirmation!**

---

## Phase 5: Conclusion Generation

### 🚨🚨🚨 Mandatory Execution 🚨🚨🚨

**Call Skill immediately:**

```
Skill(skill="tpd:conclusion-generator", args="run_dir=${THINKING_DIR}")
```

**Skill Execution Content**:

1. Generate final conclusion based on integration results
2. Build complete reasoning chain
3. Mark confidence level
4. List key assumptions and limitations

**Verify**: Confirm `${THINKING_DIR}/conclusion.md` is generated

### ⏸️ Ultra Mode Hard Stop

**If Ultra mode**, display conclusion summary and ask:

```
Question: Deep analysis complete, need to further explore any direction?
Options:
  - Accept current conclusion
  - Deep dive into divergence points
  - Explore alternative solutions
```

**🚨 Execute Phase 6 after confirmation!**

---

## Phase 6: Handoff and Delivery

### 🚨🚨🚨 Mandatory Execution 🚨🚨🚨

**Call Skill immediately:**

```
Skill(skill="tpd:handoff-generator", args="run_dir=${THINKING_DIR}")
```

**Verify**: Confirm `${THINKING_DIR}/handoff.md` and `${THINKING_DIR}/handoff.json` are generated

---

### Output Completion Summary (Default concise, avoid context overhead)

```
🧠 Deep Thinking Complete!

📋 Question: ${QUESTION}
📋 Proposal: ${PROPOSAL_ID}
🔬 Thinking Depth: ${DEPTH}
⏱️ Duration: ${ELAPSED_TIME}

📊 Thinking Metrics:
- Models Participated: ${MODEL_COUNT}
- Reasoning Steps: ${REASONING_STEPS}
- Confidence: ${CONFIDENCE}%

🎯 Core Conclusion:
${CONCLUSION_SUMMARY}

📦 Handoff Summary:
- Constraints: See ${THINKING_DIR}/handoff.md
- Non-Goals: See ${THINKING_DIR}/handoff.md
- Success Criteria: See ${THINKING_DIR}/handoff.md
- Acceptance Standards: See ${THINKING_DIR}/handoff.md

➡️ Next Phase Suggestions:
1) /tpd:plan
2) OpenSpec path and proposal_id in ${THINKING_DIR}/handoff.json (written to openspec/)
3) After plan completion, proceed to /tpd:dev or /refactor

💡 Context Control Tip: After completing thinking, you can use `/clear` to start a new session before entering plan.

📁 Artifacts:
  ${THINKING_DIR}/
  ├── input.md                # Original question
  ├── complexity-analysis.md  # Complexity assessment
  ├── boundaries.json         # Boundary list
  ├── explore-*.json          # Boundary exploration output (multiple)
  ├── synthesis.md            # Constraint integration
  ├── clarifications.md       # User clarifications (if any)
  ├── codex-thought.md        # Codex constraint supplement (deep/ultra)
  ├── gemini-thought.md       # Gemini constraint supplement (deep/ultra)
  ├── conclusion.md           # Final conclusion
  ├── handoff.md              # Handoff summary
  └── handoff.json            # Handoff structured data
```

OpenSpec specification will be written to:

```
openspec/changes/${PROPOSAL_ID}/
```

---

## Thinking Depth Comparison

| Feature              | Light                      | Deep                    | Ultra                                   |
| -------------------- | -------------------------- | ----------------------- | --------------------------------------- |
| Boundary Count       | 1                          | 2-3                     | 3-5                                     |
| Parallel Subagents   | None/Few                   | Medium parallel         | High parallel                           |
| Expected Duration    | 5-15s                      | 30-60s                  | 60-180s                                 |
| Applicable Scenarios | Simple needs/small changes | Medium complexity needs | Complex architecture/multi-module needs |

---

## Run Directory Structure

```
openspec/changes/<proposal_id>/artifacts/thinking/
├── state.json               # Workflow state
├── input.md                 # Original question
├── complexity-analysis.md   # Phase 2 output
├── claude-thought.md        # Phase 3 output
├── codex-thought.md         # Phase 3 output (deep/ultra)
├── gemini-thought.md        # Phase 3 output (deep/ultra)
├── synthesis.md             # Phase 4 output
├── conclusion.md            # Phase 5 output
├── handoff.md               # Phase 6 output
└── handoff.json             # Phase 6 output
```

---

## Error Handling

### Model Call Failure

```
⚠️ ${MODEL} Thinking Failed

Error: ${ERROR_MESSAGE}

Handling:
- Continue with other model results
- Mark missing perspective in synthesis.md
```

### Thinking Timeout

```
⚠️ Thinking Timeout

Completed Models: ${COMPLETED_MODELS}
Timeout Models: ${TIMEOUT_MODELS}

Suggestions:
1. Lower thinking depth
2. Simplify the question
3. Think step by step
```

---

## Constraints

- Do not skip complexity assessment (Phase 2)
- Deep/Ultra mode must use multi-model parallel
- Each Phase must call the corresponding Skill
- Use sequential-thinking for structured reasoning
- Final conclusion must mark confidence level
