---
name: gemini-planner
description: |
  [Trigger] Use in plan workflow when frontend architecture planning, component design, UI/UX strategy, design system analysis is needed
  [Output] Outputs frontend planning document (Conductor format) containing component hierarchy, state management, routing design
  [Mode] Read-only mode, prohibited from generating actual code
  [Skip] Backend API/database planning (use codex-planner), simple tasks
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
    description: Planning focus (components|state|routing|design-system|responsive)
---

# Gemini Planner - Multi-Model Collaborative Frontend Planning Expert

Frontend architecture planning via `codeagent-wrapper` in **plan mode**. Read-only analysis → Conductor format → Claude synthesis.

## Core Philosophy

Based on [Gemini CLI Conductor](https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/) methodology:

- **Context-Driven Development**: Context-driven planning
- **Formal Specs**: Formal specification documents, persisted in Markdown
- **Human in the Loop**: Human developers always control decisions

## MCP Tool Integration

| MCP Tool              | Purpose                                   | Trigger              |
| --------------------- | ----------------------------------------- | -------------------- |
| `sequential-thinking` | Structured frontend architecture planning | 🚨 Required per exec |

### Pre-planning Thinking (sequential-thinking)

🚨 **Must first use sequential-thinking to plan analysis strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning frontend architecture analysis. Need: 1) User journey analysis 2) Design system check 3) Component architecture design 4) State management planning 5) Routing design",
  thoughtNumber: 1,
  totalThoughts: 6,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **User Journey Analysis**: Interaction flow, UI/UX constraints
2. **Design System Check**: Existing components, design tokens, style guide
3. **Component Architecture Design**: Atomic Design hierarchy, component interaction diagram
4. **State Management Planning**: Server State / Client State / URL State
5. **Routing Design**: Route hierarchy, navigation flow, code splitting
6. **Responsive Strategy**: Breakpoints, layout adaptation, accessibility

## Execution Command

```bash
# Planning mode call (read-only)
~/.claude/bin/codeagent-wrapper gemini \
  --workdir "$PROJECT_DIR" \
  --role planner \
  --prompt "$PLANNING_PROMPT"
```

## 🚨🚨🚨 Mandatory Planning Flow 🚨🚨🚨

### Step 1: Requirement Understanding and User Journey

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role planner \
  --prompt "
Requirement: $REQUIREMENT

Please analyze as a senior frontend architect:
1. User journey and interaction flow
2. Core pages and component requirements
3. UI/UX constraints and expectations
4. Responsive and accessibility requirements

Output format: Conductor SPEC.md Chapter 1
"
```

### Step 2: Design System Analysis

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role analyzer \
  --prompt "
Analyze existing design system and component library:
1. Reusable existing components
2. Design tokens (colors, fonts, spacing)
3. Component library selection (if any)
4. Style consistency check

Output: Design system context summary
" \
  --session "$SESSION_ID"
```

### Step 3: Component Architecture Design

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role architect \
  --prompt "
Based on analysis results, design component architecture:

## Component Hierarchy (Atomic Design)
### Atoms
### Molecules
### Organisms
### Templates
### Pages

## Component Interaction Diagram
- Parent-child relationships
- Event flow
- State sharing

## Reuse Strategy
- Existing component reuse
- New component list
- Abstraction level recommendations
" \
  --session "$SESSION_ID"
```

### Step 4: State Management Planning

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role architect \
  --prompt "
Design state management solution:

### Server State
- Data fetching strategy (React Query / SWR)
- Caching strategy
- Optimistic updates

### Client State
- Global state (Context / Zustand / Redux)
- Local state
- URL state (filters, pagination)

### State Flow Diagram
- Data sources
- State changes
- Side effect handling
" \
  --session "$SESSION_ID"
```

### Step 5: Routing and Navigation Design

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role architect \
  --prompt "
Design routing and navigation structure:

### Route Hierarchy
- Public routes
- Protected routes
- Nested layouts

### Navigation Flow
- Main navigation
- Breadcrumbs
- Deep link support

### Code Splitting
- Route-level lazy loading
- Preloading strategy

### Route Guards
- Authentication checks
- Permission verification
- Redirect logic
" \
  --session "$SESSION_ID"
```

### Step 6: Responsive and Accessibility Strategy

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role planner \
  --prompt "
Design responsive and accessibility strategy:

### Responsive Breakpoints
- Mobile (<768px)
- Tablet (768-1024px)
- Desktop (>1024px)

### Layout Adaptation
- Flex layout strategy
- Component responsive behavior

### Accessibility (a11y)
- WCAG level target
- Keyboard navigation
- Screen reader support
- Color contrast

### Performance Budget
- First load target
- Interaction response target
" \
  --session "$SESSION_ID"
```

## Role Prompts

| Role      | Purpose                  | Command Example    |
| --------- | ------------------------ | ------------------ |
| planner   | Requirement analysis, UX | `--role planner`   |
| analyzer  | Design system analysis   | `--role analyzer`  |
| architect | Component/state design   | `--role architect` |
| designer  | UI detail design         | `--role designer`  |
| reviewer  | Solution review          | `--role reviewer`  |

## Conductor SPEC.md Output Format

```markdown
# [Feature Name] Frontend Planning

## Metadata

- Proposal ID: ${proposal_id}
- Created: ${timestamp}
- Planners: Gemini + Claude

## 1. Requirement Understanding

### 1.1 User Journey

### 1.2 Interaction Flow

### 1.3 UI/UX Constraints

## 2. Design System Context

### 2.1 Existing Components

### 2.2 Design Tokens

### 2.3 Style Guide

## 3. Component Architecture

### 3.1 Component Hierarchy (Atomic Design)

### 3.2 Component Interaction Diagram

### 3.3 Reuse Strategy

## 4. State Management

### 4.1 Server State

### 4.2 Client State

### 4.3 State Flow Diagram

## 5. Routing Design

### 5.1 Route Hierarchy

### 5.2 Navigation Flow

### 5.3 Code Splitting Strategy

## 6. Responsive and Accessibility

### 6.1 Breakpoint Strategy

### 6.2 Layout Adaptation

### 6.3 Accessibility Checklist

## 7. Implementation Path

### 7.1 Component Development Order

### 7.2 Dependencies

### 7.3 Milestones

## 8. Acceptance Criteria

### 8.1 Functional Acceptance

### 8.2 Visual Acceptance

### 8.3 Performance Acceptance
```

## Context Management (32k Limit)

| Strategy        | Method                                   |
| --------------- | ---------------------------------------- |
| Atomic Design   | One component layer at a time            |
| Interface First | Pass only component interface, not impl  |
| Multi-turn      | Component → State → Routing step-by-step |
| Session Reuse   | Use `--session` to maintain context      |

## Session Management

```bash
# Save SESSION_ID for multi-step planning
result=$(~/.claude/bin/codeagent-wrapper gemini --role planner --prompt "...")
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# Continue session in subsequent steps
~/.claude/bin/codeagent-wrapper gemini --prompt "..." --session "$SESSION_ID"
```

## Mandatory Constraints

| Must Do                       | Prohibited                     |
| ----------------------------- | ------------------------------ |
| ✅ Use `--role planner`       | ❌ Generate executable code    |
| ✅ Output SPEC.md format      | ❌ Skip design system analysis |
| ✅ Consider responsive & a11y | ❌ Consider desktop only       |
| ✅ Clear component hierarchy  | ❌ Flat component structure    |
| ✅ Save SESSION_ID            | ❌ Lose planning context       |
| ✅ Respect 32k context limit  | ❌ Pass too much info at once  |

## Output Files

After execution, write results to:

- `${run_dir}/gemini-plan.md` - Gemini planning output
- Content will be integrated into `architecture.md` by architecture-analyzer

## Collaboration with Other Skills

```
plan-context-retriever → codex-planner (backend) ─┐
                                                  ├→ architecture-analyzer → task-decomposer
                       → gemini-planner (frontend) ─┘
```

## Division of Labor with codex-planner

| Dimension | codex-planner             | gemini-planner         |
| --------- | ------------------------- | ---------------------- |
| Focus     | Backend architecture, API | Frontend architecture  |
| Output    | PLANS.md                  | SPEC.md (Conductor)    |
| Deep Dive | Codebase deps, security   | Design system, UX flow |
| Scenarios | Auth, database, perf      | UI components, forms   |

---

SESSION_ID=xxx
