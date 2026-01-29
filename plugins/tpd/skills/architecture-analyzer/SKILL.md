---
name: architecture-analyzer
description: |
  [Trigger] Plan workflow Step 4: Integrate multi-model planning results, generate unified architecture document
  [Output] Outputs ${run_dir}/architecture.md (integrating backend + frontend planning)
  [Prerequisite] Must execute codex-planner and/or gemini-planner first
  [Parallel Support] ✅ Read codex-plan.md (backend) + gemini-plan.md (frontend)
allowed-tools:
  - Read
  - Write
  - Skill
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path (passed by orchestrator)
  - name: task_type
    type: string
    required: false
    description: Task type (fullstack|frontend|backend), default fullstack
---

# Architecture Analyzer - Architecture Integration Atomic Skill

## Responsibility Boundary

- **Input**:
  - `${run_dir}/requirements.md`
  - `${run_dir}/context.md`
  - `${run_dir}/codex-plan.md` (backend planning, from codex-planner)
  - `${run_dir}/gemini-plan.md` (frontend planning, from gemini-planner)
- **Output**: `${run_dir}/architecture.md` (integrated unified architecture document)
- **Single Responsibility**: Only do architecture integration, no original analysis

## 🚨🚨🚨 Mandatory Rules 🚨🚨🚨

**This Skill handles integration, original analysis is done by planner skills!**

- ✅ Correct flow: Call codex-planner/gemini-planner first → then call architecture-analyzer
- ❌ Prohibited: Skip planner skills and analyze directly
- ❌ Prohibited: Claude writing architecture analysis instead of planner output

## MCP Tool Integration

| MCP Tool              | Purpose                             | Trigger              |
| --------------------- | ----------------------------------- | -------------------- |
| `sequential-thinking` | Structured architecture integration | 🚨 Required per exec |

## Collaboration Flow

```
plan-context-retriever → codex-planner (backend) ─┐
                                                  ├→ architecture-analyzer → task-decomposer
                       → gemini-planner (frontend) ─┘
```

## Execution Flow

### Step 0: Structured Integration Planning (sequential-thinking)

🚨 **Must first use sequential-thinking to plan integration strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning architecture integration strategy. Need: 1) Verify planner outputs 2) Extract backend architecture 3) Extract frontend architecture 4) Identify cross-cutting concerns 5) Resolve conflicts",
  thoughtNumber: 1,
  totalThoughts: 6,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Prerequisite Verification**: Confirm codex-plan.md and/or gemini-plan.md exist
2. **Backend Architecture Extraction**: API design, data model, security strategy, performance considerations
3. **Frontend Architecture Extraction**: Component architecture, state management, routing design, responsive strategy
4. **Cross-cutting Concerns Identification**: API contracts, authentication flow, data formats, error handling
5. **Conflict Resolution**: If there are divergences, record as ADR
6. **Unified Output**: Generate architecture.md in arc42 format

### Step 1: Verify Prerequisites

Check if planner output files exist:

```bash
# Check required files based on task_type
if [[ "$TASK_TYPE" == "fullstack" || "$TASK_TYPE" == "backend" ]]; then
  if [[ ! -f "${run_dir}/codex-plan.md" ]]; then
    echo "Error: Missing codex-plan.md, please execute tpd:codex-planner first"
    exit 1
  fi
fi

if [[ "$TASK_TYPE" == "fullstack" || "$TASK_TYPE" == "frontend" ]]; then
  if [[ ! -f "${run_dir}/gemini-plan.md" ]]; then
    echo "Error: Missing gemini-plan.md, please execute tpd:gemini-planner first"
    exit 1
  fi
fi
```

### Step 2: Read All Inputs

```bash
REQUIREMENTS=$(cat "${run_dir}/requirements.md")
CONTEXT=$(cat "${run_dir}/context.md")

# Read planner outputs based on task_type
if [[ -f "${run_dir}/codex-plan.md" ]]; then
  CODEX_PLAN=$(cat "${run_dir}/codex-plan.md")
fi

if [[ -f "${run_dir}/gemini-plan.md" ]]; then
  GEMINI_PLAN=$(cat "${run_dir}/gemini-plan.md")
fi
```

### Step 3: Integration Modes

| Task Type | Integration Mode      | Input Source                   |
| --------- | --------------------- | ------------------------------ |
| fullstack | Dual plan integration | codex-plan.md + gemini-plan.md |
| backend   | Backend plan primary  | codex-plan.md                  |
| frontend  | Frontend plan primary | gemini-plan.md                 |

### Step 4: Integrate Analysis Results

Claude is responsible for integrating two planner outputs into unified architecture document:

1. **Extract Backend Architecture** (from codex-plan.md)
   - API Design
   - Data Model
   - Security Strategy
   - Performance Considerations
   - Implementation Path

2. **Extract Frontend Architecture** (from gemini-plan.md)
   - Component Architecture (Atomic Design)
   - State Management
   - Routing Design
   - Responsive Strategy
   - Accessibility Checklist

3. **Identify Cross-cutting Concerns**
   - API Contracts (shared between frontend and backend)
   - Authentication Flow (Token passing)
   - Data Formats (DTO definitions)
   - Error Handling (Error code mapping)

4. **Resolve Conflicts**
   - If two planners have different recommendations, record as ADR

### Step 5: Architecture Decision Records

For key decisions, generate ADR (Architecture Decision Record):

```markdown
### ADR-001: Authentication Solution Selection

**Status**: Decided

**Context**: Need to implement user authentication feature

**Decision**: Use JWT + OAuth2

**Rationale**:

- Industry standard solution
- Supports stateless authentication
- Easy integration with third-party login

**Consequences**:

- Need to implement token refresh mechanism
- Need to securely store secret
```

### Step 6: Structured Output

Write analysis results to `${run_dir}/architecture.md`:

````markdown
# Architecture Design

## Metadata

- Analysis Time: [timestamp]
- Analysis Model: [codex|gemini|both]
- Task Type: [frontend|backend|fullstack]

## Architecture Overview

[One paragraph describing overall architecture solution]

## Backend Architecture (Codex Analysis)

### API Design

| Endpoint           | Method | Description   | Request Body            | Response      |
| ------------------ | ------ | ------------- | ----------------------- | ------------- |
| /api/auth/login    | POST   | User login    | {email, password}       | {token, user} |
| /api/auth/register | POST   | User register | {email, password, name} | {user}        |

### Data Model

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}
```
````

### Business Logic Layer

```
src/
├── services/
│   ├── auth.service.ts      # Auth service
│   ├── user.service.ts      # User service
│   └── token.service.ts     # Token management
├── controllers/
│   └── auth.controller.ts   # Auth controller
└── middleware/
    └── auth.middleware.ts   # Auth middleware
```

### Security Strategy

- JWT verification middleware
- Password bcrypt hashing
- Rate limiting (100 req/min)
- Input validation (Zod schema)

## Frontend Architecture (Gemini Analysis)

### Component Structure

```
src/
├── components/
│   ├── atoms/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Label.tsx
│   ├── molecules/
│   │   ├── FormField.tsx
│   │   └── Alert.tsx
│   └── organisms/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
├── pages/
│   ├── Login.tsx
│   └── Register.tsx
└── contexts/
    └── AuthContext.tsx
```

### State Management

| State Type          | Solution    | Purpose          |
| ------------------- | ----------- | ---------------- |
| Server State        | React Query | API data caching |
| Global Client State | Zustand     | User session     |
| UI State            | useState    | Form, loading    |

### Routing Design

```
/                    → Redirect to /login or /dashboard
/login              → LoginPage
/register           → RegisterPage
/dashboard          → DashboardPage (requires auth)
```

### Styling Solution

- CSS-in-JS: Tailwind CSS
- Design System: Custom theme variables
- Responsive breakpoints: sm(640px), md(768px), lg(1024px)

## Cross-cutting Concerns

### Error Handling

- Unified error format
- Error boundary component
- User-friendly error messages

### Logging & Monitoring

- Structured logging (Winston)
- Request tracing (correlation ID)

### Testing Strategy

- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: Playwright

## Architecture Decision Records

### ADR-001: [Decision Title]

[ADR content]

## Quality Attributes

| Attribute    | Target       | Verification Method |
| ------------ | ------------ | ------------------- |
| Performance  | API < 200ms  | Load testing        |
| Availability | 99.9%        | Health checks       |
| Security     | OWASP Top 10 | Security scanning   |

---

Next step: Call task-decomposer for task decomposition

```

## Return Value

After execution, return:

```

Architecture analysis complete.
Output file: ${run_dir}/architecture.md
Analysis model: [codex|gemini|both]
API endpoints: X
Component count: Y
Architecture decisions: Z

Next step: Use tpd:task-decomposer for task decomposition

```

## Quality Gates

- ✅ Verified planner output files exist
- ✅ Covered key arc42 chapters
- ✅ Integrated frontend and backend architecture
- ✅ Recorded architecture decisions (ADR)
- ✅ Defined quality attribute targets
- ✅ Identified frontend-backend cross-cutting concerns

## Constraints

| Must Do                                  | Prohibited                          |
| ---------------------------------------- | ----------------------------------- |
| ✅ Verify planner output files exist     | ❌ Skip planners and analyze directly |
| ✅ Integrate outputs from both planners  | ❌ Only take one planner's result   |
| ✅ Record conflicts and decisions        | ❌ Ignore frontend-backend conflicts |
| ✅ Output unified architecture.md        | ❌ Output multiple scattered files  |
| ✅ Identify API contracts and cross-cutting | ❌ Frontend-backend completely independent |

## Relationship with Planner Skills

```

┌─────────────────────────────────────────────────────────────┐
│ plan workflow │
├─────────────────────────────────────────────────────────────┤
│ Phase 3a: codex-planner │
│ Input: requirements.md, context.md │
│ Output: codex-plan.md (PLANS.md format) │
│ Content: Backend architecture, API, data model, security │
├─────────────────────────────────────────────────────────────┤
│ Phase 3b: gemini-planner (parallel) │
│ Input: requirements.md, context.md │
│ Output: gemini-plan.md (SPEC.md format) │
│ Content: Frontend architecture, components, state, routing │
├─────────────────────────────────────────────────────────────┤
│ Phase 4: architecture-analyzer │
│ Input: codex-plan.md + gemini-plan.md │
│ Output: architecture.md (unified format) │
│ Responsibility: Integrate, dedupe, resolve conflicts, identify cross-cutting │
└─────────────────────────────────────────────────────────────┘

```

```
