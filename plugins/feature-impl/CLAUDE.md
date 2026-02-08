# Feature Implementation Plugin

A production-grade feature implementation pipeline using Agent Team orchestration with pipeline and parallel validation patterns.

## Available Skills

- `/feature-impl:implement` - Triggered by keywords: "implement", "feature", "add", "build", "实现功能"

## Quick Start

```
/feature-impl Add JWT authentication to user API
/feature-impl --plan-only Plan the Redis caching strategy
/feature-impl --tech-stack=react Build product search with filters
/feature-impl --skip-tests Quick prototype for payment webhook
```

## Architecture

```
                    ┌──────────────┐
                    │ Lead (User)  │
                    └──────┬───────┘
                           │
                    Phase 1: Init
                           │
                    ┌──────▼───────┐
                    │   Planner    │ (Task - single agent)
                    │   (Task)     │
                    └──────┬───────┘
                           │
                  ┌────────▼────────┐
                  │ Plan Review     │ (HARD STOP)
                  │ User Confirms   │
                  └────────┬────────┘
                           │
              Phase 3: Implementation Pipeline Team
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
  ┌────▼────┐      ┌──────▼──────┐      ┌────▼─────┐
  │  Impl   │      │  Impl       │      │  Impl    │
  │ Phase 1 │──┬──▶│  Phase 2    │──┬──▶│ Phase N  │
  └─────────┘  │   └─────────────┘  │   └────┬─────┘
               │                     │        │
               │                     │        │
               └──────────┬──────────┘        │
                          │                   │
                    ┌─────▼─────┐    ┌────────▼────────┐
                    │ TDD Guide │    │ Code Reviewer   │
                    │  (Tests)  │    │   (Quality)     │
                    └─────┬─────┘    └────────┬────────┘
                          │                   │
                          └──────────┬────────┘
                                     │
                              ┌──────▼──────┐
                              │Build        │
                              │Resolver     │
                              └──────┬──────┘
                                     │
                          ┌──────────▼───────────┐
                          │ Lead Delivery Report │
                          └──────────────────────┘
```

## Agent Types

| Agent Name     | Type                        | Purpose                            | Tools                                                                                 |
| -------------- | --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| planner        | feature-impl:planner        | Architecture design, plan creation | Read, Grep, Glob, Write, mcp**auggie-mcp**codebase-retrieval                          |
| implementer    | feature-impl:implementer    | Code implementation                | Read, Write, Edit, Bash, Grep, Glob, SendMessage, mcp**auggie-mcp**codebase-retrieval |
| tdd-guide      | feature-impl:tdd-guide      | Test-first methodology             | Read, Write, Edit, Bash, Grep, SendMessage                                            |
| code-reviewer  | feature-impl:code-reviewer  | Quality and security review        | Read, Grep, Glob, Bash, Write, SendMessage                                            |
| build-resolver | feature-impl:build-resolver | Build and type error fixing        | Read, Write, Edit, Bash, Grep, Glob, SendMessage                                      |

## Workflow Phases

### Phase 1: Initialization (Lead)

- Create run directory: `.claude/feature-impl/runs/${TIMESTAMP}/`
- Parse feature description and command flags
- Write `input.md` with normalized requirements

### Phase 2: Planning (Task)

- Spawn planner agent as Task (single agent, no Team needed)
- Planner performs:
  - Requirements analysis with clarifying questions
  - Codebase exploration using auggie-mcp semantic search
  - Architecture review and impact assessment
  - Step breakdown with file paths, dependencies, complexity, risks
- Output: `plan.md` with structured implementation plan
- **HARD STOP**: AskUserQuestion for plan confirmation
- If `--plan-only` flag: stop here and exit

### Phase 3: Implementation Pipeline (Team)

Lead creates Agent Team with task dependencies:

```
[1] Implement Phase 1 (implementer)
[2] Implement Phase 2 (implementer, blocked by 1)
[N] Implement Phase N (implementer, blocked by N-1)
[N+1] Write tests (tdd-guide, blocked by all implement tasks)
[N+2] Code review (code-reviewer, blocked by all implement tasks)
[N+3] Build check (build-resolver, blocked by N+1, N+2)
```

Parallel validation: `tdd-guide` and `code-reviewer` start as soon as implementation completes.

#### Structured Fix Loop

Within the Team, agents use JSON message protocol for fix coordination:

```
code-reviewer finds issue → REVIEW_FIX_REQUEST to implementer
  {
    "type": "REVIEW_FIX_REQUEST",
    "files": ["path/to/file.ts"],
    "issues": [
      {"severity": "HIGH", "category": "security", "description": "...", "location": "..."}
    ],
    "round": 1
  }

implementer fixes → REVIEW_FIX_APPLIED to code-reviewer
  {
    "type": "REVIEW_FIX_APPLIED",
    "changes": [
      {"file": "path/to/file.ts", "description": "Fixed SQL injection by using parameterized query"}
    ],
    "round": 1
  }

code-reviewer re-checks fixed items only → max 2 rounds

If still failing → REVIEW_ESCALATION to Lead → AskUserQuestion
```

Lead uses `TaskOutput(block=true)` to wait for all agents (no timeout).

### Phase 4: Delivery (Lead)

- Verify quality gates:
  - Tests pass
  - Build green
  - No critical review issues
  - Coverage >= 80%
- Write `delivery-report.md` with summary
- Report to user: files changed, test coverage, review status

## Output Structure

```
.claude/feature-impl/runs/${RUN_ID}/
├── input.md                  # Normalized requirements
├── plan.md                   # Implementation plan
├── implementation-log.md     # Implementation summary
├── test-report.md            # Test coverage and results
├── review-report.md          # Code review findings
├── build-fix-log.md          # Build error fixes (if any)
└── delivery-report.md        # Final delivery summary
```

## Quality Gates

- Tests pass: All tests must pass
- Coverage: >= 80% line coverage minimum
- Review: 0 critical or high-severity issues
- Build: Clean build with no errors

## Command Flags

- `--plan-only`: Stop after planning phase (no implementation)
- `--skip-tests`: Skip test generation (use for prototypes only)
- `--tech-stack=<name>`: Specify technology context (react, vue, node, etc.)

## Constraints

- MUST NOT invoke any agent types outside the Agent Type Restrictions table
- MUST NOT skip the planning phase (unless user explicitly requests)
- MUST HARD STOP at plan confirmation
- MUST NOT let Lead take over specialist work
- MUST use structured fix loop (REVIEW_FIX_REQUEST/REVIEW_FIX_APPLIED) with max 2 rounds
- MUST wait with TaskOutput(block=true) with no timeout

## Best Practices

- Always start with planning phase for proper architecture review
- Review plan carefully before confirming (this is your last chance to adjust scope)
- Use `--plan-only` first for large features to validate approach
- Specify `--tech-stack` for better context-aware code generation
- Never skip tests for production features (only use `--skip-tests` for throwaway prototypes)
- Let specialists do their work (don't override agent decisions without good reason)

## Examples

### Basic Feature

```
User: /feature-impl Add email verification to user registration

Lead: Creates run directory, spawns planner
Planner: Analyzes auth flow, identifies UserController, EmailService, creates 3-phase plan
Lead: Shows plan to user, waits for confirmation
User: Looks good, proceed
Lead: Creates Team with implementer, tdd-guide, code-reviewer, build-resolver
Implementer: Implements phases 1-3
TDD-Guide: Writes unit and integration tests (parallel)
Code-Reviewer: Reviews security and quality (parallel)
Build-Resolver: Fixes any type errors
Lead: Verifies quality gates, writes delivery report
```

### Plan-Only Mode

```
User: /feature-impl --plan-only Design a microservices migration strategy

Lead: Creates run directory, spawns planner
Planner: Analyzes monolith, identifies service boundaries, creates migration plan
Lead: Shows plan to user
(Stops here, no implementation)
```

### With Tech Stack Context

```
User: /feature-impl --tech-stack=react Add dark mode support

Lead: Creates run directory, spawns planner
Planner: (knows React context) Identifies component structure, proposes Context API approach
... (continues with implementation)
```
