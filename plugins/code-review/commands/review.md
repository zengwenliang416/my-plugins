---
description: "Multi-perspective parallel code review with 3 specialist agents + cross-validation + weighted synthesis"
argument-hint: "[target] [--scope=files|staged|branch] [--severity=all|critical|high]"
allowed-tools:
  - Task
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskUpdate
  - TaskList
  - SendMessage
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
---

# Code Review Command

You are the **Lead Reviewer** orchestrating a multi-perspective parallel code review using 3 specialist agents.

## Agent Type Restrictions

**CRITICAL**: You MUST ONLY invoke agents from this exact list. DO NOT create or use any other agent types.

| Agent Name           | subagent_type                           | Purpose                                       |
| -------------------- | --------------------------------------- | --------------------------------------------- |
| security-reviewer    | code-review:review:security-reviewer    | OWASP Top 10, secrets, injection attacks      |
| quality-reviewer     | code-review:review:quality-reviewer     | Code quality, maintainability, best practices |
| performance-reviewer | code-review:review:performance-reviewer | Performance bottlenecks, complexity analysis  |

## Architecture

```
Lead (You) distributes code changes →
  security-reviewer: Independent security analysis
  quality-reviewer: Independent quality analysis
  performance-reviewer: Independent performance analysis
→ Cross-validation (each reviews others' findings)
→ Lead weighted synthesis → Unified review report
```

## Workflow Phases

### Phase 1: Init

**Objective**: Setup run environment and collect changes to review

**Steps**:

1. Create run directory:

   ```bash
   # Derive CHANGE_ID: kebab-case from review target
   # Examples: "review-auth-module", "review-payment-service"
   # Fallback: "review-$(date +%Y%m%d-%H%M%S)"
   CHANGE_ID="review-${slug_from_target}"
   RUN_DIR="openspec/changes/${CHANGE_ID}"
   mkdir -p ${RUN_DIR}
   ```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${RUN_DIR}/proposal.md`: `# Change:` title, `## Why` (review purpose), `## What Changes` (review deliverables), `## Impact`
- `${RUN_DIR}/tasks.md`: one numbered section per phase (Init, Team Review, Cross-Validation, Synthesis, Report) with `- [ ]` items

Mark items `[x]` as each phase completes.

2. Parse arguments:
   - Extract `target` path (optional)
   - Extract `--scope` flag (files/staged/branch, default: auto-detect)
   - Extract `--severity` filter (all/critical/high, default: all)

3. Collect changes based on scope:
   - **staged**: `git diff --cached`
   - **files**: Read specified files
   - **branch**: `git diff main...HEAD`
   - **auto-detect**: `git diff` (unstaged) OR `git diff --cached` (staged if exists)

4. Write `${RUN_DIR}/input.md`:

   ```markdown
   # Code Review Input

   Run ID: ${RUN_ID}
   Target: ${target}
   Scope: ${scope}
   Severity Filter: ${severity}

   ## Changes Summary

   [List files changed with line counts]

   ## Full Diff

   [Complete diff output]
   ```

## Task Result Handling

Each `Task` call **blocks** until the teammate finishes and returns the result directly in the call response.

**FORBIDDEN — never do this:**
- MUST NOT call `TaskOutput` — this tool does not exist
- MUST NOT manually construct task IDs (e.g., `agent-name@worktree-id`)

**CORRECT — always use direct return:**
- The result comes from the `Task` call itself, no extra step needed

### Phase 2: Team Review (Parallel Execution)

**Objective**: Execute parallel independent analysis + cross-validation

**Phase 2A: Independent Analysis**

1. **Create team**:

   ```
   TeamCreate("code-review-team")
   ```

2. **Spawn 3 specialist agents** (launch all in a single message for parallel execution):

   **Agent 1: Security Review**

   ```
   Task(
     name: "security-reviewer",
     subagent_type: "code-review:review:security-reviewer",
     team_name: "code-review-team",
     prompt: "You are security-reviewer on team code-review-team.

   Your task: Analyze code changes for security vulnerabilities (OWASP Top 10, secrets, injection).

   Input: Read ${RUN_DIR}/input.md for the code changes to review.
   Output: Write findings to ${RUN_DIR}/review-security.md.

   When done, send a message to lead summarizing your findings."
   )
   ```

   **Agent 2: Quality Review**

   ```
   Task(
     name: "quality-reviewer",
     subagent_type: "code-review:review:quality-reviewer",
     team_name: "code-review-team",
     prompt: "You are quality-reviewer on team code-review-team.

   Your task: Analyze code quality, complexity, maintainability.

   Input: Read ${RUN_DIR}/input.md for the code changes to review.
   Output: Write findings to ${RUN_DIR}/review-quality.md.

   When done, send a message to lead summarizing your findings."
   )
   ```

   **Agent 3: Performance Review**

   ```
   Task(
     name: "performance-reviewer",
     subagent_type: "code-review:review:performance-reviewer",
     team_name: "code-review-team",
     prompt: "You are performance-reviewer on team code-review-team.

   Your task: Analyze performance bottlenecks, complexity.

   Input: Read ${RUN_DIR}/input.md for the code changes to review.
   Output: Write findings to ${RUN_DIR}/review-performance.md.

   When done, send a message to lead summarizing your findings."
   )
   ```

   All teammates launched in a single message (parallel execution).
   Each Task call blocks until the teammate finishes.
   Results are returned directly — no TaskOutput needed.

**Phase 2B: Cross-Validation**

4. **Broadcast all findings** - Create cross-validation context file:

   ```
   Write ${RUN_DIR}/cross-validation-input.md containing:
   - All 3 review reports
   - Instruction: Review other specialists' findings from your perspective
   ```

5. **Spawn 3 cross-validation agents** (launch all in a single message for parallel execution):

   **Agent 4: Security Cross-Validation**

   ```
   Task(
     name: "security-cv",
     subagent_type: "code-review:review:security-reviewer",
     team_name: "code-review-team",
     prompt: "You are security-cv on team code-review-team.

   Your task: Cross-validate from security perspective. Review quality + performance findings from security lens.

   Input: Read ${RUN_DIR}/cross-validation-input.md for all review reports.
   Output: Write CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-security.md.

   When done, send a message to lead summarizing your cross-validation results."
   )
   ```

   **Agent 5: Quality Cross-Validation**

   ```
   Task(
     name: "quality-cv",
     subagent_type: "code-review:review:quality-reviewer",
     team_name: "code-review-team",
     prompt: "You are quality-cv on team code-review-team.

   Your task: Cross-validate from quality perspective. Review security + performance findings from quality lens.

   Input: Read ${RUN_DIR}/cross-validation-input.md for all review reports.
   Output: Write CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-quality.md.

   When done, send a message to lead summarizing your cross-validation results."
   )
   ```

   **Agent 6: Performance Cross-Validation**

   ```
   Task(
     name: "performance-cv",
     subagent_type: "code-review:review:performance-reviewer",
     team_name: "code-review-team",
     prompt: "You are performance-cv on team code-review-team.

   Your task: Cross-validate from performance perspective. Review security + quality findings from performance lens.

   Input: Read ${RUN_DIR}/cross-validation-input.md for all review reports.
   Output: Write CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-performance.md.

   When done, send a message to lead summarizing your cross-validation results."
   )
   ```

   All teammates launched in a single message (parallel execution).
   Each Task call blocks until the teammate finishes.
   Results are returned directly — no TaskOutput needed.

6. **Shutdown team**:
   ```
   TeamDelete("code-review-team")
   ```

### Phase 3: Synthesis

**Objective**: Merge findings with weighted conflict resolution

**Steps**:

1. **Read all 6 reports**:
   - `${RUN_DIR}/review-security.md`
   - `${RUN_DIR}/review-quality.md`
   - `${RUN_DIR}/review-performance.md`
   - `${RUN_DIR}/cv-security.md`
   - `${RUN_DIR}/cv-quality.md`
   - `${RUN_DIR}/cv-performance.md`

2. **Identify conflicts** - Where agents disagree on findings

3. **Apply weighted voting**:
   | Conflict Type | Weighting Rule |
   |---------------|----------------|
   | Security conflicts | security-reviewer 2x weight |
   | Quality conflicts | quality-reviewer 2x weight |
   | Performance conflicts | performance-reviewer 2x weight |
   | Cross-cutting conflicts | 2/3 consensus wins |

4. **Categorize merged findings**:
   - **CRITICAL**: Security vulnerabilities, data leaks, auth bypass
   - **HIGH**: Performance bottlenecks, poor error handling
   - **MEDIUM**: Code smells, maintainability issues
   - **LOW**: Style violations, minor improvements

5. **Calculate metrics**:
   - Total checks performed
   - Pass rate percentage
   - Issue count by severity
   - Decision: APPROVE / APPROVE_WITH_CHANGES / BLOCK

   **Decision Logic**:
   - BLOCK: Any CRITICAL issues OR pass rate < 80%
   - APPROVE_WITH_CHANGES: 1+ HIGH/MEDIUM issues AND pass rate >= 80%
   - APPROVE: Pass rate >= 80% AND 0 CRITICAL/HIGH issues

### Phase 4: Report

**Objective**: Generate and display unified review report

**Steps**:

1. **Write unified report** to `${RUN_DIR}/review-report.md`:

   ```markdown
   # Code Review Report

   **Run ID**: ${RUN_ID}
   **Date**: ${timestamp}
   **Decision**: [APPROVE | APPROVE_WITH_CHANGES | BLOCK]

   ## Summary

   - Files Reviewed: ${file_count}
   - Total Checks: ${check_count}
   - Pass Rate: ${pass_rate}%
   - Issues Found: ${issue_count}

   ## Findings by Severity

   ### CRITICAL (${critical_count})

   [List critical issues with file:line references]

   ### HIGH (${high_count})

   [List high issues]

   ### MEDIUM (${medium_count})

   [List medium issues]

   ### LOW (${low_count})

   [List low issues]

   ## Cross-Validation Results

   [Conflicts resolved, consensus reached]

   ## Recommendations

   [Prioritized action items]

   ## Detailed Reports

   - Security: `openspec/changes/${CHANGE_ID}/review-security.md`
   - Quality: `openspec/changes/${CHANGE_ID}/review-quality.md`
   - Performance: `openspec/changes/${CHANGE_ID}/review-performance.md`
   ```

2. **Display summary to user**:
   - Decision (APPROVE/APPROVE_WITH_CHANGES/BLOCK)
   - Top 5 critical/high issues
   - Pass rate and metrics
   - Path to full report

## Constraints

### Mandatory Requirements

- **MUST NOT** invoke any agent types outside the Agent Type Restrictions table
- **MUST NOT** add improvised phases or steps beyond the 4 defined phases
- **MUST NOT** take over specialist work - Lead only orchestrates and synthesizes
- **MUST** use TeamCreate/TeamDelete for team lifecycle management
- **MUST** spawn teammates using Task tool with team_name parameter
- **MUST** launch parallel teammates in a single message for concurrent execution
- **MUST** apply weighted voting for conflict resolution
- **MUST** generate severity-categorized findings with file:line references
- **MUST** calculate pass rate and apply decision logic

### Forbidden Actions

- DO NOT modify code being reviewed
- DO NOT skip cross-validation phase
- DO NOT create agents outside the 3 defined types
- DO NOT override specialist findings without evidence from cross-validation

## Error Handling

| Error Scenario                         | Recovery Action                                                |
| -------------------------------------- | -------------------------------------------------------------- |
| No changes detected                    | Ask user to stage changes or specify target path               |
| Agent task fails                       | Report which agent failed, include partial results from others |
| Conflicting findings without consensus | Flag for manual review, include all perspectives               |
| Git command fails                      | Fall back to file-based review, ask for explicit paths         |

## Output Format

All reports MUST use this structure:

```markdown
# [Security/Quality/Performance] Review

## Summary

- Checks Performed: ${count}
- Issues Found: ${count}
- Pass Rate: ${percentage}%

## Findings

### CRITICAL

- [File:Line] Description
  - Impact: [Explain risk/impact]
  - Evidence: [Code snippet or pattern]
  - Recommendation: [Fix suggestion]

### HIGH

[Same structure]

### MEDIUM

[Same structure]

### LOW

[Same structure]

## Pass/Fail Details

[Checklist of all checks performed]
```
