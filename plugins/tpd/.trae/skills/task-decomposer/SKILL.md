---
name: task-decomposer
description: |
  [Trigger] Plan workflow Step 4: Decompose architecture solution into executable tasks
  [Output] Outputs ${run_dir}/tasks.md
  [Mandatory Tool] Skill call codex-cli to verify task feasibility
---

# Task Decomposer - Task Decomposition Atomic Skill

## Responsibility Boundary

- **Input**: `run_dir` + `${run_dir}/architecture.md`
- **Output**: `${run_dir}/tasks.md`
- **Single Responsibility**: Only do task decomposition, no risk assessment

## MCP Tool Integration

| MCP Tool | Purpose | Trigger |
| -------- | ------- | ------- |

## Execution Flow

```
  thought: "Planning task decomposition strategy. Need to determine: 1) WBS hierarchy structure 2) Task granularity 3) Dependencies 4) Critical path 5) Parallelization opportunities",
  thoughtNumber: 1,
  totalThoughts: 6,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Architecture Component Identification**: Extract all components from architecture.md
2. **WBS Hierarchy Design**: Determine decomposition levels (recommended 3-5 levels)
3. **Task Granularity Verification**: Ensure each task is completable in 1-4 hours
4. **Dependency Graph Construction**: Identify FS/SS/FF dependency types
5. **Critical Path Calculation**: Find task chains with zero total float
6. **Parallelization Opportunity Discovery**: Identify task groups that can run in parallel

### Step 1: Read Input

Read 工具读取 `${run_dir}/architecture.md`
Read 工具读取 `${run_dir}/requirements.md`

Extract:

- Architecture component list
- API endpoints
- Frontend components
- Data models
- Functional requirements

### Step 2: WBS Decomposition

Follow WBS 100% rule for decomposition:

| Rule                 | Description                     |
| -------------------- | ------------------------------- |
| 100% Rule            | WBS must cover all project work |
| Deliverable-oriented | Deliverables as main thread     |
| Level Constraints    | Recommended 3~5 levels          |
| Task Granularity     | Completable in 1-4 hours        |

### Step 3: Dependency Analysis

Build task dependency graph (DAG):

| Dependency Type       | Description           | Example                   |
| --------------------- | --------------------- | ------------------------- |
| FS (Finish-to-Start)  | B starts after A ends | Model → API → Frontend    |
| SS (Start-to-Start)   | A/B start together    | Frontend-backend parallel |
| FF (Finish-to-Finish) | A/B end together      | Integration testing       |

### Step 4: Critical Path Analysis

Identify critical path:

- Calculate earliest start/end time for each task
- Identify task chains with zero total float
- Mark critical tasks

### Step 5: Contract-First Strategy

For fullstack tasks, apply Contract-First strategy:

1. **Define API Interface** (Swagger/TypeScript Types) - as contract
2. **Create Mock Data** - allows frontend to start immediately
3. **Parallel Development**:
   - Backend: Implement real API
   - Frontend: Develop UI using Mock
4. **Integration Testing** - Switch Mock → real API
5. **Visual Regression Testing** - Storybook / screenshot tests

### Step 6: Call External Model for Verification

调用 /codex-cli，参数：prompt=Verify the feasibility of the following task decomposition...

### Step 7: Structured Output

使用 Edit 工具写入 `${run_dir}/tasks.md`:

```markdown
# Task Decomposition

## Metadata

- Decomposition Time: [timestamp]
- Total Tasks: [count]
- Critical Path Length: [duration]
- Parallelism: [max parallel tasks]

## WBS Structure
```

Project Root
├── 1. Infrastructure
│ ├── 1.1 Database Design
│ │ ├── T-001: Create database migration script
│ │ └── T-002: Implement Prisma Schema
│ └── 1.2 Authentication System
│ ├── T-003: Implement JWT utils
│ └── T-004: Create auth middleware
├── 2. Backend Development
│ ├── 2.1 API Endpoints
│ │ ├── T-005: POST /api/auth/login
│ │ └── T-006: POST /api/auth/register
│ └── 2.2 Business Logic
│ ├── T-007: AuthService
│ └── T-008: UserService
└── 3. Frontend Development
├── 3.1 Component Development
│ ├── T-009: LoginForm component
│ └── T-010: RegisterForm component
└── 3.2 Page Integration
└── T-011: Route configuration

````

## Execution Phases

### Phase 1: Infrastructure (No Dependencies)

| ID | Task | Type | Complexity | Est | DoD |
|----|-----|-----|-------|-----|-----|
| T-001 | Create database migration script | backend | 2/5 | - | Migration executable |
| T-002 | Implement Prisma Schema | backend | 2/5 | - | Types generated successfully |
| T-003 | Implement JWT utils | backend | 3/5 | - | Unit tests pass |
| T-004 | Create auth middleware | backend | 3/5 | - | Integration tests pass |

### Phase 2: Backend API (Depends on Phase 1)

| ID | Task | Type | Complexity | Depends | DoD |
|----|-----|-----|-------|-----|-----|
| T-005 | POST /api/auth/login | backend | 3/5 | T-003, T-004 | API tests pass |
| T-006 | POST /api/auth/register | backend | 3/5 | T-001, T-002 | API tests pass |

### Phase 3: Frontend Development (Can Parallel with Phase 2)

| ID | Task | Type | Complexity | Depends | DoD |
|----|-----|-----|-------|-----|-----|
| T-007 | API interface type definitions | frontend | 2/5 | Phase 1 complete | Types correct |
| T-008 | Mock data creation | frontend | 2/5 | T-007 | Mock available |
| T-009 | LoginForm component | frontend | 3/5 | T-008 | Storybook available |
| T-010 | RegisterForm component | frontend | 3/5 | T-008 | Storybook available |

### Phase 4: Integration Testing (Depends on Phase 2, 3)

| ID | Task | Type | Complexity | Depends | DoD |
|----|-----|-----|-------|-----|-----|
| T-011 | Frontend-backend integration | fullstack | 3/5 | T-005, T-006, T-009, T-010 | E2E tests pass |
| T-012 | Route configuration | frontend | 2/5 | T-011 | Navigation works |

## Dependency Graph

```mermaid
graph LR
    T001[T-001: DB Migration] --> T002[T-002: Prisma Schema]
    T002 --> T006[T-006: Register API]
    T003[T-003: JWT Utils] --> T005[T-005: Login API]
    T004[T-004: Auth Middleware] --> T005
    T007[T-007: Types] --> T008[T-008: Mock]
    T008 --> T009[T-009: LoginForm]
    T008 --> T010[T-010: RegisterForm]
    T005 --> T011[T-011: Integration]
    T006 --> T011
    T009 --> T011
    T010 --> T011
    T011 --> T012[T-012: Routes]
````

## Critical Path

```
T-001 → T-002 → T-006 → T-011 → T-012
```

Critical tasks (cannot be delayed): T-001, T-002, T-006, T-011, T-012

## Parallel Execution Recommendations

| Parallel Group | Tasks               | Description             |
| -------------- | ------------------- | ----------------------- |
| Group 1        | T-001, T-003, T-004 | Infrastructure parallel |
| Group 2        | T-005, T-006, T-007 | API + Types parallel    |
| Group 3        | T-009, T-010        | Components parallel     |

## Milestones

| Milestone                | Completion Criteria    | Acceptance Standard        |
| ------------------------ | ---------------------- | -------------------------- |
| M1: Infrastructure Ready | T-001 ~ T-004 complete | DB connectable, auth works |
| M2: API Available        | T-005, T-006 complete  | Swagger docs accessible    |
| M3: Frontend Prototype   | T-009, T-010 complete  | Storybook demo available   |
| M4: Feature Complete     | All tasks complete     | E2E tests pass             |

## Task Card Details

### T-001: Create database migration script

| Field      | Value                            |
| ---------- | -------------------------------- |
| ID         | T-001                            |
| Name       | Create database migration script |
| Type       | backend                          |
| Complexity | 2/5                              |
| Depends    | None                             |

**Input**:

- Data model design

**Output**:

- prisma/migrations/xxx_init.sql

**Acceptance Criteria**:

- [ ] Migration script executable
- [ ] Table structure matches design

---

Next step: Call risk-assessor for risk assessment

```

## Return Value

After execution, return:

```

Task decomposition complete.
Output file: ${run_dir}/tasks.md
Total tasks: X
Execution phases: Y
Critical path: Z tasks

Next step: Use /risk-assessor for risk assessment

```

## Quality Gates

- ✅ Followed WBS 100% rule
- ✅ Each task has clear DoD
- ✅ Dependencies form DAG (no cycles)
- ✅ Identified critical path
- ✅ Task granularity reasonable (1-4 hours)

## Constraints

- Do not do risk assessment (delegated to risk-assessor)
- Do not generate code (delegated to dev phase)
- Tasks must be independently verifiable
- Dependency graph must be directed acyclic graph
```
