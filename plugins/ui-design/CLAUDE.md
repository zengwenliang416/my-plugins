# UI-Design Plugin

Always answer in Chinese (Simplified).

## Available Commands
- `/ui-design`: End-to-end UI/UX design and implementation workflow.

## Workflow Phases
1. Init: Parse arguments and initialize `.claude/runs/<run_id>/`.
2. Scenario Confirm: Confirm `scenario` and `tech_stack` via `AskUserQuestion`.
3. Reference Analysis Team: Analyze visual, color, and component references in parallel and summarize.
4. Requirements: Generate `requirements.md`; for `optimize` scenario, also generate `code-analysis.md`.
5. Style Recommendation: Generate three style candidates.
6. Variant Selection: User confirms final variant.
7. Design Pipeline Team: Design generation → UX validation → fix loop → code generation → quality check.
8. Delivery: Output results and resumable command.

## Agent Team (Merged)
- `ui-design:analysis-core`
  - `mode=reference` + `perspective=visual|color|component`
  - `mode=requirements`
  - `mode=existing-code`
- `ui-design:design-core`
  - `mode=style`
  - `mode=variant`
- `ui-design:generation-core`
  - `mode=prototype`
  - `mode=refactor`
- `ui-design:validation-core`
  - `mode=ux`
  - `mode=quality`

## Sub-Agent Communication Conventions
- All messages use a unified envelope: `type/from/to/run_id/task_id/requires_ack/payload`.
- Directed messages with `requires_ack=true` must be acknowledged.
- Key events must be recorded to `${RUN_DIR}/team/mailbox.jsonl`.
- When waiting longer than 60 seconds, write to `${RUN_DIR}/team/heartbeat.jsonl`.

## Skill Invocation Conventions
- Sub-agents invoke `ui-design:gemini-cli` as needed for:
  - Reference analysis (analysis-core)
  - Style/variant generation (design-core)
  - Code prototype generation (generation-core)
- For non-essential model steps, prefer local analysis (Read / auggie / LSP).

## Quality Gates
- UX pass rate >= 80%
- High-priority UX issues = 0
- Maximum 2 fix rounds per variant
- Quality score >= 7.5/10

## Output Directory
- `ref-analysis-{visual,color,component}.md`
- `design-reference-analysis.md`
- `requirements.md`
- `style-recommendations.md`
- `design-{A,B,C}.md`
- `ux-check-{A,B,C}.md`
- `code/gemini-raw/`
- `code/<tech_stack>/`
- `quality-report.md`
- `team/{phase-events.jsonl,heartbeat.jsonl,mailbox.jsonl}`
