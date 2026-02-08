---
name: plan-synthesizer
description: |
  [Trigger] Plan workflow Step 6: Integrate all artifacts to generate final plan
  [Output] Outputs ${run_dir}/plan.md (contains OpenSpec constraints and PBT properties)
  [Hard Stop] Must wait for user approval
---

# Plan Synthesizer - Plan Integration Atomic Skill

## Responsibility Boundary

- **Input**: `run_dir` + all prerequisite artifacts (including OpenSpec proposal and constraints)
- **Output**: `${run_dir}/plan.md`
- **Single Responsibility**: Only do plan integration, no new analysis

## MCP Tool Integration

| MCP Tool | Purpose | Trigger |
| -------- | ------- | ------- |

## Execution Flow

```
  thought: "Planning plan integration strategy. Need: 1) Read all artifacts 2) Extract key summaries 3) Verify consistency 4) Generate executive summary 5) Build roadmap",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Artifact Completeness Verification**: Confirm all prerequisite files exist
2. **Key Information Extraction**: Extract core content from each artifact
3. **Consistency Check**: Verify consistency between requirements/architecture/tasks/risks
4. **Summary Generation**: Generate concise executive summary
5. **Roadmap Construction**: Integrate milestones and critical path

### Step 1: Read All Artifacts

```bash
Read 工具读取 "${run_dir}/input.md"
Read 工具读取 "${run_dir}/requirements.md"  # If missing, use proposal.md instead
Read 工具读取 "${run_dir}/proposal.md"
Read 工具读取 "${run_dir}/constraints.md"
Read 工具读取 "${run_dir}/pbt.md"
Read 工具读取 "${run_dir}/context.md"
Read 工具读取 "${run_dir}/architecture.md"
Read 工具读取 "${run_dir}/tasks.md"
Read 工具读取 "${run_dir}/risks.md"
Read 工具读取 "${run_dir}/ambiguities.md"
```

### Step 2: Extract Summaries

Extract key information from each artifact:

| Artifact        | Extracted Content                                       |
| --------------- | ------------------------------------------------------- |
| proposal.md     | Proposal summary, goals and non-goals                   |
| constraints.md  | Constraints and explicit decisions                      |
| pbt.md          | Invariants and falsification strategies                 |
| requirements.md | Core requirements, task type, acceptance criteria       |
| context.md      | Key files, tech stack, dependencies                     |
| architecture.md | Architecture decisions, API design, component structure |
| tasks.md        | Task count, critical path, milestones                   |
| risks.md        | High risks, required mitigations                        |

### Step 3: Extract Proposal ID

Terminal command:

```bash
PROPOSAL_ID=$(jq -r '.proposal_id // empty' "${run_dir}/state.json")
```

### Step 4: Calculate Estimates

Summarize task complexity:

| Complexity | Baseline | Task Count | Subtotal |
| ---------- | -------- | ---------- | -------- |
| 1/5        | -        | X          | -        |
| 2/5        | -        | Y          | -        |
| 3/5        | -        | Z          | -        |
| 4/5        | -        | W          | -        |
| 5/5        | -        | V          | -        |

### Step 5: Assess Risk Level

| Condition        | Overall Risk Level |
| ---------------- | ------------------ |
| Has HIGH risks   | High               |
| Has MEDIUM risks | Medium             |
| Only LOW risks   | Low                |

### Step 6: Structured Output

使用 Edit 工具写入 `${run_dir}/plan.md`:

```markdown
# Development Implementation Plan

## Metadata

| Property     | Value                          |
| ------------ | ------------------------------ |
| Proposal ID  | [PROPOSAL_ID]                  |
| Generated At | [timestamp]                    |
| Task Type    | [frontend\|backend\|fullstack] |
| Total Tasks  | [count]                        |
| Risk Level   | [Low\|Medium\|High]            |

---

## Executive Summary

### Requirement Overview

[One paragraph description extracted from requirements.md]

### Technical Solution

[One paragraph description extracted from architecture.md]

### Key Risks

| Risk    | Level  | Mitigation |
| ------- | ------ | ---------- |
| [Risk1] | HIGH   | [Measure]  |
| [Risk2] | MEDIUM | [Measure]  |

---

## Requirement Specification

### Functional Requirements

| ID     | Requirement Description | Priority |
| ------ | ----------------------- | -------- |
| FR-001 | [Description]           | P1       |
| FR-002 | [Description]           | P2       |

### Non-Functional Requirements

| ID      | Category    | Constraint Description |
| ------- | ----------- | ---------------------- |
| NFR-001 | Performance | API response < 200ms   |
| NFR-002 | Security    | OWASP Top 10 compliant |

### Acceptance Criteria

- [ ] [Criterion1]
- [ ] [Criterion2]
- [ ] [Criterion3]

---

## OpenSpec Constraints and Criteria

### Constraints

- **Hard Constraints**: [from constraints.md]
- **Soft Constraints**: [from constraints.md]

### Non-Goals

- [from proposal.md / constraints.md]

### Success Criteria

- [from proposal.md / synthesis]

### PBT Properties

- [INVARIANT] ... → [FALSIFICATION] ...

---

## Architecture Design

### System Architecture Diagram
```

[ASCII architecture diagram or Mermaid]

````

### Key Components

| Component | Type | Responsibility |
|-----|-----|-----|
| AuthService | Backend Service | Authentication logic |
| LoginForm | Frontend Component | Login interface |

### Architecture Decisions

| Decision | Choice | Rationale |
|-----|-----|-----|
| Authentication | JWT + OAuth2 | Industry standard |
| State Management | Zustand | Lightweight |

---

## Implementation Roadmap

### Phase Division

```mermaid
gantt
    title Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase1
    Infrastructure       :a1, 2026-01-19, 1d
    section Phase2
    Backend API       :a2, after a1, 1d
    section Phase3
    Frontend Dev       :a3, after a1, 2d
    section Phase4
    Integration       :a4, after a2 a3, 1d
````

### Critical Path

```
T-001 → T-002 → T-006 → T-011 → T-012
```

### Milestones

| Milestone                | Completion Criteria | Acceptance Standard      |
| ------------------------ | ------------------- | ------------------------ |
| M1: Infrastructure Ready | T-001 ~ T-004       | DB connectable           |
| M2: API Available        | T-005, T-006        | Swagger accessible       |
| M3: Frontend Prototype   | T-009, T-010        | Storybook demo available |
| M4: Feature Complete     | All tasks           | E2E tests pass           |

### Task List

| Phase | ID    | Task                    | Type    | Complexity | Depends |
| ----- | ----- | ----------------------- | ------- | ---------- | ------- |
| 1     | T-001 | Create DB migration     | backend | 2/5        | -       |
| 1     | T-002 | Implement Prisma Schema | backend | 2/5        | T-001   |
| ...   | ...   | ...                     | ...     | ...        | ...     |

---

## Risks and Mitigation

### Risk Register

| ID    | Risk         | Level  | Mitigation      | Status  |
| ----- | ------------ | ------ | --------------- | ------- |
| R-001 | DB Migration | MEDIUM | Backup+Rollback | Pending |
| R-002 | JWT Leak     | MEDIUM | Key rotation    | Pending |

### Must Handle (Blocks Release)

1. **R-001: Prepare database migration rollback plan**
   - Owner: DBA
   - Verification: Rollback test pass

2. **R-002: Implement JWT secret rotation mechanism**
   - Owner: Backend Dev
   - Verification: Key rotation test

---

## Verification Plan

### Testing Strategy

| Test Type         | Tool       | Coverage Target |
| ----------------- | ---------- | --------------- |
| Unit Tests        | Jest       | Core logic 80%  |
| Integration Tests | Supertest  | API 100%        |
| E2E Tests         | Playwright | Key flows       |

### Quality Gates

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Code review pass
- [ ] Security scan no high severity
- [ ] Performance test pass

---

## Next Steps

### Approve This Plan

After confirming the above plan, execute development:

```bash
/dev --proposal-id=${PROPOSAL_ID}
```

### Artifact List

```
  ${run_dir}/
├── input.md           # Original input
├── proposal.md        # OpenSpec proposal
├── constraints.md     # Constraints and decisions
├── pbt.md             # PBT properties
├── requirements.md    # Requirement specification
├── context.md         # Code context
├── architecture.md    # Architecture design
├── tasks.md           # Task decomposition
├── risks.md           # Risk assessment
└── plan.md            # This plan document
```

---

**Proposal ID**: `${PROPOSAL_ID}`
**Generated At**: [timestamp]
**Status**: Pending Approval

```

## Return Value

After execution, return:

```

Plan integration complete.
Output file: ${run_dir}/plan.md
Task count: X
Risk level: [Low|Medium|High]

⏸️ Waiting for user approval...

After approval execute: /dev --proposal-id=${PROPOSAL_ID}

```

## Quality Gates

- ✅ Integrated all prerequisite artifacts (including OpenSpec constraints/PBT)
- ✅ Generated executive summary
- ✅ Included implementation roadmap
- ✅ Listed acceptance criteria
- ✅ Provided next steps guidance

## Constraints

- Do not do new analysis, only integrate existing artifacts
- Must wait for user approval
- Plan document must be readable standalone
- Must include next steps guidance
```
