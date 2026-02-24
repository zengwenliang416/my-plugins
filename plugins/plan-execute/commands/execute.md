---
description: "CSV-driven per-issue implementation pipeline with review loops and atomic commits"
argument-hint: "[--run-id=<id>] [--skip-review] [--dry-run]"
allowed-tools:
  [
    "Task",
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Glob",
    "Grep",
    "TeamCreate",
    "TeamDelete",
    "TaskCreate",
    "TaskUpdate",
    "TaskList",
    "TaskGet",
    "TaskOutput",
    "SendMessage",
    "AskUserQuestion",
    "mcp__auggie-mcp__codebase-retrieval",
  ]
---

# Execute Phase: CSV-Driven Implementation Pipeline

You are the Lead orchestrator for the execute phase. Your job is to process every issue in the CSV tracker, driving each through: implement → review → fix loop → commit.

## Agent Type Restrictions

You MUST ONLY invoke these agent types:

| Agent Name  | subagent_type            | Purpose                                  |
| ----------- | ------------------------ | ---------------------------------------- |
| implementer | plan-execute:implementer | Per-issue code implementation            |
| reviewer    | plan-execute:reviewer    | Per-issue review + acceptance validation |

## Command Flags

- `--run-id=<id>`: **Required** — specify which run to execute
- `--skip-review`: Skip review step (prototypes only)
- `--dry-run`: Show what would be executed without making changes

## Execution Flow

### Step 1: Load Run Artifacts

```bash
RUN_DIR=".claude/runs/${RUN_ID}"
```

Run artifacts MUST be consolidated under `.claude/runs/${RUN_ID}/`.

**Validate prerequisites:**

1. `${RUN_DIR}/issues.csv` exists
2. `${RUN_DIR}/csv-metadata.json` exists
3. `${RUN_DIR}/plan/` directory exists with plan files

If prerequisites fail, tell user which phase to run first.

### Step 2: Parse CSV

Read `${RUN_DIR}/issues.csv` and parse into an ordered list of issues.

**Execution order**: Process issues in CSV row order (already sorted by priority and dependency).

**Skip completed**: If `dev_state == "done"` AND `git_state == "committed"`, skip this issue (supports resume).

### Step 3: Create Agent Team

```
TeamCreate(
  team_name="plan-execute-run",
  description=f"Executing plan-execute pipeline: {RUN_ID}"
)
```

### Step 4: Per-Issue Sequential Pipeline

For each issue where `dev_state != "done"` or `git_state != "committed"`:

#### 4a. Update CSV State

Update `dev_state` to `in_progress` in the CSV file.

#### 4b. Read Plan File

Read the corresponding plan file from `${RUN_DIR}/plan/{plan_file}` to get full implementation details.

#### 4c. Spawn Implementer

```
TaskCreate(
  subject=f"Implement #{issue_id}: {title}",
  description=f"""
  You are implementing issue #{issue_id} from the plan-execute pipeline.

  ## Issue Details
  - **Title**: {title}
  - **Priority**: {priority}
  - **Scope**: {scope}
  - **Acceptance Criteria**: {acceptance_criteria}
  - **Test Requirements**: {test_requirements}

  ## Full Plan
  {plan_file_content}

  ## Run Directory
  {RUN_DIR}

  ## Guidelines
  - Follow existing project patterns and conventions
  - Only modify files within the declared scope
  - Handle edge cases per the plan
  - Write clean, minimal code

  ## Fix Loop Protocol
  If you receive a REVIEW_FIX_REQUEST message:
  1. Parse the JSON message
  2. Apply fixes for each issue
  3. Send REVIEW_FIX_APPLIED response via SendMessage to reviewer

  ## Output
  When complete, send a message to the team lead summarizing:
  - Files changed (with brief description)
  - Any deviations from plan
  - Edge cases handled
  """,
  activeForm=f"Implementing #{issue_id}: {title}"
)
# Assign to implementer agent via Task spawn
Task(
  subagent_type="plan-execute:implementer",
  team_name="plan-execute-run",
  name="implementer"
)
```

Wait for implementer to complete:

```
TaskOutput(task_id=implementer_task, block=true)  # No timeout
```

Update `dev_state` to `done` in CSV.

#### 4d. Spawn Reviewer (unless --skip-review)

```
TaskCreate(
  subject=f"Review #{issue_id}: {title}",
  description=f"""
  You are reviewing issue #{issue_id} from the plan-execute pipeline.

  ## Issue Details
  - **Title**: {title}
  - **Scope**: {scope}
  - **Acceptance Criteria**: {acceptance_criteria}
  - **Test Requirements**: {test_requirements}

  ## Review Focus
  1. Verify acceptance criteria are met
  2. Check code quality and security
  3. Validate test requirements are satisfied
  4. Ensure no regressions in related code

  ## Changed Files
  [List files from implementer's summary]

  ## Fix Loop Protocol
  If you find issues (CRITICAL or HIGH severity):
  1. Send REVIEW_FIX_REQUEST to implementer via SendMessage:
     {{"type": "REVIEW_FIX_REQUEST", "files": [...], "issues": [...], "round": 1}}
  2. Wait for REVIEW_FIX_APPLIED response
  3. Re-check ONLY fixed items
  4. Max 2 rounds, then escalate

  If all checks pass:
  - Send REVIEW_PASS to team lead via SendMessage:
    {{"type": "REVIEW_PASS", "issue_id": "{issue_id}"}}

  If escalation needed after 2 rounds:
  - Send REVIEW_ESCALATION to team lead via SendMessage:
    {{"type": "REVIEW_ESCALATION", "issue_id": "{issue_id}", "remaining_issues": [...]}}
  """,
  activeForm=f"Reviewing #{issue_id}: {title}"
)
Task(
  subagent_type="plan-execute:reviewer",
  team_name="plan-execute-run",
  name="reviewer"
)
```

Wait for reviewer to complete:

```
TaskOutput(task_id=reviewer_task, block=true)  # No timeout
```

**Handle review result:**

- `REVIEW_PASS`: Update `review_state` to `pass` in CSV
- `REVIEW_ESCALATION`: Update `review_state` to `escalated`, AskUserQuestion for guidance
- Fix loop tracking: Update `review_fix_round` in CSV

#### 4e. Lead Commits (Git)

**IMPORTANT**: Only the Lead handles git commits. Never delegate to agents.

```bash
# Stage only files in scope
git add {scope_files}

# Commit with conventional format
git commit -m "feat(plan-execute): #{issue_id} {title}

Implemented as part of plan-execute run {RUN_ID}.
Scope: {scope}
Acceptance: {acceptance_criteria}"
```

Update `git_state` to `committed` in CSV.

#### 4f. Update CSV and Continue

Write the updated CSV row back to `${RUN_DIR}/issues.csv`, then proceed to the next issue.

### Step 5: Shutdown Team

```
# Send shutdown to all teammates
SendMessage(type="shutdown_request", recipient="implementer")
SendMessage(type="shutdown_request", recipient="reviewer")

TeamDelete("plan-execute-run")
```

### Step 6: Generate Execution Report

Write `${RUN_DIR}/execution-report.md`:

```markdown
# Execution Report

**Run ID**: {RUN_ID}
**Date**: [ISO timestamp]
**Status**: COMPLETED / PARTIAL / FAILED

## Summary

- Total issues: {total}
- Completed: {completed}
- Skipped (already done): {skipped}
- Failed/Escalated: {failed}

## Per-Issue Status

| #   | Title   | Dev  | Review | Git       | Notes |
| --- | ------- | ---- | ------ | --------- | ----- |
| 001 | [title] | done | pass   | committed | -     |
| 002 | [title] | done | pass   | committed | -     |

## Commits

- [commit_hash] feat(plan-execute): #001 [title]
- [commit_hash] feat(plan-execute): #002 [title]

## Escalations (if any)

[Details of any escalated issues]

## Next Steps

[Recommendations for follow-up work]
```

### Step 7: Report to User

Present a clear summary:

- Overall status (all issues completed or partial)
- Commits made
- Any escalations needing attention
- Link to execution report

## Error Handling

- **Implementer fails**: Read error, decide if retry or escalate to user
- **Reviewer fails**: Skip review for this issue, note in CSV
- **Git commit fails**: Show error, ask user for guidance (do not force)
- **CSV parse error**: Report and ask user to fix CSV manually
- **Resume after interruption**: Re-read CSV, skip issues with `git_state == "committed"`, continue from first incomplete issue

## Critical Constraints

- **MUST NOT** invoke any agent types outside the Agent Type Restrictions table
- **MUST** process issues sequentially (not in parallel)
- **MUST** have Lead handle all git commits (never delegate to agents)
- **MUST** update CSV state after each step (supports resume)
- **MUST** use structured fix loop with max 2 rounds
- **MUST** wait with TaskOutput(block=true) with no timeout
- **MUST** escalate to user after 2 failed fix rounds
- **MUST** stage only scope-declared files for each commit

Now execute the CSV-driven implementation pipeline.
