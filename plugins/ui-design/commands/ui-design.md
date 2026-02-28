---
description: "UI/UX design workflow: init -> scenario confirm -> reference analysis team -> requirements -> style recommendation -> variant selection -> design pipeline team -> delivery"
argument-hint: "[--image=<path>] [--ref=<path>] [--scenario=from_scratch|optimize] [--tech-stack=react|vue] [--run-id=<id>] <design description>"
allowed-tools:
  - Task
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

## Phase 1: Init

1. Parse flags: `--image`, `--ref`, `--scenario`, `--tech-stack`, `--run-id`.
2. Resolve run id:

   ```bash
   # If --run-id provided, resume existing run
   # Otherwise derive CHANGE_ID: kebab-case from design description
   # Examples: "ui-design-dashboard-redesign", "ui-design-login-page"
   # Fallback: "ui-design-$(date +%Y%m%d-%H%M%S)"
   if [[ -n "${RUN_ID_ARG}" ]]; then
     CHANGE_ID="${RUN_ID_ARG}"
   else
     CHANGE_ID="ui-design-${slug_from_description}"
   fi
   RUN_DIR="openspec/changes/${CHANGE_ID}"
   mkdir -p "${RUN_DIR}"
   ```

3. **Write OpenSpec scaffold** to `${RUN_DIR}/`:
   - `proposal.md`: `# Change:` title, `## Why` (design purpose), `## What Changes` (design deliverables), `## Impact`
   - `tasks.md`: one numbered section per phase (Init, Scenario Confirm, Reference Analysis, Requirements, Style, Design Pipeline, Delivery) with `- [ ]` items
   - Mark items `[x]` as each phase completes.

4. Write `${RUN_DIR}/input.md` with task description and flags.

## Phase 2: Scenario Confirmation (Hard Stop)

**MANDATORY**: MUST call `AskUserQuestion` to confirm the following. Do NOT proceed until user responds:

- scenario (`from_scratch` or `optimize`)
- tech stack (`react` or `vue`)

## Phase 2.5: Reference Analysis (Parallel)

1. Launch three parallel analysis tasks in a single message:
   - `Task(subagent_type="ui-design:analysis-core", name="visual", prompt="run_dir=${RUN_DIR} mode=reference perspective=visual")`
   - `Task(subagent_type="ui-design:analysis-core", name="color", prompt="run_dir=${RUN_DIR} mode=reference perspective=color")`
   - `Task(subagent_type="ui-design:analysis-core", name="component", prompt="run_dir=${RUN_DIR} mode=reference perspective=component")`
     All three run concurrently. Each blocks until completion.
2. Lead merges three outputs into `${RUN_DIR}/design-reference-analysis.md`.

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

**MANDATORY**: MUST call `AskUserQuestion` to select final variant(s) from A/B/C. Do NOT proceed until user selects.

## Phase 6-9: Design Pipeline

1. For each selected variant:
   - Generate design spec:
     - `Task(subagent_type="ui-design:design-core", name="designer-${VARIANT}", prompt="run_dir=${RUN_DIR} mode=variant variant_id=${VARIANT}")`
   - Run UX gate:
     - `Task(subagent_type="ui-design:validation-core", name="ux-checker-${VARIANT}", prompt="run_dir=${RUN_DIR} mode=ux variant_id=${VARIANT}")`
   - If UX gate fails, re-spawn design-core with fix context, then re-run validation-core. Max 2 rounds.
2. Choose one delivery variant (`PRIMARY_VARIANT`) for code generation.
3. Generate code (sequential — prototype then refactor):
   - `Task(subagent_type="ui-design:generation-core", name="prototype-gen", prompt="run_dir=${RUN_DIR} mode=prototype variant_id=${PRIMARY_VARIANT} tech_stack=${TECH_STACK}")`
   - `Task(subagent_type="ui-design:generation-core", name="refactor-gen", prompt="run_dir=${RUN_DIR} mode=refactor variant_id=${PRIMARY_VARIANT} tech_stack=${TECH_STACK}")`
4. Final quality gate:
   - `Task(subagent_type="ui-design:validation-core", name="quality-checker", prompt="run_dir=${RUN_DIR} mode=quality variant_id=${PRIMARY_VARIANT} tech_stack=${TECH_STACK}")`

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

- If one reference analysis fails, continue with remaining outputs and mark confidence downgrade.
- If code generation fails, keep design artifacts and return exact failure details.
