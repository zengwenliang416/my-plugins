---
name: codex-planner
description: |
  [Trigger] Use in plan workflow when backend architecture planning, API design, data model, security strategy analysis is needed
  [Output] Outputs architecture planning document (PLANS.md format) containing technical solution, risk analysis, implementation path
  [Mode] Read-only sandbox + planning mode, prohibited from generating actual code
  [Skip] Frontend UI/component planning (use gemini-planner), simple tasks
allowed-tools:
  - Bash
  - Read
  - Task
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Planning run directory path
  - name: focus
    type: string
    required: false
    description: Planning focus (architecture|api|data|security|performance)
---

# Codex Planner - Multi-Model Collaborative Backend Planning Expert

Backend architecture planning via `codeagent-wrapper` in **plan mode**. Read-only analysis → PLANS.md format → Claude synthesis.

## Core Philosophy

Based on [OpenAI Codex PLANS.md](https://cookbook.openai.com/articles/codex_exec_plans) methodology:

- **Living Documents**: Plans are "living documents", verifiable and iterable
- **Deep Exploration**: Deep exploration of codebase, dependencies, external resources
- **Long-horizon Thinking**: Supports long-term planning for complex tasks (7+ hours)

## MCP Tool Integration

| MCP Tool              | Purpose                                  | Trigger              |
| --------------------- | ---------------------------------------- | -------------------- |
| `sequential-thinking` | Structured backend architecture planning | 🚨 Required per exec |

### Pre-planning Thinking (sequential-thinking)

🚨 **Must first use sequential-thinking to plan analysis strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning backend architecture analysis. Need: 1) Understand requirement scope 2) Explore codebase 3) Design architecture solution 4) Define technical specs 5) Plan implementation path",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Requirement Understanding**: Core functionality boundaries, technical constraints, questions to clarify
2. **Codebase Exploration**: Related modules, existing patterns, dependency analysis
3. **Architecture Solution Design**: Multi-solution comparison, recommended solution, decision rationale
4. **Technical Spec Definition**: API design, data model, security strategy
5. **Implementation Path Planning**: Phase division, task decomposition, critical path

## Execution Command

```bash
# Planning mode call (forced read-only)
~/.claude/bin/codeagent-wrapper codex \
  --workdir "$PROJECT_DIR" \
  --role planner \
  --prompt "$PLANNING_PROMPT" \
  --sandbox read-only
```

## 🚨🚨🚨 Mandatory Planning Flow 🚨🚨🚨

### Step 1: Requirement Understanding and Scope Definition

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role planner \
  --prompt "
Requirement: $REQUIREMENT

Please analyze as a senior architect:
1. Core functionality boundaries
2. Technical constraints and dependencies
3. Potential risk points
4. Questions needing clarification

Output format: PLANS.md Chapter 1
" \
  --sandbox read-only
```

### Step 2: Codebase Exploration

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role analyzer \
  --prompt "
Based on requirement, explore codebase:
1. Related modules and files
2. Existing architecture patterns
3. Data flow
4. Integration points

Tools to use: grep, find, ast-grep
Output: Codebase context summary
" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

### Step 3: Architecture Solution Design

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role architect \
  --prompt "
Based on exploration results, design architecture solution:

## Solution A: [Name]
- Pros:
- Cons:
- Risks:
- Effort:

## Solution B: [Name]
- Pros:
- Cons:
- Risks:
- Effort:

## Recommended Solution
- Choice:
- Rationale:
" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

### Step 4: Detailed Technical Specs

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role architect \
  --prompt "
Generate detailed technical specs for recommended solution:

### API Design
- Endpoint definitions
- Request/Response formats
- Error handling

### Data Model
- Entity relationships
- Migration strategy

### Security Strategy
- Authentication/Authorization
- Input validation
- Sensitive data handling

### Performance Considerations
- Caching strategy
- Database optimization
- Concurrency handling
" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

### Step 5: Implementation Path Planning

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role planner \
  --prompt "
Generate phased implementation plan:

### Phase 1: Infrastructure
- Task list
- Dependencies
- Acceptance criteria

### Phase 2: Core Functionality
- Task list
- Dependencies
- Acceptance criteria

### Phase 3: Integration Testing
- Task list
- Dependencies
- Acceptance criteria

### Critical Path
- Blocker identification
- Parallelization opportunities
" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

## Role Prompts

| Role      | Purpose                    | Command Example    |
| --------- | -------------------------- | ------------------ |
| planner   | Requirement analysis, path | `--role planner`   |
| analyzer  | Codebase exploration       | `--role analyzer`  |
| architect | Architecture design        | `--role architect` |
| security  | Security analysis          | `--role security`  |
| reviewer  | Solution review            | `--role reviewer`  |

## PLANS.md Output Format

```markdown
# [Feature Name] Technical Planning

## Metadata

- Proposal ID: ${proposal_id}
- Created: ${timestamp}
- Planners: Codex + Claude

## 1. Requirement Understanding

### 1.1 Functionality Boundaries

### 1.2 Technical Constraints

### 1.3 Questions to Clarify

## 2. Codebase Context

### 2.1 Related Modules

### 2.2 Existing Patterns

### 2.3 Dependency Analysis

## 3. Architecture Solution

### 3.1 Solution Comparison

### 3.2 Recommended Solution

### 3.3 Decision Rationale

## 4. Technical Specs

### 4.1 API Design

### 4.2 Data Model

### 4.3 Security Strategy

### 4.4 Performance Considerations

## 5. Implementation Path

### 5.1 Phase Division

### 5.2 Task Decomposition

### 5.3 Critical Path

## 6. Risks & Mitigation

### 6.1 Technical Risks

### 6.2 Mitigation Strategies

## 7. Acceptance Criteria

### 7.1 Functional Acceptance

### 7.2 Quality Acceptance
```

## Session Management

```bash
# Save SESSION_ID for multi-step planning
result=$(~/.claude/bin/codeagent-wrapper codex --role planner --prompt "..." --sandbox read-only)
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# Continue session in subsequent steps
~/.claude/bin/codeagent-wrapper codex --prompt "..." --session "$SESSION_ID"
```

## Mandatory Constraints

| Must Do                      | Prohibited                        |
| ---------------------------- | --------------------------------- |
| ✅ Use `--sandbox read-only` | ❌ Generate executable code       |
| ✅ Use `--role planner`      | ❌ Skip codebase exploration      |
| ✅ Output PLANS.md format    | ❌ Give solution without analysis |
| ✅ Multi-solution comparison | ❌ Blindly follow single solution |
| ✅ Save SESSION_ID           | ❌ Lose planning context          |

## Output Files

After execution, write results to:

- `${run_dir}/codex-plan.md` - Codex planning output
- Content will be integrated into `architecture.md` by architecture-analyzer

## Collaboration with Other Skills

```
plan-context-retriever → codex-planner (backend) ─┐
                                                  ├→ architecture-analyzer → task-decomposer
                       → gemini-planner (frontend) ─┘
```

---

SESSION_ID=xxx
