---
name: gemini-cli
description: |
  [Trigger] When refactor workflow needs frontend component refactoring, CSS optimization, or UI restructuring.
  [Output] Refactored React/Vue/HTML/CSS code; context limit is 32k tokens.
  [Skip] For backend logic, API, or database refactoring (use codex-cli instead).
  [Ask] No user input needed; invoked by other skills.
  [Resource Usage] Use references/, assets/, and scripts/ (`scripts/invoke-gemini.ts`).
allowed-tools:
  - Bash
  - Read
  - Task
---

# Gemini CLI - Refactor Frontend Expert

Frontend refactoring expert via `scripts/invoke-gemini.ts`. **UI/component/style refactoring** -> React/Vue/CSS prototype -> Claude review & apply. Context limit: **32k tokens**.

## Script Entry

```bash
npx tsx scripts/invoke-gemini.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"]
```

## Resource Usage

- Role prompts: `references/roles/{role}.md`
- Execution script: `scripts/invoke-gemini.ts`

## Roles

| Role                   | Purpose                      | CLI Flag                        |
| ---------------------- | ---------------------------- | ------------------------------- |
| component-analyst      | Component structure analysis | `--role component-analyst`      |
| frontend-refactor      | Frontend refactoring plan    | `--role frontend-refactor`      |
| style-optimizer        | CSS/style optimization       | `--role style-optimizer`        |
| accessibility-reviewer | Accessibility audit          | `--role accessibility-reviewer` |

---

## Prompt Templates

### Scenario 1: Component Smell Detection

```bash
npx tsx scripts/invoke-gemini.ts \
  --role component-analyst \
  --prompt "
## Task
Analyze the following frontend components for code smells.

## Target Files
${component_files}

## Detection Dimensions
1. God Component (>300 lines or >5 responsibilities)
2. Prop Drilling (props passed through >3 levels)
3. CSS Bloat (redundant/duplicate styles)
4. Missing Memoization (unnecessary re-renders)
5. Accessibility Issues (missing ARIA/semantics)
6. Responsiveness Issues (non-responsive layout)
7. State Management Smell (excessive local state)
8. Component Coupling (tight inter-component coupling)

## Output Format
JSON array, each smell contains:
- type: smell type
- severity: critical/high/medium/low
- location: {file, line, component}
- suggestion: improvement recommendation
"
```

### Scenario 2: Extract Component

```bash
npx tsx scripts/invoke-gemini.ts \
  --role frontend-refactor \
  --prompt "
## Task
Perform Extract Component refactoring.

## Target
- File: ${target_file}
- Component: ${target_component}
- Section to extract: ${extract_description}

## Requirements
1. Create an independent child component
2. Define clear Props interface
3. Maintain style isolation
4. Ensure correct state management

## Tech Stack
${tech_stack} (React/Vue/Svelte)

## Output Format
New component code + parent component modifications
"
```

### Scenario 3: CSS Optimization

```bash
npx tsx scripts/invoke-gemini.ts \
  --role style-optimizer \
  --prompt "
## Task
Optimize CSS/style code.

## Target Files
${style_files}

## Optimization Dimensions
1. Eliminate duplicate styles
2. Extract shared variables
3. Optimize selector performance
4. Improve responsive breakpoints
5. Unify naming conventions

## Tech Stack
${css_framework} (Tailwind/CSS Modules/Styled Components)

## Output Format
Optimized style code + change description
"
```

### Scenario 4: Responsive Refactoring

```bash
npx tsx scripts/invoke-gemini.ts \
  --role frontend-refactor \
  --prompt "
## Task
Refactor to responsive design.

## Target Component
${target_component}

## Breakpoint Requirements
- Mobile: <768px
- Tablet: 768px-1024px
- Desktop: >1024px

## Requirements
1. Mobile-first design
2. Maintain semantic structure
3. Optimize touch interactions
4. Handle responsive images

## Output Format
Responsive component code + style modifications
"
```

### Scenario 5: Accessibility Refactoring

```bash
npx tsx scripts/invoke-gemini.ts \
  --role accessibility-reviewer \
  --prompt "
## Task
Improve component accessibility.

## Target Component
${target_component}

## Audit Dimensions
1. ARIA attribute completeness
2. Keyboard navigation support
3. Color contrast ratios
4. Screen reader compatibility
5. Focus management

## Output Format
JSON:
{
  \"issues\": [...],
  \"fixes\": [...],
  \"code_changes\": \"modified code\"
}
"
```

### Scenario 6: State Management Refactoring

```bash
npx tsx scripts/invoke-gemini.ts \
  --role frontend-refactor \
  --prompt "
## Task
Refactor component state management.

## Target Component
${target_component}

## Current Issues
${state_issues}

## Requirements
1. Lift state to appropriate level
2. Use Context/Redux/Zustand as needed
3. Optimize re-renders
4. Add memoization

## Output Format
Refactored component code
"
```

---

## MUST: Collaboration Workflow

### Step 1: Gemini Analyze/Generate

```bash
npx tsx scripts/invoke-gemini.ts \
  --role frontend-refactor \
  --prompt "$REFACTOR_PROMPT"
```

### Step 2: Claude Review

1. Review component code returned by Gemini
2. Verify style consistency
3. Check accessibility
4. Optimize naming and structure

### Step 3: Apply Changes

Use the Edit tool to apply reviewed modifications.

### Step 4: Verify

```bash
npx tsx scripts/invoke-gemini.ts \
  --role accessibility-reviewer \
  --prompt "Verify refactoring results: [component summary]"
```

---

## Context Management (32k limit)

| Strategy        | Method                                    |
| --------------- | ----------------------------------------- |
| Atomic Design   | Refactor one component at a time          |
| Interface First | Pass only interfaces, not full code       |
| Multi-turn      | Structure -> Styles -> Interaction phases |

---

## MUST: Constraints

| Required                               | Forbidden                               |
| -------------------------------------- | --------------------------------------- |
| Prototype MUST be reviewed by Claude   | Apply Gemini output without review      |
| Use Task tool for background execution | Terminate background tasks arbitrarily  |
| Verify accessibility after refactoring | Ignore responsive requirements          |
| Maintain style consistency             | Introduce incompatible style frameworks |
| Stay within 32k context limit          | Send entire codebase in single prompt   |
