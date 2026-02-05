---
name: requirement-parser
description: |
  [Trigger] Plan workflow Step 1: Parse user requirements, structured output
  [Output] Outputs ${run_dir}/requirements.md
  [Skip] Direct analysis (use architecture-analyzer)
  [Ask First] When requirements are vague, ask about functionality boundaries and constraints
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path (passed by orchestrator)
---

# Requirement Parser - Requirement Parsing Atomic Skill

## Responsibility Boundary

- **Input**: `run_dir` + feature requirement in `${run_dir}/input.md`
- **Output**: `${run_dir}/requirements.md`
- **Single Responsibility**: Only do requirement parsing and structuring, no architecture analysis

## MCP Tool Integration

| MCP Tool              | Purpose                                        | Trigger                                   |
| --------------------- | ---------------------------------------------- | ----------------------------------------- |
| `auggie-mcp`          | Retrieve existing code, understand constraints | When requirement involves existing system |

## Execution Flow



```
  thought: "Analyzing user requirements. Need to identify: 1) Functional requirements 2) Non-functional requirements 3) UI/UX requirements 4) Constraints 5) Task type",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Requirement Classification**: Identify functional/non-functional/UI/constraints
2. **Boundary Definition**: Determine functionality boundaries and scope
3. **Priority Sorting**: P1/P2/P3 classification
4. **Acceptance Criteria**: Define verifiable acceptance conditions
5. **Ambiguity Detection**: Identify questions needing clarification

### Step 1: Read Input

```bash
# run_dir passed by orchestrator
FEATURE=$(cat "${run_dir}/input.md")
```

### Step 2: Requirement Classification

Based on user description, identify requirement types:

| Requirement Type            | Identification Signals              | Handling Method                  |
| --------------------------- | ----------------------------------- | -------------------------------- |
| Functional Requirements     | Verb prefix: implement, add, create | Extract user stories             |
| Non-Functional Requirements | Performance, security, availability | Categorize to NFR list           |
| UI/UX Requirements          | Interface, interaction, style       | Extract visual/interaction specs |
| Constraints                 | Tech stack, compatibility, time     | Record as constraints            |

### Step 3: Ambiguity Clarification

If requirements have the following issues, use AskUserQuestion to ask:

- Unclear boundaries: Where are the functionality boundaries?
- Unclear constraints: What technical or business constraints exist?
- Unclear priorities: Which are must-haves?
- Unclear acceptance: How to verify completion?

### Step 4: Task Type Determination

Determine task type based on requirement content:

| Type      | Criteria                            | Weight Allocation |
| --------- | ----------------------------------- | ----------------- |
| frontend  | Only involves UI/styles/interaction | Frontend 100%     |
| backend   | Only involves API/data/logic        | Backend 100%      |
| fullstack | Involves both frontend and backend  | Allocated by need |

### Step 5: Structured Output

Write parsed results to `${run_dir}/requirements.md`:

```markdown
# Requirement Specification

## Metadata

- Parse Time: [timestamp]
- Task Type: [frontend|backend|fullstack]
- Frontend Weight: [0-100]%
- Backend Weight: [0-100]%

## Requirement Overview

[One sentence describing the core requirement]

## Functional Requirements

| ID     | Requirement Description | Priority | Acceptance Criteria |
| ------ | ----------------------- | -------- | ------------------- |
| FR-001 |                         | P1/P2/P3 |                     |
| FR-002 |                         |          |                     |

## Non-Functional Requirements

| ID      | Category    | Constraint Description |
| ------- | ----------- | ---------------------- |
| NFR-001 | Performance | API response < 200ms   |
| NFR-002 | Security    | OWASP Top 10 compliant |

## UI/UX Requirements (if applicable)

| ID     | Component/Page | Interaction Description | Visual Spec |
| ------ | -------------- | ----------------------- | ----------- |
| UX-001 |                |                         |             |

## Constraints

- **Technical Constraints**: [Tech stack, version requirements]
- **Business Constraints**: [Time, budget, compliance]
- **Compatibility Constraints**: [Browser, device, API version]

## Assumptions & Dependencies

- Assumptions: [Implicit assumptions]
- Dependencies: [External dependencies]

## Items to Clarify

- [ ] [Questions needing further confirmation]

---

Next step: Call plan-context-retriever to retrieve context
```

## Return Value

After execution, return:

```
Requirement parsing complete.
Output file: ${run_dir}/requirements.md
Task type: [type]
Functional requirements: X
Non-functional requirements: Y

Next step: Use tpd:plan-context-retriever to retrieve context
```

## Quality Gates

- ✅ Extracted clear functional requirements
- ✅ Identified non-functional requirements
- ✅ Determined task type and weights
- ✅ Recorded constraints
- ✅ Clarified ambiguities (if any)

## Constraints

- Do not do architecture analysis (delegated to architecture-analyzer)
- Do not do code retrieval (delegated to plan-context-retriever)
- When requirements are unclear, must ask, do not assume
