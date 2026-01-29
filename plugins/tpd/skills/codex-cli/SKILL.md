---
name: codex-cli
description: |
  [Trigger] Use when backend logic analysis, cross-file modifications, debugging, security/performance review, or a second opinion is needed.
  [Output] Read-only sandbox code analysis → outputs unified diff patch → Claude reviews and refactors before applying
  [Skip] Frontend UI/CSS (use gemini-cli), simple single-file fixes, questions not requiring codebase reading
  [Ask First] No need to ask, automatically determines if Codex is appropriate based on task type
allowed-tools:
  - Bash
  - Read
  - Task
---

# Codex CLI - Multi-Model Collaboration Backend Expert

Backend coding assistant via `codeagent-wrapper`. **Read-only sandbox** → unified diff patches → Claude review & apply.

## Execution Command

```bash
# Standard invocation
~/.claude/bin/codeagent-wrapper codex \
  --workdir /path/to/project \
  --role analyzer \
  --prompt "Your task" \
  --sandbox read-only

# Background parallel execution
~/.claude/bin/codeagent-wrapper codex --prompt "$PROMPT" --sandbox read-only &
```

## Mandatory 4-Step Collaboration Process

### Step 1: Requirements Analysis Collaboration

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role analyzer \
  --prompt "User requirement: [requirement]\nMy initial analysis: [approach]\nPlease refine the requirements analysis, identify risks, and provide an implementation plan." \
  --sandbox read-only
```

- Compare Codex analysis with your approach
- Identify differences and blind spots

### Step 2: Code Prototype Request (Mandatory Read-Only)

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role architect \
  --prompt "Task: [coding task]\nRequirements: Only analyze and design, output unified diff patch, explain design rationale." \
  --sandbox read-only \
  --session "$SESSION_ID"
```

- ⚠️ **Never use prototype directly**
- Prototype is for logic reference only, must be rewritten

### Step 3: Critical Rewrite (Claude Executes)

1. Understand core logic and design intent of prototype
2. Identify improvement points (naming/structure/error handling)
3. Rewrite code according to project standards
4. Ensure compliance with SOLID/DRY/KISS

### Step 4: Code Review Confirmation

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role reviewer \
  --prompt "I have completed modifications: [summary]\nOriginal requirement: [requirement]\nPlease review: quality/completeness/potential bugs/improvement suggestions" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

## Role Prompts

| Role      | Purpose                    | Command Example    |
| --------- | -------------------------- | ------------------ |
| analyzer  | Code/requirements analysis | `--role analyzer`  |
| architect | API/backend architecture   | `--role architect` |
| debugger  | Problem debugging          | `--role debugger`  |
| reviewer  | Code review                | `--role reviewer`  |
| optimizer | Performance optimization   | `--role optimizer` |
| tester    | Test generation            | `--role tester`    |

## Session Management

```bash
# First call - get SESSION_ID
result=$(~/.claude/bin/codeagent-wrapper codex --prompt "..." --sandbox read-only)
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# Subsequent calls - continue session
~/.claude/bin/codeagent-wrapper codex --prompt "..." --session "$SESSION_ID"
```

## Parallel Execution (Background Mode)

```bash
# Use Task tool's run_in_background=true
# Do not terminate background tasks arbitrarily
```

## Mandatory Constraints

| Must Do                         | Prohibited                             |
| ------------------------------- | -------------------------------------- |
| ✅ Use `--sandbox read-only`    | ❌ Use prototype without rewriting     |
| ✅ Save SESSION_ID              | ❌ Skip review step                    |
| ✅ Prototype must be refactored | ❌ Use `--yolo` or write sandbox       |
| ✅ Use Task tool for background | ❌ Terminate background tasks randomly |
| ✅ Question Codex suggestions   | ❌ Blindly follow Codex output         |

## Output Format

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "agent_messages": "analysis or unified diff patch"
}
```

---

SESSION_ID=xxx
