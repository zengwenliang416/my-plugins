# UI-Design Plugin Usage Guide v3.0

Always answer in Chinese (Simplified).

## Available Skills

| Skill                  | Trigger        | Description                              |
| ---------------------- | -------------- | ---------------------------------------- |
| `/ui-design:ui-design` | "design", "UI" | Full UI/UX design workflow (Native Team) |

## Quick Start

```bash
# Design from scratch
/ui-design Design a SaaS analytics dashboard

# With reference image
/ui-design --image=./reference.png Design a login page matching this style

# With design document
/ui-design --ref=./design-spec.md Implement this design spec

# Optimize existing UI
/ui-design --scenario=optimize Optimize the user settings page

# Specify tech stack
/ui-design --tech-stack=vue Design an e-commerce homepage
```

## Architecture

Hybrid architecture with two Team phases + Task/Lead mode:

```
Phase 1:   Init (Lead)              — mkdir, parse args
Phase 2:   Scenario Confirm (Lead)  — AskUserQuestion [HARD STOP]
Phase 2.5: Design Ref Analysis Team — 3 specialists + cross-validate + synthesis
Phase 3:   Requirements (Task)      — Task(requirement-analyzer)
Phase 4:   Style Recommend (Task)   — Task(style-recommender)
Phase 5:   Variant Selection (Lead) — AskUserQuestion [HARD STOP]
Phase 6-9: Design Pipeline Team     — designer + reviewer + coder pipeline
Phase 10:  Delivery (Lead)          — summary output
```

## Team 1: Design Reference Analysis (Phase 2.5)

Multi-perspective cross-validation supporting three input types:

| Input       | Parameter        | Confidence           |
| ----------- | ---------------- | -------------------- |
| Image       | `--image=<path>` | [EXTRACTED] High     |
| Document    | `--ref=<path>`   | [PARSED] Medium-High |
| Description | (no flag)        | [INFERRED] Medium    |

3 specialist analysts → independent analysis → cross-validation → weighted-vote synthesis

## Team 2: Design Pipeline (Phase 6-9)

Pipeline parallelism + structured fix loop:

```
designer builds A → reviewer reviews A (designer continues B in parallel)
reviewer finds issue → UX_FIX_REQUEST → designer fixes → UX_FIX_APPLIED → targeted re-check
all pass → coder generates code → reviewer validates quality
```

## Agent Types

| Category   | Agents                                                                                                                       | Description |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Analysis   | image-analyzer (coordinator), visual-analyst, color-analyst, component-analyst, requirement-analyzer, existing-code-analyzer | Analysis    |
| Design     | style-recommender, design-variant-generator                                                                                  | Design      |
| Validation | ux-guideline-checker, quality-validator                                                                                      | Validation  |
| Generation | gemini-prototype-generator, claude-code-refactor                                                                             | Generation  |

## Output Structure

```
openspec/changes/${CHANGE_ID}/
├── ref-analysis-{visual,color,component}.md  # Team 1 independent analysis
├── cross-validation-{visual,color,component}.md  # Team 1 cross-validation
├── design-reference-analysis.md              # Team 1 synthesis
├── requirements.md
├── style-recommendations.md
├── previews/
├── design-{A,B,C}.md                        # Team 2 designer
├── ux-check-{A,B,C}.md                      # Team 2 reviewer
├── code/{gemini-raw,${tech_stack}}/          # Team 2 coder
└── quality-report.md                         # Team 2 reviewer
```

## Quality Gates

| Phase   | Gate                 | Threshold |
| ------- | -------------------- | --------- |
| Phase 7 | UX pass rate         | >= 80%    |
| Phase 7 | High-priority issues | = 0       |
| Phase 7 | Fix round limit      | 2 rounds  |
| Phase 9 | Quality score        | >= 7.5/10 |

## Resume Workflow

```bash
/ui-design --run-id=20260131T100000Z
```

## Shared Resources

```
plugins/ui-design/skills/_shared/
├── colors/           # Color scheme library
├── styles/           # Style template library
├── typography/       # Typography system library
└── ux-guidelines/    # UX guideline references
```
