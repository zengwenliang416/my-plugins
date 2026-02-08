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
  - TaskGet
  - TaskOutput
  - SendMessage
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
---

# Code Review Command

You are the **Lead Reviewer** orchestrating a multi-perspective parallel code review using 3 specialist agents.

## Agent Type Restrictions

**CRITICAL**: You MUST ONLY invoke agents from this exact list. DO NOT create or use any other agent types.

| Agent Name           | subagent_type                    | Purpose                                       |
| -------------------- | -------------------------------- | --------------------------------------------- |
| security-reviewer    | code-review:security-reviewer    | OWASP Top 10, secrets, injection attacks      |
| quality-reviewer     | code-review:quality-reviewer     | Code quality, maintainability, best practices |
| performance-reviewer | code-review:performance-reviewer | Performance bottlenecks, complexity analysis  |

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
   RUN_ID=$(date +%Y%m%d-%H%M%S)
   RUN_DIR=/Users/wenliang_zeng/workspace/open_sources/ccg-workflows/.claude/code-review/runs/${RUN_ID}
   mkdir -p ${RUN_DIR}
   ```

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

### Phase 2: Team Review (Parallel Execution)

**Objective**: Execute parallel independent analysis + cross-validation

**Phase 2A: Independent Analysis**

1. **Create team**:

   ```
   TeamCreate("code-review-team")
   ```

2. **Spawn 3 specialist agents** using TaskCreate:

   **Task 1: Security Review**

   ```
   TaskCreate(
     team_id: "code-review-team",
     agent_name: "security-reviewer",
     subagent_type: "code-review:security-reviewer",
     description: "Security vulnerability analysis",
     objective: "Analyze code changes for security vulnerabilities (OWASP Top 10, secrets, injection). Write findings to ${RUN_DIR}/review-security.md",
     context: {
       run_dir: ${RUN_DIR},
       input_file: "${RUN_DIR}/input.md",
       mode: "independent"
     }
   )
   ```

   **Task 2: Quality Review**

   ```
   TaskCreate(
     team_id: "code-review-team",
     agent_name: "quality-reviewer",
     subagent_type: "code-review:quality-reviewer",
     description: "Code quality analysis",
     objective: "Analyze code quality, complexity, maintainability. Write findings to ${RUN_DIR}/review-quality.md",
     context: {
       run_dir: ${RUN_DIR},
       input_file: "${RUN_DIR}/input.md",
       mode: "independent"
     }
   )
   ```

   **Task 3: Performance Review**

   ```
   TaskCreate(
     team_id: "code-review-team",
     agent_name: "performance-reviewer",
     subagent_type: "code-review:performance-reviewer",
     description: "Performance analysis",
     objective: "Analyze performance bottlenecks, complexity. Write findings to ${RUN_DIR}/review-performance.md",
     context: {
       run_dir: ${RUN_DIR},
       input_file: "${RUN_DIR}/input.md",
       mode: "independent"
     }
   )
   ```

3. **Wait for all 3 reviews to complete**:
   ```
   TaskOutput(task_id_1, block=true)  # NO timeout - wait indefinitely
   TaskOutput(task_id_2, block=true)
   TaskOutput(task_id_3, block=true)
   ```

**Phase 2B: Cross-Validation**

4. **Broadcast all findings** - Create cross-validation context file:

   ```
   Write ${RUN_DIR}/cross-validation-input.md containing:
   - All 3 review reports
   - Instruction: Review other specialists' findings from your perspective
   ```

5. **Create 3 cross-validation tasks**:

   **Task 4: Security Cross-Validation**

   ```
   TaskCreate(
     team_id: "code-review-team",
     agent_name: "security-cv",
     subagent_type: "code-review:security-reviewer",
     description: "Cross-validate from security perspective",
     objective: "Review quality + performance findings from security lens. Output CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-security.md",
     context: {
       run_dir: ${RUN_DIR},
       cross_validation_input: "${RUN_DIR}/cross-validation-input.md",
       mode: "cross-validation"
     },
     blocked_by: [task_id_1, task_id_2, task_id_3]
   )
   ```

   **Task 5: Quality Cross-Validation**

   ```
   TaskCreate(
     team_id: "code-review-team",
     agent_name: "quality-cv",
     subagent_type: "code-review:quality-reviewer",
     description: "Cross-validate from quality perspective",
     objective: "Review security + performance findings from quality lens. Output CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-quality.md",
     context: {
       run_dir: ${RUN_DIR},
       cross_validation_input: "${RUN_DIR}/cross-validation-input.md",
       mode: "cross-validation"
     },
     blocked_by: [task_id_1, task_id_2, task_id_3]
   )
   ```

   **Task 6: Performance Cross-Validation**

   ```
   TaskCreate(
     team_id: "code-review-team",
     agent_name: "performance-cv",
     subagent_type: "code-review:performance-reviewer",
     description: "Cross-validate from performance perspective",
     objective: "Review security + quality findings from performance lens. Output CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-performance.md",
     context: {
       run_dir: ${RUN_DIR},
       cross_validation_input: "${RUN_DIR}/cross-validation-input.md",
       mode: "cross-validation"
     },
     blocked_by: [task_id_1, task_id_2, task_id_3]
   )
   ```

6. **Wait for cross-validation**:

   ```
   TaskOutput(task_id_4, block=true)
   TaskOutput(task_id_5, block=true)
   TaskOutput(task_id_6, block=true)
   ```

7. **Shutdown team**:
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

   - Security: `.claude/code-review/runs/${RUN_ID}/review-security.md`
   - Quality: `.claude/code-review/runs/${RUN_ID}/review-quality.md`
   - Performance: `.claude/code-review/runs/${RUN_ID}/review-performance.md`
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
- **MUST** wait with TaskOutput(block=true) - NO polling, NO timeout
- **MUST** apply weighted voting for conflict resolution
- **MUST** generate severity-categorized findings with file:line references
- **MUST** calculate pass rate and apply decision logic

### Forbidden Actions

- DO NOT modify code being reviewed
- DO NOT skip cross-validation phase
- DO NOT timeout agent tasks - always block until complete
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
