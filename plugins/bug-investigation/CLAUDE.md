# Bug Investigation Plugin

Multi-angle bug investigation using Agent Team with Fan-Out pattern. Three specialist agents work in parallel to triangulate the root cause from different perspectives: log analysis, code tracing, and bug reproduction.

## Available Skills

- `/bug-investigation:investigate` - Trigger multi-angle bug investigation
- Keywords: "bug", "investigate", "调查bug"

## Quick Start

Basic bug investigation:

```
/bug-investigation Users report 500 error on checkout
```

With specific error message:

```
/bug-investigation --error="TypeError: Cannot read property 'id' of undefined"
```

With file hint:

```
/bug-investigation --file="src/checkout.ts" Cart submission fails randomly
```

With log path:

```
/bug-investigation --logs="logs/error.log" Production crash at 3am
```

## Architecture

The plugin implements a Fan-Out pattern with triangulation:

```
Lead receives bug report →
  ├─ log-analyst: Log/error message analysis + pattern matching
  ├─ code-tracer: Code path tracing + root cause identification
  └─ reproducer: Reproduction steps + regression test writing
→ Cross-validation (triangulate root cause)
→ Lead synthesis → Bug report + fix recommendation
```

### Agent Types

| Agent Name  | Purpose            | Key Capabilities                                                        |
| ----------- | ------------------ | ----------------------------------------------------------------------- |
| log-analyst | Log/error analysis | Parse stack traces, pattern matching, timeline reconstruction           |
| code-tracer | Code path tracing  | Trace execution flow, semantic code analysis, root cause identification |
| reproducer  | Bug reproduction   | Create minimal repro steps, write failing tests, verify fix approach    |

### Workflow Phases

**Phase 1: Initialization**

- Lead creates investigation run directory
- Parses bug description, error messages, file hints, log paths
- Generates structured bug report

**Phase 2: Parallel Investigation**

- Lead spawns 3 specialist agents as background tasks
- Each agent investigates from their unique angle
- Agents report findings back to lead

**Phase 3: Cross-Validation**

- Lead broadcasts all findings to all agents
- Each agent validates findings from other perspectives
- Triangulate root cause: 3/3 agree = high confidence, 2/3 = medium, <2/3 = low

**Phase 4: Synthesis**

- Lead combines evidence from all angles
- Generates fix recommendation
- Creates comprehensive investigation report
- If low confidence, asks user for additional context

## Output

All investigation artifacts are stored in:

```
.claude/bug-investigation/runs/${RUN_ID}/
  ├─ bug-report.md              # Initial bug description
  ├─ analysis-logs.md           # Log analyst findings
  ├─ analysis-code.md           # Code tracer findings
  ├─ analysis-reproduction.md   # Reproducer findings
  └─ investigation-report.md    # Final synthesis
```

## Quality Gates

Investigation is complete when:

- Root cause is identified with medium+ confidence
- At least 2/3 agents agree on the root cause
- Reproduction steps are confirmed
- Regression test is written
- Fix recommendation is provided

## Usage Tips

- Provide as much context as possible (error messages, file paths, log files)
- If you have stack traces, include them in the bug description
- If the bug is intermittent, mention frequency and conditions
- If recent changes are suspected, mention time frame or commits
- Use `--error` for specific error messages
- Use `--file` when you know the approximate location
- Use `--logs` when you have relevant log files

## Example Investigations

### Example 1: Production Error

```
/bug-investigation --error="Connection timeout to database" --logs="logs/production.log"
Users report checkout failures during peak hours
```

### Example 2: Development Bug

```
/bug-investigation --file="src/components/UserProfile.tsx"
Avatar image not displaying after upload
```

### Example 3: Regression

```
/bug-investigation Feature X worked in v1.2.3 but broken in v1.2.4
```

## Architecture Benefits

- **Triangulation**: Multiple perspectives increase confidence in root cause
- **Parallel execution**: Faster investigation through concurrent analysis
- **Evidence-based**: Each finding must be supported by concrete evidence
- **Cross-validation**: Agents verify each other's findings
- **Regression prevention**: Automated test creation prevents recurrence
