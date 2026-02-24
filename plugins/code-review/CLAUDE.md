# Code Review Plugin

Multi-perspective parallel code review system using Agent Team with Fan-Out/Fan-In pattern.

## Available Skills

| Skill                 | Trigger                         | Description                                                                                             |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `/code-review:review` | "review", "code review", "审查" | Multi-perspective parallel code review with 3 specialist agents + cross-validation + weighted synthesis |

## Quick Start

```bash
# Review latest uncommitted changes
/code-review Review the latest changes

# Review specific directory
/code-review Review src/auth/

# Review staged changes only
/code-review Review --scope=staged

# Show only critical issues
/code-review Review --severity=critical
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Lead Agent                           │
│                   (Orchestration + Synthesis)                │
└────────────┬─────────────────────────────────────┬───────────┘
             │ Fan-Out                             │
             ▼                                     ▼
    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
    │   Security     │  │    Quality     │  │  Performance   │
    │   Reviewer     │  │   Reviewer     │  │   Reviewer     │
    └────────┬───────┘  └────────┬───────┘  └────────┬───────┘
             │                   │                   │
             │         Cross-Validation Phase        │
             │  (Each reviews others' findings)      │
             │                   │                   │
             └───────────────────┴───────────────────┘
                                 │ Fan-In
                                 ▼
                         ┌───────────────┐
                         │ Weighted      │
                         │ Synthesis     │
                         └───────────────┘
                                 │
                                 ▼
                         Unified Report
```

## Agent Types

| Agent Name             | Purpose                          | Focus Areas                                                                 |
| ---------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `security-reviewer`    | Security vulnerability detection | OWASP Top 10, secrets, injection attacks, authentication/authorization      |
| `quality-reviewer`     | Code quality assessment          | Complexity, maintainability, best practices, error handling                 |
| `performance-reviewer` | Performance analysis             | Algorithm complexity, N+1 queries, memory leaks, optimization opportunities |

## Workflow Phases

### Phase 1: Init

- Create run directory: `openspec/changes/${CHANGE_ID}/`
- Parse arguments (target path, scope, severity filter)
- Collect changes from git or specified files

### Phase 2: Team Review (Parallel)

- **Phase A**: 3 specialist agents analyze independently
- **Phase B**: Cross-validation - each agent reviews others' findings
- Lead orchestrates with TeamCreate/TeamDelete

### Phase 3: Synthesis

- Weighted voting for conflicting findings
- Security conflicts: security-reviewer 2x weight
- Quality conflicts: quality-reviewer 2x weight
- Performance conflicts: performance-reviewer 2x weight
- 2/3 consensus: adopt majority view

### Phase 4: Report

- Generate unified review report
- Decision: APPROVE / APPROVE_WITH_CHANGES / BLOCK

## Output Structure

```
openspec/changes/${CHANGE_ID}/
├── input.md                 # Change summary
├── review-security.md       # Security findings
├── review-quality.md        # Quality findings
├── review-performance.md    # Performance findings
└── review-report.md         # Unified synthesis
```

## Quality Gates

| Metric           | Threshold                     |
| ---------------- | ----------------------------- |
| Pass Rate        | >= 80% checks passed          |
| Critical Issues  | 0 blocking issues             |
| Cross-Validation | >= 2/3 agreement on conflicts |

## Arguments

| Argument     | Values                      | Default         | Description                  |
| ------------ | --------------------------- | --------------- | ---------------------------- |
| `target`     | path or empty               | current changes | Files or directory to review |
| `--scope`    | `files`, `staged`, `branch` | auto-detect     | Review scope                 |
| `--severity` | `all`, `critical`, `high`   | `all`           | Minimum severity to report   |

## Examples

```bash
# Review all unstaged changes
/code-review Review

# Review specific files
/code-review Review src/auth/login.ts src/auth/register.ts

# Review only high/critical issues
/code-review Review --severity=high

# Review staged changes before commit
/code-review Review --scope=staged
```

## Best Practices

1. **Run before commits** - Catch issues early in development
2. **Review critical paths** - Focus on authentication, payment, data handling
3. **Address blocking issues** - Fix CRITICAL findings before merging
4. **Learn from findings** - Review patterns to improve code quality
5. **Automate in CI** - Integrate into pre-commit hooks or CI pipelines
