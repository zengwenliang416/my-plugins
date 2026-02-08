# Plan-Execute Plugin

A CSV-driven plan-execute pipeline that uses CSV as a state machine contract to drive per-issue implementation with review loops and atomic commits.

<available-skills>

| Skill                   | Trigger                       | Description                                   |
| ----------------------- | ----------------------------- | --------------------------------------------- |
| `/plan-execute:plan`    | "plan", "investigate", "分析" | Codebase investigation + plan file generation |
| `/plan-execute:csv`     | "csv", "generate csv"         | Transform plan files into CSV issue tracker   |
| `/plan-execute:execute` | "execute", "run", "执行"      | CSV-driven per-issue implementation pipeline  |

</available-skills>

## Overview

Three-phase workflow inspired by Codex CLI patterns: Plan → CSV → Execute.

Key innovation: **CSV as a contract** that forces ALL issues to be completed with state tracking per issue (dev/review/git states).

## Quick Start

```bash
# 1. Investigate codebase and generate plan
/plan-execute:plan Add JWT authentication to the user API

# 2. Transform plan into CSV issue tracker
/plan-execute:csv

# 3. Execute all issues with per-issue review + commit
/plan-execute:execute
```

## Architecture

```
/plan-execute:plan          /plan-execute:csv         /plan-execute:execute
┌────────────────┐          ┌──────────────┐          ┌──────────────────────┐
│ Lead + invest- │  plan/   │ Lead (inline)│ issues   │ Lead orchestrates    │
│ igator agent   │────────►│ Deterministic │────────►│ per-issue loop:      │
│                │ *.md     │ transform     │ .csv     │  implement → review  │
└────────────────┘          └──────────────┘          │  → fix loop → commit │
                                                       └──────────────────────┘
```

Phases linked by artifacts in shared run directory.

## Phase Data Flow

```
.claude/plan-execute/runs/${RUN_ID}/
├── input.md                    # plan phase writes
├── plan/                       # plan phase writes
│   ├── 001-<slug>.md          #   each with YAML frontmatter
│   └── plan-index.md          #   ordered summary
├── issues.csv                  # csv phase writes, execute phase reads/updates
├── csv-metadata.json           # csv phase writes
└── execution-report.md         # execute phase writes
```

## CSV Schema

```csv
issue_id,title,priority,plan_file,scope,acceptance_criteria,test_requirements,dev_state,review_state,review_fix_round,git_state,notes
```

States:

- `dev_state`: pending → in_progress → done
- `review_state`: pending → pass → fail → escalated
- `git_state`: pending → committed

## Agent Types

| Agent Name   | Type                      | Purpose                                   |
| ------------ | ------------------------- | ----------------------------------------- |
| investigator | plan-execute:investigator | Codebase exploration + plan file creation |
| implementer  | plan-execute:implementer  | Per-issue code implementation             |
| reviewer     | plan-execute:reviewer     | Per-issue review + acceptance validation  |

## Agent Team Design (Execute Phase)

Sequential per-issue pipeline within a single team:

```
For each issue in CSV where dev_state != "done":
  TaskCreate(implementer, blocked_by: [prev_issue_commit])
  TaskCreate(reviewer, blocked_by: [implementer])
  Wait → Fix loop (max 2 rounds) → Lead commits → Next
```

Fix loop protocol: `REVIEW_FIX_REQUEST` / `REVIEW_FIX_APPLIED` / `REVIEW_PASS` / `REVIEW_ESCALATION`

## Constraints

- MUST NOT invoke any agent types outside the Agent Types table
- MUST execute issues sequentially (later issues may depend on earlier changes)
- MUST use structured fix loop with max 2 rounds
- MUST have Lead handle all git commits (not delegated to agents)
- MUST update CSV state after each issue completes
- MUST HARD STOP at plan confirmation before CSV generation
