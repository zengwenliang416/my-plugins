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
    "TaskGet",
    "TaskOutput",
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
  → Create 6 tasks (3 investigation + 3 cross-validation)
  → Spawn 3 specialists as background agents
  → TaskOutput(block=true) — NO timeout
  → Broadcast all reports for cross-validation
  → TaskOutput(block=true) for cross-validation
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

## Phase 1: Initialization

### Step 1.1: Create Run Directory

Create a timestamped run directory:

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CHANGE_ID="${TIMESTAMP}"
RUN_DIR="openspec/changes/${CHANGE_ID}"
mkdir -p ${RUN_DIR}
```

Spec-only policy: bug-investigation artifacts MUST be consolidated under `openspec/changes/${CHANGE_ID}/`.

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

### Step 2.2: Create Investigation Tasks

Create 3 parallel investigation tasks:

**Task 1: Log Analysis**

```
TaskCreate(
  title: "Log Analysis",
  instructions: "Analyze logs and error messages to identify patterns and timeline",
  subagent_type: "bug-investigation:log-analyst",
  context: {
    bug_report: "${RUN_DIR}/bug-report.md",
    run_dir: "${RUN_DIR}",
    error_messages: [extracted errors],
    log_paths: [extracted log paths]
  }
)
```

**Task 2: Code Tracing**

```
TaskCreate(
  title: "Code Tracing",
  instructions: "Trace code execution path and identify root cause",
  subagent_type: "bug-investigation:code-tracer",
  context: {
    bug_report: "${RUN_DIR}/bug-report.md",
    run_dir: "${RUN_DIR}",
    file_hints: [extracted file paths],
    error_locations: [extracted from stack traces]
  }
)
```

**Task 3: Bug Reproduction**

```
TaskCreate(
  title: "Bug Reproduction",
  instructions: "Create minimal reproduction steps and failing test",
  subagent_type: "bug-investigation:reproducer",
  context: {
    bug_report: "${RUN_DIR}/bug-report.md",
    run_dir: "${RUN_DIR}",
    description: [bug description]
  }
)
```

### Step 2.3: Wait for Investigation Results

```
TaskOutput(block=true)  # NO timeout - wait indefinitely
```

Read the 3 analysis reports:

- `${RUN_DIR}/analysis-logs.md`
- `${RUN_DIR}/analysis-code.md`
- `${RUN_DIR}/analysis-reproduction.md`

### Step 2.4: Create Cross-Validation Tasks

Create 3 cross-validation tasks (blocked by initial investigation):

**Task 4: Cross-Validate Log Analysis**

```
TaskCreate(
  title: "Cross-Validate Log Analysis",
  instructions: "Review code-tracer and reproducer findings. Verify if log evidence supports their root cause.",
  subagent_type: "bug-investigation:log-analyst",
  context: {
    my_findings: "${RUN_DIR}/analysis-logs.md",
    code_findings: "${RUN_DIR}/analysis-code.md",
    repro_findings: "${RUN_DIR}/analysis-reproduction.md"
  },
  blocked_by: [task1_id, task2_id, task3_id]
)
```

**Task 5: Cross-Validate Code Tracing**

```
TaskCreate(
  title: "Cross-Validate Code Tracing",
  instructions: "Review log-analyst and reproducer findings. Verify if code analysis matches log timeline and reproduction.",
  subagent_type: "bug-investigation:code-tracer",
  context: {
    my_findings: "${RUN_DIR}/analysis-code.md",
    log_findings: "${RUN_DIR}/analysis-logs.md",
    repro_findings: "${RUN_DIR}/analysis-reproduction.md"
  },
  blocked_by: [task1_id, task2_id, task3_id]
)
```

**Task 6: Cross-Validate Reproduction**

```
TaskCreate(
  title: "Cross-Validate Reproduction",
  instructions: "Review log-analyst and code-tracer findings. Verify if reproduction confirms their root cause.",
  subagent_type: "bug-investigation:reproducer",
  context: {
    my_findings: "${RUN_DIR}/analysis-reproduction.md",
    log_findings: "${RUN_DIR}/analysis-logs.md",
    code_findings: "${RUN_DIR}/analysis-code.md"
  },
  blocked_by: [task1_id, task2_id, task3_id]
)
```

### Step 2.5: Wait for Cross-Validation

```
TaskOutput(block=true)  # NO timeout - wait indefinitely
```

### Step 2.6: Shutdown Team

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

| Agent Name  | subagent_type                 | Purpose                            |
| ----------- | ----------------------------- | ---------------------------------- |
| log-analyst | bug-investigation:log-analyst | Log/error analysis                 |
| code-tracer | bug-investigation:code-tracer | Code path tracing                  |
| reproducer  | bug-investigation:reproducer  | Bug reproduction + regression test |

## Critical Constraints

1. **MUST NOT invoke agent types outside restrictions**
   - Only use the 3 subagent types defined above
   - Each agent has specific allowed tools and responsibilities

2. **MUST NOT take over specialist work**
   - Lead does orchestration only
   - Do not perform log analysis, code tracing, or reproduction yourself
   - Delegate to specialist agents

3. **MUST use TaskOutput(block=true) with NO timeout**
   - Wait indefinitely for agents to complete
   - Do not proceed to next phase until all outputs are ready

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

1. Check TaskOutput for error message
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
