# UI-Design Plugin

Always answer in Chinese (Simplified).

## Available Commands

- `/ui-design`: End-to-end UI/UX design and implementation workflow.

## Workflow Phases

1. Init: Parse arguments and initialize `openspec/changes/<run_id>/`.
2. Scenario Confirm: Confirm `scenario` and `tech_stack` via `AskUserQuestion`.
3. Reference Analysis: Analyze visual, color, and component references in parallel and summarize.
4. Requirements: Generate `requirements.md`; for `optimize` scenario, also generate `code-analysis.md`.
5. Style Recommendation: Generate three style candidates.
6. Variant Selection: User confirms final variant.
7. Design Pipeline: Design generation → UX validation → fix loop → code generation → quality check.
8. Delivery: Output results and resumable command.

## Agent Types

- `ui-design:analysis-core` — reference analysis, requirements, existing-code review
- `ui-design:design-core` — style recommendation, variant generation
- `ui-design:generation-core` — prototype and refactor code generation
- `ui-design:validation-core` — UX validation and quality gate

All agents are spawned via `Task()` calls. No Agent Team required — agents do not communicate with each other.

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
