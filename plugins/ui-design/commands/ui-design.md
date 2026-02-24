---
description: "UI/UX design workflow: init -> scenario confirm -> reference analysis team -> requirements -> style recommendation -> variant selection -> design pipeline team -> delivery"
argument-hint: "[--image=<path>] [--ref=<path>] [--scenario=from_scratch|optimize] [--tech-stack=react|vue] [--run-id=<id>] <design description>"
allowed-tools:
  - Task
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - TaskOutput
  - SendMessage
  - AskUserQuestion
  - Read
  - Write
  - Bash
---

# /ui-design

## Purpose
Generate UI/UX design artifacts and implementation code through Team-first orchestration with explicit communication and quality gates.

## Agent Types
- `ui-design:analysis-core`
- `ui-design:design-core`
- `ui-design:generation-core`
- `ui-design:validation-core`

## Message Protocol
All team messages use this envelope:

```json
{
  "type": "phase_broadcast|analysis_ready|review_feedback|ux_fix_request|ux_fix_applied|code_ready|quality_ready|error|heartbeat",
  "from": "agent-name|lead",
  "to": "agent-name|lead|all",
  "run_id": "<run_id>",
  "task_id": "<task_id>",
  "requires_ack": true,
  "payload": {}
}
```

Communication rules:
- Directed messages with `requires_ack=true` must be acknowledged.
- Lead appends all message envelopes to `${TEAM_DIR}/mailbox.jsonl`.
- On task failure, sender includes failing step id and stderr summary in `payload`.

## Progress Visibility
- Lead writes phase start/end events to `${TEAM_DIR}/phase-events.jsonl`.
- If a wait exceeds 60 seconds, append a heartbeat snapshot to `${TEAM_DIR}/heartbeat.jsonl`.
- Before and after each major phase, print a short phase marker.

## Required Artifacts
- `${RUN_DIR}/input.md`
- `${RUN_DIR}/requirements.md`
- `${RUN_DIR}/style-recommendations.md`
- `${RUN_DIR}/design-reference-analysis.md`
- `${RUN_DIR}/ref-analysis-{visual,color,component}.md`
- `${RUN_DIR}/design-{A,B,C}.md` (for selected variants)
- `${RUN_DIR}/ux-check-{A,B,C}.md` (for selected variants)
- `${RUN_DIR}/quality-report.md`
- `${RUN_DIR}/code/gemini-raw/`
- `${RUN_DIR}/code/${TECH_STACK}/`
- `${RUN_DIR}/team/phase-events.jsonl`
- `${RUN_DIR}/team/heartbeat.jsonl`
- `${RUN_DIR}/team/mailbox.jsonl`

## Phase 1: Init
1. Parse flags: `--image`, `--ref`, `--scenario`, `--tech-stack`, `--run-id`.
2. Resolve run id:
   ```bash
   if [[ -n "${RUN_ID_ARG}" ]]; then
     RUN_ID="${RUN_ID_ARG}"
   else
     RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
   fi
   RUN_DIR="openspec/changes/${RUN_ID}"
   TEAM_DIR="${RUN_DIR}/team"
   mkdir -p "${RUN_DIR}" "${TEAM_DIR}"
   : > "${TEAM_DIR}/phase-events.jsonl"
   : > "${TEAM_DIR}/heartbeat.jsonl"
   : > "${TEAM_DIR}/mailbox.jsonl"
   ```
3. Write `${RUN_DIR}/input.md` with task description and flags.

## Phase 2: Scenario Confirmation (Hard Stop)
Use `AskUserQuestion` to confirm:
- scenario (`from_scratch` or `optimize`)
- tech stack (`react` or `vue`)

## Phase 2.5: Reference Analysis Team
1. Create team:
   ```text
   TeamCreate(team_name="ui-ref-analysis", description="reference analysis team")
   ```
2. Launch three parallel analysis tasks:
   - `Task(subagent_type="ui-design:analysis-core", name="visual", prompt="run_dir=${RUN_DIR} mode=reference perspective=visual")`
   - `Task(subagent_type="ui-design:analysis-core", name="color", prompt="run_dir=${RUN_DIR} mode=reference perspective=color")`
   - `Task(subagent_type="ui-design:analysis-core", name="component", prompt="run_dir=${RUN_DIR} mode=reference perspective=component")`
3. Wait for all three outputs with `TaskOutput(block=true)`.
4. Lead merges three outputs into `${RUN_DIR}/design-reference-analysis.md`.
5. Send shutdown broadcast and `TeamDelete()`.

## Phase 3: Requirement Analysis
1. Run requirement extraction:
   ```text
   Task(subagent_type="ui-design:analysis-core", prompt="run_dir=${RUN_DIR} mode=requirements scenario=${SCENARIO}")
   ```
2. If `scenario=optimize`, run existing code analysis:
   ```text
   Task(subagent_type="ui-design:analysis-core", prompt="run_dir=${RUN_DIR} mode=existing-code scenario=${SCENARIO}")
   ```
3. Verify `${RUN_DIR}/requirements.md`.

## Phase 4: Style Recommendation
1. Run style recommendation:
   ```text
   Task(subagent_type="ui-design:design-core", prompt="run_dir=${RUN_DIR} mode=style")
   ```
2. Verify `${RUN_DIR}/style-recommendations.md`.

## Phase 5: Variant Selection (Hard Stop)
Use `AskUserQuestion` to select final variant(s) from A/B/C.

## Phase 6-9: Design Pipeline Team
1. Create team:
   ```text
   TeamCreate(team_name="ui-design-pipeline", description="designer-reviewer-coder pipeline")
   ```
2. For each selected variant:
   - Generate design spec:
     - `Task(subagent_type="ui-design:design-core", prompt="run_dir=${RUN_DIR} mode=variant variant_id=${VARIANT}")`
   - Run UX gate:
     - `Task(subagent_type="ui-design:validation-core", prompt="run_dir=${RUN_DIR} mode=ux variant_id=${VARIANT}")`
   - If UX gate fails, run fix loop (`ux_fix_request` -> regenerate -> recheck), max 2 rounds.
3. Choose one delivery variant (`PRIMARY_VARIANT`) for code generation.
4. Generate code:
   - `Task(subagent_type="ui-design:generation-core", prompt="run_dir=${RUN_DIR} mode=prototype variant_id=${PRIMARY_VARIANT} tech_stack=${TECH_STACK}")`
   - `Task(subagent_type="ui-design:generation-core", prompt="run_dir=${RUN_DIR} mode=refactor variant_id=${PRIMARY_VARIANT} tech_stack=${TECH_STACK}")`
5. Final quality gate:
   - `Task(subagent_type="ui-design:validation-core", prompt="run_dir=${RUN_DIR} mode=quality variant_id=${PRIMARY_VARIANT} tech_stack=${TECH_STACK}")`
6. Send shutdown broadcast and `TeamDelete()`.

## Phase 10: Delivery
Print final summary:
- selected variant(s) and delivery variant
- UX pass rate and quality score
- artifact paths
- resume command: `/ui-design --run-id=${RUN_ID}`

## Quality Gates
- UX pass rate >= 80%
- high-priority UX issues = 0
- fix loop <= 2 rounds per variant
- quality score >= 7.5/10

## Fallback Rules
- If Team API fails, run equivalent steps with sequential `Task` calls.
- If one reference specialist fails, continue with remaining outputs and mark confidence downgrade.
- If code generation fails, keep design artifacts and return exact failure details.
