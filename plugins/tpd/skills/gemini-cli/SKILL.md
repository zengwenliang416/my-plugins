---
name: gemini-cli
description: |
  [Trigger] Use when UI component design, CSS styling, responsive layout, or visual prototyping is needed.
  [Output] Outputs React/HTML/CSS code, context limit 32k tokens
  [Skip] Backend logic, database operations, API implementation, complex business logic (use codex-cli)
  [Ask First] No need to ask, automatically determines if Gemini is appropriate based on task type
allowed-tools:
  - Bash
  - Read
  - Task
---

# Gemini CLI - Multi-Model Collaboration Frontend Expert

Frontend design assistant via `codeagent-wrapper`. **UI/CSS/Responsive Layout** → React/HTML prototypes → Claude review & apply. Context limit: **32k tokens**.

## Execution Command

```bash
# Standard invocation
~/.claude/bin/codeagent-wrapper gemini \
  --workdir /path/to/project \
  --role frontend \
  --prompt "Your task"

# Background parallel execution
~/.claude/bin/codeagent-wrapper gemini --prompt "$PROMPT" &
```

## Mandatory Collaboration Process

### Step 1: Design Analysis

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role analyzer \
  --prompt "Requirement: [UI requirement]\nPlease analyze: component structure, styling approach, responsive strategy."
```

- Get Gemini's design suggestions
- Confirm tech stack and style direction

### Step 2: Prototype Generation

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role frontend \
  --prompt "Task: [component task]\nTech stack: [React/Vue/HTML]\nStyle: [Tailwind/CSS]\nOutput component code." \
  --session "$SESSION_ID"
```

- ⚠️ **Prototype is for reference only**
- Must be reviewed and refactored by Claude

### Step 3: Claude Refactoring

1. Review design intent of prototype
2. Optimize naming and structure
3. Ensure compliance with project standards
4. Add necessary types and comments

### Step 4: Review Confirmation

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role reviewer \
  --prompt "I have completed: [component summary]\nPlease review: accessibility/responsiveness/style consistency" \
  --session "$SESSION_ID"
```

## Role Prompts

| Role      | Purpose                   | Command Example    |
| --------- | ------------------------- | ------------------ |
| frontend  | UI/component development  | `--role frontend`  |
| analyzer  | Frontend architecture     | `--role analyzer`  |
| debugger  | Frontend debugging        | `--role debugger`  |
| reviewer  | Frontend code review      | `--role reviewer`  |
| optimizer | Frontend optimization     | `--role optimizer` |
| tester    | Component test generation | `--role tester`    |

## Context Management (32k Limit)

| Strategy        | Method                              |
| --------------- | ----------------------------------- |
| Atomic Design   | One component at a time             |
| Interface First | Pass only interfaces, not full impl |
| Multi-turn      | Layout → Styles → Interactions      |
| Session Reuse   | Use `--session` to maintain context |

## Session Management

```bash
# First call - get SESSION_ID
result=$(~/.claude/bin/codeagent-wrapper gemini --prompt "..." )
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# Subsequent calls - continue session
~/.claude/bin/codeagent-wrapper gemini --prompt "..." --session "$SESSION_ID"
```

## Parallel Execution (Background Mode)

```bash
# Use Task tool's run_in_background=true
# Do not terminate background tasks arbitrarily
```

## Mandatory Constraints

| Must Do                          | Prohibited                      |
| -------------------------------- | ------------------------------- |
| ✅ Save SESSION_ID               | ❌ Use prototype without review |
| ✅ Prototype must be refactored  | ❌ Exceed 32k context           |
| ✅ Use Task tool for background  | ❌ Terminate background tasks   |
| ✅ Specify clear style direction | ❌ Use generic AI aesthetics    |

## Output Format

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "agent_messages": "component code, styles, or analysis"
}
```

---

SESSION_ID=xxx
