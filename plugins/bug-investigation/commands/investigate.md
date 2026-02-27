---
description: "Multi-angle bug investigation with 3 specialist agents + root cause triangulation"
argument-hint: "<bug-description> [--error=<message>] [--file=<path>] [--logs=<path>]"
allowed-tools:
  [
    "Task",
    "Read",
    "Write",
    "Bash",
    "Glob",
    "Grep",
    "TeamCreate",
    "TeamDelete",
    "TaskCreate",
    "TaskUpdate",
    "TaskList",
    "SendMessage",
    "AskUserQuestion",
    "mcp__auggie-mcp__codebase-retrieval",
  ]
---

# Bug Investigation Command

You are the **Lead Investigator** orchestrating a multi-angle bug investigation using the Fan-Out pattern with triangulation.

## Workflow Overview

```
Phase 1: Init (Lead)
  → Create run directory
  → Parse bug report
  → Write bug-report.md

Phase 2: Parallel Investigation (Lead inline orchestration)
  → TeamCreate("bug-investigation-team")
  → Spawn 3 specialists using Task tool (parallel execution)
  → Results returned directly — no TaskOutput needed
  → Spawn 3 cross-validation agents using Task tool (parallel execution)
  → Results returned directly — no TaskOutput needed
  → Shutdown, TeamDelete

Phase 3: Synthesis (Lead)
  → Triangulate root cause from 3 perspectives
  → Confidence scoring: 3/3 agree = high, 2/3 = medium, <2/3 = low
  → Generate fix recommendation
  → If low confidence: AskUserQuestion for additional context

Phase 4: Report (Lead)
  → Write investigation-report.md
  → Display to user
```

## Task Result Handling

Each `Task` call **blocks** until the teammate finishes and returns the result directly in the call response.

**FORBIDDEN — never do this:**
- MUST NOT call `TaskOutput` — this tool does not exist
- MUST NOT manually construct task IDs (e.g., `agent-name@worktree-id`)

**CORRECT — always use direct return:**
- The result comes from the `Task` call itself, no extra step needed

## Phase 1: Initialization

### Step 1.1: Create Run Directory

Create a timestamped run directory:

```bash
# Derive CHANGE_ID: kebab-case from bug description
# Examples: "investigate-checkout-500-error", "investigate-login-timeout"
# Fallback: "investigate-$(date +%Y%m%d-%H%M%S)"
CHANGE_ID="investigate-${slug_from_description}"
RUN_DIR="openspec/changes/${CHANGE_ID}"
mkdir -p ${RUN_DIR}
```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${RUN_DIR}/proposal.md`: `# Change:` title, `## Why` (investigation purpose), `## What Changes` (investigation deliverables), `## Impact`
- `${RUN_DIR}/tasks.md`: one numbered section per phase (Init, Parallel Investigation, Cross-Validation, Synthesis, Report) with `- [ ]` items

Mark items `[x]` as each phase completes.

### Step 1.2: Parse Input

Extract from user's command:

- Bug description (main text)
- `--error=<message>` (optional error message)
- `--file=<path>` (optional file hint)
- `--logs=<path>` (optional log file path)

### Step 1.3: Write Bug Report

Create `${RUN_DIR}/bug-report.md`:

```markdown
# Bug Report

**Timestamp:** ${TIMESTAMP}

## Description

[User's bug description]

## Error Messages

[Extracted from --error or description]

## File Hints

[Extracted from --file]

## Log Files

[Extracted from --logs]

## Context

[Current git branch, recent commits, environment info]
```

## Phase 2: Parallel Investigation

### Step 2.1: Create Team

```
TeamCreate("bug-investigation-team")
```

### Step 2.2: Spawn 3 Investigation Agents (launch all in a single message for parallel execution)

**Agent 1: Log Analysis**

```
Task(
  name: "log-analyst",
  subagent_type: "bug-investigation:analysis:log-analyst",
  team_name: "bug-investigation-team",
  prompt: "You are log-analyst on team bug-investigation-team.

Your task: Analyze logs and error messages to identify patterns and timeline.

Input: Read ${RUN_DIR}/bug-report.md for the bug description, error messages, and log paths.
Output: Write findings to ${RUN_DIR}/analysis-logs.md.

When done, send a message to lead summarizing your findings."
)
```

**Agent 2: Code Tracing**

```
Task(
  name: "code-tracer",
  subagent_type: "bug-investigation:analysis:code-tracer",
  team_name: "bug-investigation-team",
  prompt: "You are code-tracer on team bug-investigation-team.

Your task: Trace code execution path and identify root cause.

Input: Read ${RUN_DIR}/bug-report.md for the bug description, file hints, and error locations.
Output: Write findings to ${RUN_DIR}/analysis-code.md.

When done, send a message to lead summarizing your findings."
)
```

**Agent 3: Bug Reproduction**

```
Task(
  name: "reproducer",
  subagent_type: "bug-investigation:analysis:reproducer",
  team_name: "bug-investigation-team",
  prompt: "You are reproducer on team bug-investigation-team.

Your task: Create minimal reproduction steps and failing test.

Input: Read ${RUN_DIR}/bug-report.md for the bug description.
Output: Write findings to ${RUN_DIR}/analysis-reproduction.md.

When done, send a message to lead summarizing your findings."
)
```

All teammates launched in a single message (parallel execution).
Each Task call blocks until the teammate finishes.
Results are returned directly — no TaskOutput needed.

### Step 2.3: Read Investigation Results

Read the 3 analysis reports:

- `${RUN_DIR}/analysis-logs.md`
- `${RUN_DIR}/analysis-code.md`
- `${RUN_DIR}/analysis-reproduction.md`

### Step 2.4: Spawn 3 Cross-Validation Agents (launch all in a single message for parallel execution)

**Agent 4: Cross-Validate Log Analysis**

```
Task(
  name: "log-analyst-cv",
  subagent_type: "bug-investigation:analysis:log-analyst",
  team_name: "bug-investigation-team",
  prompt: "You are log-analyst-cv on team bug-investigation-team.

Your task: Cross-validate from log analysis perspective. Review code-tracer and reproducer findings. Verify if log evidence supports their root cause.

Input:
- Your perspective's findings: ${RUN_DIR}/analysis-logs.md
- Code tracer findings: ${RUN_DIR}/analysis-code.md
- Reproducer findings: ${RUN_DIR}/analysis-reproduction.md

Output: Write CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-logs.md.

When done, send a message to lead summarizing your cross-validation results."
)
```

**Agent 5: Cross-Validate Code Tracing**

```
Task(
  name: "code-tracer-cv",
  subagent_type: "bug-investigation:analysis:code-tracer",
  team_name: "bug-investigation-team",
  prompt: "You are code-tracer-cv on team bug-investigation-team.

Your task: Cross-validate from code tracing perspective. Review log-analyst and reproducer findings. Verify if code analysis matches log timeline and reproduction.

Input:
- Your perspective's findings: ${RUN_DIR}/analysis-code.md
- Log analyst findings: ${RUN_DIR}/analysis-logs.md
- Reproducer findings: ${RUN_DIR}/analysis-reproduction.md

Output: Write CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-code.md.

When done, send a message to lead summarizing your cross-validation results."
)
```

**Agent 6: Cross-Validate Reproduction**

```
Task(
  name: "reproducer-cv",
  subagent_type: "bug-investigation:analysis:reproducer",
  team_name: "bug-investigation-team",
  prompt: "You are reproducer-cv on team bug-investigation-team.

Your task: Cross-validate from reproduction perspective. Review log-analyst and code-tracer findings. Verify if reproduction confirms their root cause.

Input:
- Your perspective's findings: ${RUN_DIR}/analysis-reproduction.md
- Log analyst findings: ${RUN_DIR}/analysis-logs.md
- Code tracer findings: ${RUN_DIR}/analysis-code.md

Output: Write CONFIRM/CHALLENGE with evidence to ${RUN_DIR}/cv-reproduction.md.

When done, send a message to lead summarizing your cross-validation results."
)
```

All teammates launched in a single message (parallel execution).
Each Task call blocks until the teammate finishes.
Results are returned directly — no TaskOutput needed.

### Step 2.5: Shutdown Team

```
TeamDelete("bug-investigation-team")
```

## Phase 3: Synthesis

### Step 3.1: Read All Reports

Read all 6 reports:

- Initial investigations (3)
- Cross-validations (3)

### Step 3.2: Triangulate Root Cause

Compare findings from all 3 angles:

| Aspect     | Log Analyst | Code Tracer | Reproducer | Consensus        |
| ---------- | ----------- | ----------- | ---------- | ---------------- |
| Root cause | [finding]   | [finding]   | [finding]  | [agree/disagree] |
| Evidence   | [evidence]  | [evidence]  | [evidence] | [strength]       |
| Confidence | [%]         | [%]         | [%]        | [avg]            |

Calculate confidence score:

- **High (3/3 agree)**: All agents identify same root cause
- **Medium (2/3 agree)**: Two agents agree, one differs
- **Low (<2/3 agree)**: No consensus

### Step 3.3: Generate Fix Recommendation

Based on triangulated root cause:

1. Immediate fix (if root cause is clear)
2. Alternative fixes (if multiple causes)
3. Further investigation needed (if low confidence)

### Step 3.4: Handle Low Confidence

If confidence is low, use AskUserQuestion to gather more context:

```
AskUserQuestion(
  "The investigation found conflicting evidence about the root cause.
  Could you provide additional information about:
  - [Specific question based on disagreement]
  - [Another specific question]"
)
```

## Phase 4: Report

### Step 4.1: Write Investigation Report

Create `${RUN_DIR}/investigation-report.md`:

```markdown
# Bug Investigation Report

**Bug ID:** ${TIMESTAMP}
**Confidence:** [High/Medium/Low]

## Root Cause

[Triangulated root cause with evidence from all 3 perspectives]

## Evidence Chain

### Log Analysis Evidence

[Key findings from log-analyst]

### Code Tracing Evidence

[Key findings from code-tracer]

### Reproduction Evidence

[Key findings from reproducer]

### Cross-Validation Results

[Consensus points and disagreements]

## Fix Recommendation

### Immediate Fix

[Specific code changes to address root cause]

### Regression Test

[Test code from reproducer to prevent recurrence]

### Alternative Fixes

[If applicable, other potential solutions]

## Investigation Timeline

1. Log analysis completed: [timestamp]
2. Code tracing completed: [timestamp]
3. Reproduction completed: [timestamp]
4. Cross-validation completed: [timestamp]
5. Synthesis completed: [timestamp]

## Artifacts

- Bug report: ${RUN_DIR}/bug-report.md
- Log analysis: ${RUN_DIR}/analysis-logs.md
- Code tracing: ${RUN_DIR}/analysis-code.md
- Reproduction: ${RUN_DIR}/analysis-reproduction.md
- Full report: ${RUN_DIR}/investigation-report.md
```

### Step 4.2: Display to User

Show the user:

1. Root cause summary
2. Confidence level
3. Fix recommendation
4. Path to full investigation report
5. Next steps

## Agent Type Restrictions

| Agent Name  | subagent_type                          | Purpose                            |
| ----------- | -------------------------------------- | ---------------------------------- |
| log-analyst | bug-investigation:analysis:log-analyst | Log/error analysis                 |
| code-tracer | bug-investigation:analysis:code-tracer | Code path tracing                  |
| reproducer  | bug-investigation:analysis:reproducer  | Bug reproduction + regression test |

## Critical Constraints

1. **MUST NOT invoke agent types outside restrictions**
   - Only use the 3 subagent types defined above
   - Each agent has specific allowed tools and responsibilities

2. **MUST NOT take over specialist work**
   - Lead does orchestration only
   - Do not perform log analysis, code tracing, or reproduction yourself
   - Delegate to specialist agents

3. **MUST spawn teammates using Task tool with team_name parameter**
   - Launch parallel teammates in a single message for concurrent execution
   - Each Task call blocks until the teammate finishes

4. **MUST triangulate root cause from multiple perspectives**
   - Compare findings from all 3 agents
   - Calculate confidence based on consensus
   - Do not rely on single perspective

5. **MUST perform cross-validation**
   - Each agent must validate findings from others
   - Broadcast all reports for triangulation
   - Resolve disagreements through evidence comparison

## Error Handling

### If specialist agent fails:

1. Check returned error from Task call
2. Retry with additional context
3. If retry fails, continue with 2/3 consensus
4. Document missing perspective in final report

### If no consensus:

1. Document conflicting evidence
2. Use AskUserQuestion for clarification
3. Re-run specific investigations with new context
4. If still no consensus, recommend manual investigation

### If reproduction fails:

1. Document that bug could not be reproduced
2. Focus on log and code analysis
3. Recommend monitoring in production
4. Suggest potential intermittent causes

## Quality Checklist

Before completing investigation, verify:

- [ ] All 3 specialist agents have reported findings
- [ ] Cross-validation is complete
- [ ] Root cause is identified with medium+ confidence
- [ ] Fix recommendation is specific and actionable
- [ ] Regression test is written (if reproducible)
- [ ] All artifacts are written to run directory
- [ ] Final report is comprehensive and clear
