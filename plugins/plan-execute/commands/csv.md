---
description: "Transform plan files into CSV issue tracker"
argument-hint: "[--run-id=<id>]"
allowed-tools: ["Read", "Write", "Bash", "Glob", "Grep", "AskUserQuestion"]
---

# CSV Phase: Plan → CSV Transformation

You are the Lead orchestrator for the CSV phase. Your job is to deterministically transform plan files into a CSV issue tracker that the execute phase will consume.

## No Agents Required

This phase is a deterministic transformation — no agents are needed. You (the Lead) perform all work directly.

## Command Flags

- `--run-id=<id>`: **Required** — specify which run to process

## Execution Flow

### Step 1: Locate Run Directory

```bash
RUN_DIR=.claude/plan-execute/runs/${RUN_ID}
```

**Validate prerequisites:**

1. `${RUN_DIR}/` exists
2. `${RUN_DIR}/plan/plan-index.md` exists
3. At least one plan file `${RUN_DIR}/plan/NNN-*.md` exists

If any prerequisite fails, inform the user to run `/plan-execute:plan` first.

### Step 2: Parse Plan Files

For each `${RUN_DIR}/plan/NNN-*.md` file:

1. **Extract YAML frontmatter** between `---` markers:
   - `issue_id` (string)
   - `title` (string)
   - `priority` (number 1-5)
   - `scope` (string, comma-separated file paths)
   - `acceptance_criteria` (string)
   - `test_requirements` (string)
   - `depends_on` (array of issue_ids)

2. **Validate required fields** — warn on missing fields

3. **Sort by**: priority ASC, then issue_id ASC

### Step 3: Generate CSV

Write `${RUN_DIR}/issues.csv` with this schema:

```csv
issue_id,title,priority,plan_file,scope,acceptance_criteria,test_requirements,dev_state,review_state,review_fix_round,git_state,notes
```

**Column definitions:**

| Column              | Source        | Default Value |
| ------------------- | ------------- | ------------- |
| issue_id            | frontmatter   | -             |
| title               | frontmatter   | -             |
| priority            | frontmatter   | 3             |
| plan_file           | filename      | -             |
| scope               | frontmatter   | -             |
| acceptance_criteria | frontmatter   | -             |
| test_requirements   | frontmatter   | -             |
| dev_state           | (initialized) | pending       |
| review_state        | (initialized) | pending       |
| review_fix_round    | (initialized) | 0             |
| git_state           | (initialized) | pending       |
| notes               | (initialized) | (empty)       |

**CSV formatting rules:**

- Enclose fields containing commas or quotes in double quotes
- Escape internal double quotes by doubling them (`""`)
- Use Unix line endings (LF)
- First row is the header

### Step 4: Generate CSV Metadata

Write `${RUN_DIR}/csv-metadata.json`:

```json
{
  "run_id": "<RUN_ID>",
  "generated_at": "<ISO timestamp>",
  "total_issues": <N>,
  "priority_distribution": {
    "1": <count>,
    "2": <count>,
    "3": <count>,
    "4": <count>,
    "5": <count>
  },
  "dependency_chains": [
    ["001", "002", "003"],
    ["001", "004"]
  ],
  "source_plan_files": [
    "001-slug.md",
    "002-slug.md"
  ]
}
```

### Step 5: Display Summary

Present a summary table to the user:

```markdown
## CSV Generated

**Run ID**: {RUN_ID}
**Issues**: {N}
**File**: {RUN_DIR}/issues.csv

| #   | Title   | Priority | Depends On | State   |
| --- | ------- | -------- | ---------- | ------- |
| 001 | [title] | 1        | -          | pending |
| 002 | [title] | 2        | 001        | pending |

### Next Step

Run `/plan-execute:execute --run-id={RUN_ID}` to begin implementation.
```

## Validation Rules

Before writing CSV:

- [ ] All issue_ids are unique
- [ ] All `depends_on` references point to existing issue_ids
- [ ] No circular dependencies
- [ ] Priority values are 1-5
- [ ] Every issue has non-empty title and scope

If validation fails, report the specific errors and ask the user to fix the plan files.

## Error Handling

- **Missing plan files**: Tell user to run `/plan-execute:plan` first
- **Invalid YAML frontmatter**: Report which file has the error and what's wrong
- **Circular dependencies**: List the cycle and ask user to fix
- **Missing required fields**: Report which fields are missing in which files

## Critical Constraints

- **MUST NOT** spawn any agents (this is a Lead-only deterministic phase)
- **MUST** validate all plan files before generating CSV
- **MUST** initialize all state columns to their defaults
- **MUST** preserve the dependency information from plan files
- **MUST** write csv-metadata.json alongside issues.csv
- **MUST** properly escape CSV fields containing commas or quotes

Now transform the plan files into a CSV issue tracker.
