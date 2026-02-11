---
description: "Brainstorming workflow: research -> ideation -> evaluation -> report"
argument-hint: <topic> [--deep] [--method=scamper|hats|auto] [--skip-research]
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Bash
---

# /brainstorm - AI Collaborative Brainstorming

## Usage

```bash
# Quick start
/brainstorm "stress relief toys for programmers"

# Deep research mode
/brainstorm "2026 smart home trends" --deep

# Specify ideation method
/brainstorm "optimize checkout flow" --method=scamper

# Resume session
/brainstorm --run-id=20260118T090000Z
```

## Execution Rules

**Required:** Execute phases sequentially using Skill tool calls.

**Constraints:**

- Must call Skill tool (not generate ideas directly)
- Must not use Read/Write/Bash to replace Skill calls
- Verify output files before proceeding to next phase
- No phase skipping (except --skip-research)

---

## Phase 0: Setup

1. Parse arguments:
   - TOPIC: User input topic
   - DEEP: Deep research mode (--deep)
   - METHOD: Ideation method (scamper/hats/auto, default auto)
   - SKIP_RESEARCH: Skip research phase (--skip-research)
   - RUN_ID: Resume existing session (--run-id=xxx)

2. Create run directory:

   ```bash
   if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
       RUN_ID="${BASH_REMATCH[1]}"
   else
       RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
   fi
   CHANGE_ID="${RUN_ID}"
   RUN_DIR="openspec/changes/${CHANGE_ID}"
   mkdir -p "$RUN_DIR"
   ```

Spec-only policy: brainstorm artifacts MUST be consolidated under `openspec/changes/${CHANGE_ID}/`.

3. Use AskUserQuestion to confirm execution plan

---

## Phase 1: Topic Research

**Call Skill:**

```
Skill(skill="brainstorm:topic-researcher", args="run_dir=${RUN_DIR} topic='${TOPIC}' deep=${DEEP}")
```

**Skip conditions:**

- User specified --skip-research
- research-brief.md already exists in RUN_DIR

**Verify:** `${RUN_DIR}/research-brief.md` exists with trends, cases, and suggestions

---

## Phase 2: Idea Generation (Multi-model Parallel)

**Call Skill:**

```
Skill(skill="brainstorm:idea-generator", args="run_dir=${RUN_DIR} method=${METHOD}")
```

**Verify:**

- `${RUN_DIR}/ideas-pool.md` exists
- Contains 20+ ideas with source labels (codex/gemini)

---

## Phase 3: Idea Evaluation

**Call Skill:**

```
Skill(skill="brainstorm:idea-evaluator", args="run_dir=${RUN_DIR}")
```

**Verify:**

- `${RUN_DIR}/evaluation.md` exists
- Contains Mermaid mindmap and Top 5 ranking

**Hard stop:** Use AskUserQuestion to show Top 5, confirm before proceeding

---

## Phase 4: Report Generation

**Call Skill:**

```
Skill(skill="brainstorm:report-synthesizer", args="run_dir=${RUN_DIR}")
```

**Verify:** `${RUN_DIR}/brainstorm-report.md` exists

---

## Phase 5: Delivery

Output completion summary:

```
Brainstorming Complete!

Topic: ${TOPIC}
Research Mode: ${DEEP ? 'Deep' : 'Quick'}
Ideation Method: ${METHOD}

Results:
- Research findings: N trends/cases
- Ideas generated: M
- Top 5 solutions: Done

Artifacts:
  ${RUN_DIR}/
  ├── research-brief.md    # Research brief
  ├── ideas-pool.md        # Idea pool (20+ ideas)
  ├── evaluation.md        # Evaluation (with mindmap)
  └── brainstorm-report.md # Final report
```

---

## Special Cases

### Resume Session

If --run-id specified:

1. Check if RUN_DIR exists
2. Check phase artifacts
3. Continue from missing phase

### Broad Topic

If topic lacks specificity:

- topic-researcher will ask user for clarification
- Or ask constraints in Phase 0

### Quick Mode

For fast execution:

- --skip-research skips research phase
- --method=auto selects best ideation method automatically
