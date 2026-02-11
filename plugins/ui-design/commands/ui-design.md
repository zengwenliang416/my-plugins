---
description: "UI/UX design workflow v3.0: requirements → multi-perspective design ref analysis team → style recommendation → design pipeline team (designer + reviewer + coder) → delivery"
argument-hint: "[--image=<path>] [--ref=<path>] [--scenario=from_scratch|optimize] [--tech-stack=react|vue] [--run-id=xxx] <design description>"
allowed-tools:
  - Task
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - SendMessage
  - AskUserQuestion
  - Read
  - Write
  - Bash
  - TaskOutput
---

# /ui-design - UI/UX Design Workflow v3.0

## Execution Model

```
┌─────────────────────────────────────────────────────────────┐
│  Auto-execute (no prompt)     │  Hard Stop (must ask user)   │
├─────────────────────────────────────────────────────────────┤
│  Phase 1 → Phase 2           │  ⏸️ Phase 2: Scenario confirm │
│  Phase 2.5 (Team 1)          │  ⏸️ Phase 5: Variant selection│
│  Phase 3 → Phase 4           │                               │
│  Phase 6-9 (Team 2)          │                               │
│  Phase 10                    │                               │
└─────────────────────────────────────────────────────────────┘
```

## Phase Overview

```
Phase 1:   Init                    → Create RUN_DIR, parse args
Phase 2:   Scenario Confirm        → AskUserQuestion (⏸️ Hard Stop)
Phase 2.5: Design Ref Analysis Team → Team 1: 3 specialist analysts + cross-validation
Phase 3:   Requirement Analysis    → Task(requirement-analyzer)
Phase 4:   Style Recommendation    → Task(style-recommender) → auto-continue ↓
Phase 5:   Variant Selection       → AskUserQuestion (⏸️ Hard Stop)
Phase 6-9: Design Pipeline Team    → Team 2: designer + reviewer + coder pipeline
Phase 10:  Delivery                → Output summary
```

---

## Phase 1: Init

### Argument Parsing

| Option               | Description                             | Default      |
| -------------------- | --------------------------------------- | ------------ |
| `--image=<path>`     | Reference image path                    | -            |
| `--ref=<path>`       | Design document path (Markdown/PDF)     | -            |
| `--scenario=value`   | Design scenario (from_scratch/optimize) | from_scratch |
| `--tech-stack=value` | Tech stack (react/vue)                  | react        |
| `--run-id=<id>`      | Resume from specified run-id            | -            |

### Run Directory Creation

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
fi
CHANGE_ID="${RUN_ID}"
RUN_DIR="openspec/changes/${CHANGE_ID}"
mkdir -p "$RUN_DIR"
```

Spec-only policy: ui-design artifacts MUST be consolidated under `openspec/changes/${CHANGE_ID}/`.

### Save Input

Write user description to `${RUN_DIR}/input.md`.

---

## Phase 2: Scenario Confirm

### ⏸️ Hard Stop

Use AskUserQuestion to confirm:

- Design scenario (from scratch / optimize existing)
- Tech stack preference (React + Tailwind / Vue + Tailwind)

---

## Phase 2.5: Design Reference Analysis (Team 1 — Lead Inline Orchestration)

**ALWAYS executes** — input type detection determines analysis mode. Never skip this phase.

**Lead executes all steps directly** (not delegated to a coordinator Task). This ensures every step is visible to the user.

Reference: `plugins/ui-design/agents/analysis/image-analyzer.md` for conflict resolution rules and output format.

### Step 1: Prepare Input

```
if --image provided:
    input_type = "image"
    cp "${image_path}" "${RUN_DIR}/reference-image.${ext}"
    message_payload = "input_type: image\nimage_path: ${RUN_DIR}/reference-image.${ext}"
elif --ref provided:
    input_type = "document"
    content = Read(ref_path)
    message_payload = "input_type: document\ncontent:\n${content}"
else:
    input_type = "description"
    content = Read("${RUN_DIR}/input.md")
    message_payload = "input_type: description\ndescription:\n${content}"
```

### Step 2: Create Team & Tasks

```
TeamCreate(team_name="ui-ref-analysis", description="Design reference multi-perspective analysis")
```

Create 6 tasks with dependencies:

```
# Phase A: Independent analysis (parallel)
TaskCreate(subject="Visual layout analysis", description="Analyze layout, grid, spacing, visual hierarchy. ${message_payload}", activeForm="Analyzing layout")       # 1
TaskCreate(subject="Color system analysis", description="Analyze color palette, contrast, gradients. ${message_payload}", activeForm="Analyzing colors")               # 2
TaskCreate(subject="Component catalog analysis", description="Analyze UI components, typography, icons. ${message_payload}", activeForm="Analyzing components")        # 3

# Phase B: Cross-validation (blocked by all Phase A tasks)
TaskCreate(subject="Cross-validate visual perspective", description="Review color + component reports from layout perspective", activeForm="Cross-validating layout")   # 4
TaskUpdate(taskId="4", addBlockedBy=["1", "2", "3"])
TaskCreate(subject="Cross-validate color perspective", description="Review visual + component reports from color perspective", activeForm="Cross-validating colors")    # 5
TaskUpdate(taskId="5", addBlockedBy=["1", "2", "3"])
TaskCreate(subject="Cross-validate component perspective", description="Review visual + color reports from component perspective", activeForm="Cross-validating components") # 6
TaskUpdate(taskId="6", addBlockedBy=["1", "2", "3"])
```

### Step 3: Spawn 3 Specialist Agents (parallel, background)

```
Task(subagent_type="ui-design:analysis:visual-analyst", name="visual-analyst", team_name="ui-ref-analysis",
  description="Visual layout analyst",
  prompt="You are visual-analyst on team ui-ref-analysis.
  Read plugins/ui-design/agents/analysis/visual-analyst.md for your full instructions.
  run_dir=${RUN_DIR}. ${message_payload}
  Phase A: Claim task 1, analyze using codeagent-wrapper gemini, write ref-analysis-visual.md, mark completed.
  Phase B: When task 4 unblocks, claim it, read the other 2 reports, write cross-validation-visual.md, mark completed.",
  run_in_background=true)

Task(subagent_type="ui-design:analysis:color-analyst", name="color-analyst", team_name="ui-ref-analysis",
  description="Color system analyst",
  prompt="You are color-analyst on team ui-ref-analysis.
  Read plugins/ui-design/agents/analysis/color-analyst.md for your full instructions.
  run_dir=${RUN_DIR}. ${message_payload}
  Phase A: Claim task 2, analyze using codeagent-wrapper gemini, write ref-analysis-color.md, mark completed.
  Phase B: When task 5 unblocks, claim it, read the other 2 reports, write cross-validation-color.md, mark completed.",
  run_in_background=true)

Task(subagent_type="ui-design:analysis:component-analyst", name="component-analyst", team_name="ui-ref-analysis",
  description="Component catalog analyst",
  prompt="You are component-analyst on team ui-ref-analysis.
  Read plugins/ui-design/agents/analysis/component-analyst.md for your full instructions.
  run_dir=${RUN_DIR}. ${message_payload}
  Phase A: Claim task 3, analyze using codeagent-wrapper gemini, write ref-analysis-component.md, mark completed.
  Phase B: When task 6 unblocks, claim it, read the other 2 reports, write cross-validation-component.md, mark completed.",
  run_in_background=true)
```

### Step 4: Wait for All Agents to Complete

**MUST wait** — do NOT take over analyst work. Lead's only job here is waiting.

```
# Block-wait for all 3 background agents to finish (no timeout — Gemini calls may take long)
TaskOutput(task_id=visual_analyst_id, block=true)
TaskOutput(task_id=color_analyst_id, block=true)
TaskOutput(task_id=component_analyst_id, block=true)
```

After all 3 return, verify via TaskList that all 6 tasks (Phase A + Phase B) are completed.

**FORBIDDEN**: Lead must NOT perform analysis itself. If an agent fails, re-spawn it — do not replace it.

### Step 5: Weighted Vote Synthesis (Lead)

Read all 6 reports and synthesize `${RUN_DIR}/design-reference-analysis.md`.

**Conflict Resolution Rules** (from image-analyzer.md):

1. 2/3 analysts agree → adopt majority opinion
2. Domain expert gets 2x vote weight on domain conflicts (color→color-analyst, layout→visual-analyst, component→component-analyst)
3. Quantifiable data (contrast ratios, pixel values) → adopt calculated value
4. Subjective disagreement → mark `[CONTESTED, recommend manual review]`

### Step 6: Shutdown Team

```
SendMessage(type="shutdown_request", recipient="visual-analyst", content="Analysis complete")
SendMessage(type="shutdown_request", recipient="color-analyst", content="Analysis complete")
SendMessage(type="shutdown_request", recipient="component-analyst", content="Analysis complete")
TeamDelete()
```

### Outputs

- `${RUN_DIR}/ref-analysis-visual.md`
- `${RUN_DIR}/ref-analysis-color.md`
- `${RUN_DIR}/ref-analysis-component.md`
- `${RUN_DIR}/cross-validation-{visual,color,component}.md`
- `${RUN_DIR}/design-reference-analysis.md` (unified synthesis)

---

## Phase 3: Requirement Analysis

### Agent Invocation

```
Task(
  subagent_type="ui-design:analysis:requirement-analyzer",
  description="Analyze requirements",
  prompt="You are the requirement-analyzer agent.
  Read plugins/ui-design/agents/analysis/requirement-analyzer.md.
  Execute with: run_dir=${RUN_DIR} description=${DESCRIPTION}",
  run_in_background=false
)
```

**Output**: `${RUN_DIR}/requirements.md`

**For optimize scenario**, also invoke:

```
Task(
  subagent_type="ui-design:analysis:existing-code-analyzer",
  description="Analyze existing code",
  prompt="You are the existing-code-analyzer agent.
  Read plugins/ui-design/agents/analysis/existing-code-analyzer.md.
  Execute with: run_dir=${RUN_DIR}",
  run_in_background=true
)
```

---

## Phase 4: Style Recommendation

### Agent Invocation

```
Task(
  subagent_type="ui-design:design:style-recommender",
  description="Generate style recommendations",
  prompt="You are the style-recommender agent.
  Read plugins/ui-design/agents/design/style-recommender.md.
  Execute with: run_dir=${RUN_DIR}",
  run_in_background=false
)
```

**Outputs**:

- `${RUN_DIR}/style-recommendations.md`
- `${RUN_DIR}/previews/index.html`
- `${RUN_DIR}/previews/preview-{A,B,C}.html`

---

## Phase 5: Variant Selection

### ⏸️ Hard Stop

1. Prompt user to open HTML preview:

```
Design variants ready! Preview in browser:
   open ${RUN_DIR}/previews/index.html
```

2. Use AskUserQuestion to ask:
   - Generate all 3 variants (Recommended)
   - Generate variant A only
   - Generate variant B only
   - Generate variant C only

---

## Phase 6-9: Design Pipeline (Team 2 — designer + reviewer + coder)

### Step 1: Create Team

```
TeamCreate(team_name="ui-design-pipeline", description="Design pipeline: generate → review → code")
```

### Step 2: Create Task List

Create tasks based on user-selected variant_ids. Example for all 3 variants:

```
# Design generation (parallel)
TaskCreate(subject="Design variant A", description="...", activeForm="Designing variant A")  # 1
TaskCreate(subject="Design variant B", description="...", activeForm="Designing variant B")  # 2
TaskCreate(subject="Design variant C", description="...", activeForm="Designing variant C")  # 3

# UX review (blocked by corresponding design)
TaskCreate(subject="UX review variant A", description="...", activeForm="Reviewing variant A")  # 4
TaskUpdate(taskId="4", addBlockedBy=["1"])
TaskCreate(subject="UX review variant B", description="...", activeForm="Reviewing variant B")  # 5
TaskUpdate(taskId="5", addBlockedBy=["2"])
TaskCreate(subject="UX review variant C", description="...", activeForm="Reviewing variant C")  # 6
TaskUpdate(taskId="6", addBlockedBy=["3"])

# Code generation (blocked by all reviews)
TaskCreate(subject="Gemini prototype generation", description="...", activeForm="Generating prototype")  # 7
TaskUpdate(taskId="7", addBlockedBy=["4", "5", "6"])
TaskCreate(subject="Claude code refactor", description="...", activeForm="Refactoring code")  # 8
TaskUpdate(taskId="8", addBlockedBy=["7"])

# Quality validation (blocked by code refactor)
TaskCreate(subject="Quality validation", description="...", activeForm="Validating quality")  # 9
TaskUpdate(taskId="9", addBlockedBy=["8"])
```

Task dependency graph:

```
[1] Design A → [4] UX Review A ─┐
[2] Design B → [5] UX Review B ─┼→ [7] Gemini Prototype → [8] Claude Refactor → [9] Quality
[3] Design C → [6] UX Review C ─┘
```

### Step 3: Spawn 3 Teammates

```
# designer: design generation + inline fix
Task(
  subagent_type="general-purpose",
  name="designer",
  team_name="ui-design-pipeline",
  description="Design variant generator",
  prompt="You are the DESIGNER on team 'ui-design-pipeline'.

Your role:
1. Check TaskList for design tasks (#1-3), claim in order (A→B→C)
2. For each: read plugins/ui-design/agents/design/design-variant-generator.md, execute, write design-{variant}.md
3. If reviewer sends UX_FIX_REQUEST: parse JSON, apply fixes to design file, reply UX_FIX_APPLIED
4. After all tasks done, go idle

Working directory: run_dir=${RUN_DIR}
Agent definition: plugins/ui-design/agents/design/design-variant-generator.md
Style recommendations: ${RUN_DIR}/style-recommendations.md
Requirements: ${RUN_DIR}/requirements.md
Design reference: ${RUN_DIR}/design-reference-analysis.md (if exists)",
  run_in_background=true
)

# reviewer: UX review + quality validation
Task(
  subagent_type="general-purpose",
  name="reviewer",
  team_name="ui-design-pipeline",
  description="UX reviewer and quality validator",
  prompt="You are the REVIEWER on team 'ui-design-pipeline'.

Your role:
1. Check TaskList for review tasks (#4-6), they unblock as designs complete
2. For each: read plugins/ui-design/agents/validation/ux-guideline-checker.md, execute UX check
3. Pass: rate>=80% AND high_priority=0 → mark completed
4. Fail: send UX_FIX_REQUEST (structured JSON) to designer, wait for UX_FIX_APPLIED, do targeted re-check
5. Max 2 fix rounds per variant, then UX_ESCALATION to lead
6. Also claim task #9 (quality validation) when unblocked

Working directory: run_dir=${RUN_DIR}
UX agent: plugins/ui-design/agents/validation/ux-guideline-checker.md
Quality agent: plugins/ui-design/agents/validation/quality-validator.md",
  run_in_background=true
)

# coder: Gemini prototype + Claude refactor
Task(
  subagent_type="general-purpose",
  name="coder",
  team_name="ui-design-pipeline",
  description="Code generator (Gemini prototype + Claude refactor)",
  prompt="You are the CODER on team 'ui-design-pipeline'.

Your role:
1. Check TaskList for code tasks (#7-8), blocked by UX reviews
2. Task #7: read plugins/ui-design/agents/generation/gemini-prototype-generator.md, generate prototype
3. Task #8: read plugins/ui-design/agents/generation/claude-code-refactor.md, refactor code
4. Read all ux-check-{variant}.md to select best variant for code generation

Working directory: run_dir=${RUN_DIR}
Tech stack: ${TECH_STACK}
Gemini agent: plugins/ui-design/agents/generation/gemini-prototype-generator.md
Refactor agent: plugins/ui-design/agents/generation/claude-code-refactor.md",
  run_in_background=true
)
```

### Step 4: Monitor & Coordinate

```
while TaskList has incomplete tasks:
  1. Check TaskList status
  2. If UX_ESCALATION received → AskUserQuestion for user decision
  3. If teammate idle with claimable tasks → SendMessage reminder
  4. If deadlock detected → intervene
```

**Exit condition**: Task #9 (Quality Validation) completed

### Step 5: Shutdown Team

```
SendMessage(type="shutdown_request", recipient="designer", content="All tasks completed")
SendMessage(type="shutdown_request", recipient="reviewer", content="All tasks completed")
SendMessage(type="shutdown_request", recipient="coder", content="All tasks completed")
TeamDelete()
```

---

## Phase 10: Delivery

Output completion summary:

```
UI/UX Design Complete!

Task: ${DESCRIPTION}
Selected Variant: Variant ${FINAL_VARIANT}
Tech Stack: ${TECH_STACK}

Quality Metrics:
- UX Pass Rate: ${UX_PASS_RATE}%
- Quality Score: ${QUALITY_SCORE}/10

Artifacts:
  ${RUN_DIR}/
  ├── design-reference-analysis.md  # Design reference analysis (multi-perspective)
  ├── requirements.md               # Requirements
  ├── style-recommendations.md      # Style recommendations
  ├── design-${FINAL_VARIANT}.md    # Final design spec
  ├── ux-check-${FINAL_VARIANT}.md  # UX check report
  ├── code/${TECH_STACK}/           # Generated code
  └── quality-report.md             # Quality report

Next Steps:
  - Resume: /ui-design --run-id=${RUN_ID}
  - Install: cd ${RUN_DIR}/code/${TECH_STACK} && npm install
  - Dev: npm run dev
```

---

## Run Directory Structure

```
openspec/changes/${CHANGE_ID}/
├── state.json
├── input.md
├── ref-analysis-visual.md             # Team 1 Phase A
├── ref-analysis-color.md              # Team 1 Phase A
├── ref-analysis-component.md          # Team 1 Phase A
├── cross-validation-visual.md         # Team 1 Phase B
├── cross-validation-color.md          # Team 1 Phase B
├── cross-validation-component.md      # Team 1 Phase B
├── design-reference-analysis.md       # Team 1 Phase C (synthesis)
├── requirements.md                    # Phase 3
├── style-recommendations.md           # Phase 4
├── previews/                          # Phase 4
│   ├── index.html
│   ├── preview-A.html
│   ├── preview-B.html
│   └── preview-C.html
├── design-{A,B,C}.md                 # Team 2 (designer)
├── ux-check-{A,B,C}.md              # Team 2 (reviewer)
├── code/                              # Team 2 (coder)
│   ├── gemini-raw/
│   └── ${tech_stack}/
└── quality-report.md                  # Team 2 (reviewer)
```

---

## Agent Directory Structure

```
plugins/ui-design/agents/
├── analysis/
│   ├── image-analyzer.md           # Design Reference Analysis — Lead reference doc (conflict resolution rules, output format)
│   ├── visual-analyst.md           # Layout/grid/spacing specialist (NEW)
│   ├── color-analyst.md            # Color palette/contrast specialist (NEW)
│   ├── component-analyst.md        # Component/typography/icon specialist (NEW)
│   ├── requirement-analyzer.md     # Requirement analysis
│   └── existing-code-analyzer.md   # Existing code analysis
├── design/
│   ├── style-recommender.md        # 3-variant style recommendation
│   └── design-variant-generator.md # Design spec generation + inline fix handler
├── validation/
│   ├── ux-guideline-checker.md     # UX guideline check + structured fix protocol
│   └── quality-validator.md        # Code quality validation
└── generation/
    ├── gemini-prototype-generator.md # Gemini prototype generation + UX-aware selection
    └── claude-code-refactor.md       # Claude refactor to production quality
```

---

## Agent Type Restrictions

This command uses the following agent types:

| Agent Type                                        | Usage                                           |
| ------------------------------------------------- | ----------------------------------------------- |
| `ui-design:analysis:visual-analyst`               | Phase 2.5: Layout/grid/spacing specialist       |
| `ui-design:analysis:color-analyst`                | Phase 2.5: Color palette/contrast specialist    |
| `ui-design:analysis:component-analyst`            | Phase 2.5: Component/typography/icon specialist |
| `ui-design:analysis:requirement-analyzer`         | Phase 3: Requirement analysis                   |
| `ui-design:analysis:existing-code-analyzer`       | Phase 3: Existing code analysis (optimize)      |
| `ui-design:design:style-recommender`              | Phase 4: Style recommendation                   |
| `ui-design:design:design-variant-generator`       | Phase 6: Design generation (via Team)           |
| `ui-design:validation:ux-guideline-checker`       | Phase 7: UX review (via Team)                   |
| `ui-design:validation:quality-validator`          | Phase 9: Quality validation (via Team)          |
| `ui-design:generation:gemini-prototype-generator` | Phase 8 Step 1: Gemini prototype (via Team)     |
| `ui-design:generation:claude-code-refactor`       | Phase 8 Step 2: Claude refactor (via Team)      |

Phase 6-9 agents are invoked **within Team context** by teammates, not directly by Lead.

---

## Constraints

- Never skip any Phase — Phase 2.5 ALWAYS executes regardless of input type
- Phase 2.5 uses Team 1 (multi-perspective cross-validation), **Lead directly orchestrates** (not delegated to coordinator Task)
- Phase 6-9 uses Team 2 (pipeline), managed directly by Lead
- Hard stop points must wait for user confirmation
- UX fix max 2 rounds per variant, then escalation to Lead → user
- Code generation must wait for all UX reviews to pass
- **MUST NOT** invoke any agent types outside the Agent Type Restrictions table — no ad-hoc Explore, investigator, or research agents
- **MUST NOT** add improvised phases or steps not defined in this workflow
- **MUST NOT** take over specialist agent work — Lead only orchestrates and synthesizes, never replaces analysts/designer/reviewer/coder
