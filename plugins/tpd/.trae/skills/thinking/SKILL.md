---
name: "thinking"
description: "Deep Thinking Workflow: Complexity assessment → Context boundary exploration → Constraint integration → Conclusion generation → Handoff summary. Supports auto/light/deep/ultra."
---

# /thinking - Deep Thinking Workflow Command

## Overview

Integrates Claude Code ultrathink, Codex-CLI reasoning, and Gemini Deep Think - three thinking modes providing multi-level, multi-perspective deep analysis capabilities.

**Core Features**:

- **Smart Routing**: Automatically selects thinking depth based on problem complexity
- **Multi-Boundary Parallel**: Parallel exploration by context boundaries, forming constraint sets
- **Multi-Model Supplementation**: Codex/Gemini provide supplementary perspectives on constraints and risks
- **Thinking Visualization**: Complete display of reasoning chains and thinking processes
- **Conclusion Integration**: Synthesizes multi-model outputs to generate high-quality conclusions

---

## Core Philosophy

- **Output is Constraint Set**: Output "constraint set + verifiable success criteria", not information piles
- **Convergence Direction**: Constraints are for "excluding directions", enabling zero-decision execution in subsequent plan
- **No Architecture Decisions**: Only expose constraints, risks, and questions to be confirmed
- **OpenSpec Rules**: thinking phase **writes directly to `openspec/` specification**, does not modify project code

## Guardrails

- **Forbidden to split sub-agents by role** (e.g., "architect/security expert")
- **Must split by context boundary** (module/directory/domain)
- **Must use semantic retrieval** for codebase exploration
- **Sub-agent output must follow unified JSON template**
- **Forbidden to modify project code** (allowed to write to `openspec/` specification files)

## 🚨 Mandatory Execution Rules

### Write Scope Restriction

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ ALLOWED: Write to openspec/ directory only                  │
│     - openspec/changes/${PROPOSAL_ID}/artifacts/thinking/*      │
│                                                                 │
│  ❌ FORBIDDEN: Write to any other location                      │
│     - Project source code                                       │
│     - User workspace files                                      │
│     - Any path outside openspec/                                │
└─────────────────────────────────────────────────────────────────┘
```

### Step Execution Policy

```
┌─────────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL: You MUST NOT skip any step!                       │
│                                                                 │
│  Before proceeding to next step, you MUST:                      │
│  1. Execute the required Skill/Task call                        │
│  2. Verify output file exists                                   │
│  3. Update state.json with current step                         │
│                                                                 │
│  If verification fails → STOP and report error                  │
│  DO NOT proceed with "shortcut" or "direct execution"           │
└─────────────────────────────────────────────────────────────────┘
```

### Anti-Patterns (FORBIDDEN)

| ❌ Forbidden Behavior                  | ✅ Correct Approach                        |
| -------------------------------------- | ------------------------------------------ |
| Skip complexity assessment             | Always call `/complexity-analyzer` first   |
| Execute task directly without thinking | Output constraints only, no implementation |
| Write files outside openspec/          | All output to `${THINKING_DIR}/`           |
| Skip boundary exploration              | Launch boundary-explorer agents            |
| Proceed without verifying artifacts    | Check file exists before next step         |

---

## Actions

0. **Step 0: Initialization**
   - Parse arguments: `--depth`, `--parallel`, `--verbose`, and problem description
   - Check OpenSpec status:
     ```bash
     openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
     ```
   - If OpenSpec not initialized → prompt user to execute `/init` first
   - Generate `PROPOSAL_ID` from problem description slug
   - Create `THINKING_DIR`: `openspec/changes/${PROPOSAL_ID}/artifacts/thinking`
   - **Initialize State Machine** - Write `${THINKING_DIR}/state.json`:
     ```json
     {
       "proposal_id": "${PROPOSAL_ID}",
       "current_step": 0,
       "status": "initialized",
       "depth": "auto",
       "artifacts": {
         "input": false,
         "complexity": false,
         "boundaries": false,
         "exploration": false,
         "codex_thought": false,
         "gemini_thought": false,
         "synthesis": false,
         "conclusion": false,
         "handoff": false
       },
       "timestamps": {
         "started": "${ISO_TIMESTAMP}",
         "step_0": "${ISO_TIMESTAMP}"
       }
     }
     ```
   - Write `${THINKING_DIR}/input.md` with problem description
   - **🔒 Checkpoint**: Verify both files exist before proceeding

1. **Step 1: Complexity Assessment**
   - 调用 /complexity-analyzer，参数：`run_dir=${THINKING_DIR}`
   - Determine depth routing:
     | Complexity Score | Depth | Trigger Condition |
     | --- | --- | --- |
     | 1-3 | light | Simple Q&A, fact queries, single-step tasks |
     | 4-6 | deep | Requires reasoning, comparative analysis |
     | 7-10 | ultra | Complex architecture, multi-step reasoning |
   - **⏸️ Optional Hard Stop**: If `--depth=auto` and score 4-6, ask user to confirm depth:

     ```
     复杂度评分为 ${SCORE}（中等复杂度），建议使用 deep 模式。

     请选择思考深度：
     (a) deep - 深度分析（推荐）
     (b) light - 轻量分析（快速）
     (c) ultra - 极限分析（最全面）
     ```

   - **🔒 Checkpoint**:
     ```bash
     # Verify artifact exists
     test -f "${THINKING_DIR}/complexity-analysis.md" || { echo "❌ Step 1 FAILED: complexity-analysis.md not found"; exit 1; }
     ```
     Update state.json: `current_step=1`, `artifacts.complexity=true`

2. **Step 2: Parallel Boundary Exploration**
   - First, use semantic retrieval to identify boundaries:

     使用代码语义检索："Identify main module/directory boundaries, core domains, and configuration scopes for context boundary exploration."

   - Write boundary list to `${THINKING_DIR}/boundaries.json`
   - 并行调用以下智能体（最多 4 个）：

   For each boundary (example, actual boundaries from boundaries.json):

   ```
   调用 @boundary-explorer，参数：description="Explore user-domain" prompt="Execute boundary exploration. run_dir=${THINKING_DIR} boundary=user-domain scope='user-related models/services/UI'"

   调用 @boundary-explorer，参数：description="Explore auth-session" prompt="Execute boundary exploration. run_dir=${THINKING_DIR} boundary=auth-session scope='authentication/session/middleware'"

   调用 @boundary-explorer，参数：description="Explore config-infra" prompt="Execute boundary exploration. run_dir=${THINKING_DIR} boundary=config-infra scope='configuration/deployment/build scripts'"

   调用 @boundary-explorer，参数：description="Explore data-layer" prompt="Execute boundary exploration. run_dir=${THINKING_DIR} boundary=data-layer scope='database/ORM/data models'"
   ```

   - **重要**: 最多使用 4 个 @boundary-explorer 智能体进行探索
   - **重要**: 同步等待所有智能体完成，不使用后台模式
   - **🔒 Checkpoint**:
     ```bash
     # Verify at least one exploration artifact exists
     ls "${THINKING_DIR}"/explore-*.json 1>/dev/null 2>&1 || { echo "❌ Step 2 FAILED: No explore-*.json found"; exit 1; }
     ```
     Update state.json: `current_step=2`, `artifacts.boundaries=true`, `artifacts.exploration=true`

3. **Step 3: Parallel Multi-Model Constraint Analysis (deep/ultra only)**
   - 并行调用以下智能体（最多 2 个）：

   ```
   调用 @codex-constraint，参数：description="Codex constraint analysis" prompt="Execute constraint analysis. run_dir=${THINKING_DIR} level=medium"

   调用 @gemini-constraint，参数：description="Gemini constraint analysis" prompt="Execute constraint analysis. run_dir=${THINKING_DIR} level=medium"
   ```

   - **任务说明**:
     - @codex-constraint: "Analyze technical constraints from backend perspective"
     - @gemini-constraint: "Analyze constraints from UX/frontend perspective"
   - Light mode can skip; use `--parallel` to force execution
   - **重要**: 同步等待所有智能体完成，不使用后台模式
   - **🔒 Checkpoint** (deep/ultra only):
     ```bash
     # Verify constraint analysis artifacts
     test -f "${THINKING_DIR}/codex-thought.md" || echo "⚠️ codex-thought.md missing (may be expected)"
     test -f "${THINKING_DIR}/gemini-thought.md" || echo "⚠️ gemini-thought.md missing (may be expected)"
     ```
     Update state.json: `current_step=3`, `artifacts.codex_thought=true/false`, `artifacts.gemini_thought=true/false`

4. **Step 4: Synthesis & User Confirmation**
   - 调用 /thought-synthesizer，参数：`run_dir=${THINKING_DIR} depth=${DEPTH}`
   - Aggregates: hard/soft constraints, open questions, dependencies, risks, success criteria hints
   - **🔒 Checkpoint**:
     ```bash
     test -f "${THINKING_DIR}/synthesis.md" || { echo "❌ Step 4 FAILED: synthesis.md not found"; exit 1; }
     ```
     Update state.json: `current_step=4`, `artifacts.synthesis=true`
   - **⏸️ Constraint Clarification Hard Stop**: If `synthesis.md` contains `open_questions`, ask user to clarify:

     ```
     综合分析发现以下待确认问题：

     ${OPEN_QUESTIONS_LIST}

     请逐一回答上述问题（可以回复 "跳过" 继续执行）。
     ```

   - Write user answers to `${THINKING_DIR}/clarifications.md`

5. **Step 5: Conclusion Generation**
   - 调用 /conclusion-generator，参数：`run_dir=${THINKING_DIR}`
   - Generates final conclusion based on integration results
   - Builds complete reasoning chain
   - Marks confidence level
   - **🔒 Checkpoint**:
     ```bash
     test -f "${THINKING_DIR}/conclusion.md" || { echo "❌ Step 5 FAILED: conclusion.md not found"; exit 1; }
     ```
     Update state.json: `current_step=5`, `artifacts.conclusion=true`
   - **⏸️ Ultra Mode Hard Stop**: Display conclusion summary and ask if further exploration needed:

     ```
     结论已生成（置信度：${CONFIDENCE}）

     核心结论摘要：
     ${CONCLUSION_SUMMARY}

     是否需要进一步探索？
     (a) 继续下一阶段（推荐）
     (b) 重新进行深度分析
     (c) 调整思考范围
     ```

6. **Step 6: Handoff**
   - 调用 /handoff-generator，参数：`run_dir=${THINKING_DIR}`
   - **🔒 Final Checkpoint**:
     ```bash
     test -f "${THINKING_DIR}/handoff.md" || { echo "❌ Step 6 FAILED: handoff.md not found"; exit 1; }
     test -f "${THINKING_DIR}/handoff.json" || { echo "❌ Step 6 FAILED: handoff.json not found"; exit 1; }
     ```
     Update state.json: `current_step=6`, `status="completed"`, `artifacts.handoff=true`, `timestamps.completed="${ISO_TIMESTAMP}"`
   - Output completion summary:

     ```
     🧠 Deep Thinking Complete!

     📋 Question: ${QUESTION}
     📋 Proposal: ${PROPOSAL_ID}
     🔬 Thinking Depth: ${DEPTH}

     🎯 Core Conclusion:
     ${CONCLUSION_SUMMARY}

     📦 Handoff Summary:
     - Constraints: See ${THINKING_DIR}/handoff.md
     - Success Criteria: See ${THINKING_DIR}/handoff.md

     ➡️ Next Phase: /plan

     📁 Artifacts:
       ${THINKING_DIR}/
       ├── input.md
       ├── complexity-analysis.md
       ├── boundaries.json
       ├── explore-*.json
       ├── synthesis.md
       ├── clarifications.md (if any)
       ├── codex-thought.md (deep/ultra)
       ├── gemini-thought.md (deep/ultra)
       ├── conclusion.md
       ├── handoff.md
       └── handoff.json
     ```

---

## Parallel Constraints Summary

| Step   | Max Agents | Agent Types                               |
| ------ | ---------- | ----------------------------------------- |
| Step 2 | **4**      | `@boundary-explorer`                      |
| Step 3 | **2**      | `@codex-constraint`, `@gemini-constraint` |

---

## Thinking Depth Comparison

| Feature              | Light        | Deep              | Ultra                |
| -------------------- | ------------ | ----------------- | -------------------- |
| Boundary Count       | 1            | 2-3               | 3-5                  |
| Parallel Subagents   | None/Few     | Medium parallel   | High parallel        |
| Multi-Model Analysis | Skip         | Required          | Required             |
| Applicable Scenarios | Simple needs | Medium complexity | Complex architecture |

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

## Agent Type Restrictions

This command ONLY uses the following agent types:

| Agent Type           | Usage                                   |
| -------------------- | --------------------------------------- |
| `@boundary-explorer` | Step 2: Parallel boundary exploration   |
| `@codex-constraint`  | Step 3: Technical constraint analysis   |
| `@gemini-constraint` | Step 3: UX/frontend constraint analysis |

Any other agent types are **forbidden** in this command.
