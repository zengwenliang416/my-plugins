# Claude Code → Codefree CLI Conversion Rules

## 1. YAML Front Matter

### Agent Files

```yaml
# Claude Code (agents/*.md)
---
name: agent-name
description: "Agent description"
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Codefree CLI (.codefree-cli/agents/*.md)
---
name: agent-name
description: "When to use description.

Use agent when:
- Condition 1
- Condition 2

Do NOT use when:
- Condition 1
- Condition 2"
color: Cyan
---
```

### Skill Files

```yaml
# Claude Code (skills/*/SKILL.md)
---
name: skill-name
description: "Skill description"
allowed-tools:
  - Read
  - Write
  - Bash
context: fork  # REMOVE
model: claude-3-5-sonnet  # REMOVE
arguments:
  - name: arg1
    type: string
    required: true
---

# Codefree CLI (.codefree-cli/skills/*/SKILL.md)
---
name: skill-name
description: "Skill description"
allowed-tools:
  - Read
  - Write
  - Bash
arguments:
  - name: arg1
    type: string
    required: true
---
```

### Fields Mapping

| Field                     | Claude Code | Codefree CLI |
| ------------------------- | ----------- | ------------ |
| `name`                    | ✅ Keep     | ✅ Keep      |
| `description`             | ✅ Keep     | ✅ Keep      |
| `allowed-tools`           | ✅ Keep     | ✅ Keep      |
| `arguments`               | ✅ Keep     | ✅ Keep      |
| `color`                   | ❌ N/A      | ✅ Add       |
| `context`                 | ❌ Remove   | ❌ N/A       |
| `model`                   | ❌ Remove   | ❌ N/A       |
| `disable-model-invocation`| ❌ Remove   | ❌ N/A       |

---

## 2. Task/Agent Calls

### Plugin Prefix Removal

```markdown
<!-- Claude Code -->
Task(
  subagent_type="commit:change-investigator",
  prompt="Execute investigation. run_dir=${RUN_DIR}",
  description="investigate changes"
)

<!-- Codefree CLI -->
Task(
  subagent_type="change-investigator",
  prompt="Execute investigation. run_dir=${RUN_DIR}",
  description="investigate changes"
)
```

### Skill Calls

```markdown
<!-- Claude Code -->
Skill("commit:message-generator", args="run_dir=${RUN_DIR}")

<!-- Codefree CLI -->
Skill("message-generator", args="run_dir=${RUN_DIR}")
```

### Parallel Calls

```markdown
<!-- Both platforms support the same pattern -->
Task(subagent_type="semantic-analyzer", run_in_background=true, ...)
Task(subagent_type="symbol-analyzer", run_in_background=true, ...)
```

---

## 3. Tool References

| Claude Code Tool                      | Codefree CLI     | Notes                    |
| ------------------------------------- | ---------------- | ------------------------ |
| `Read`                                | `Read`           | Direct mapping           |
| `Glob`                                | `Glob`           | Direct mapping           |
| `Grep`                                | `Grep`           | Direct mapping           |
| `Write`                               | `Write`          | Direct mapping           |
| `Edit`                                | `Edit`           | Direct mapping           |
| `Bash`                                | `Bash`           | Direct mapping           |
| `WebSearch`                           | `WebSearch`      | Direct mapping           |
| `WebFetch`                            | `WebFetch`       | Direct mapping           |
| `AskUserQuestion`                     | `AskUserQuestion`| Direct mapping           |
| `Task`                                | `Task`           | Remove plugin prefix     |
| `Skill`                               | `Skill`          | Remove plugin prefix     |
| `mcp__auggie-mcp__codebase-retrieval` | `mcp__*`         | Keep if MCP configured   |
| `LSP`                                 | `LSP`            | Keep if available        |

---

## 4. Agent Color Palette

| Agent Category  | Recommended Color |
| --------------- | ----------------- |
| Investigation   | Cyan              |
| Analysis        | Green             |
| Documentation   | Yellow            |
| Execution       | Magenta           |
| Planning        | Blue              |
| Validation      | Orange            |
| Integration     | Purple            |

---

## 5. Directory Structure

| Claude Code                | Codefree CLI                  |
| -------------------------- | ----------------------------- |
| `agents/`                  | `.codefree-cli/agents/`       |
| `commands/`                | `.codefree-cli/skills/`       |
| `skills/`                  | `.codefree-cli/skills/`       |
| `hooks/`                   | `.codefree-cli/hooks/`        |
| `AGENTS.md`                | `.codefree-cli/rules/`        |
| `CLAUDE.md`                | `.codefree-cli/rules/`        |
| `.claude/committing/runs/` | `.codefree-cli/runs/`         |
| `.claude/developing/runs/` | `.codefree-cli/runs/`         |

---

## 6. Pre-fetched Context

```yaml
# Claude Code - Remove this section
context:
  - type: file
    path: ./references/rules.json
  - type: command
    command: git status

# Codefree CLI - Convert to explicit commands in skill body
```

**Migration strategy:** Convert pre-fetched context to explicit Read/Bash commands in the skill execution flow.

---

## 7. Hooks Migration

### Supported Hooks

```bash
# Shell script hooks can be migrated directly
hooks/
├── scripts/
│   ├── pre-commit.sh
│   └── post-commit.sh
└── hook.json
```

### Hook Configuration

```json
// Claude Code hook.json
{
  "hooks": [
    {
      "matcher": "Tool == 'Bash'",
      "script": "./scripts/pre-commit.sh"
    }
  ]
}

// Codefree CLI - Same format
{
  "hooks": [
    {
      "matcher": "Tool == 'Bash'",
      "script": "./scripts/pre-commit.sh"
    }
  ]
}
```

---

## 8. Naming Conventions

| Claude Code Pattern        | Codefree CLI Pattern |
| -------------------------- | -------------------- |
| `commit:change-investigator` | `change-investigator` |
| `tpd:codex-cli`            | `codex-cli`          |
| `Skill("commit:xxx")`      | `Skill("xxx")`       |
| `Task(subagent_type="plugin:xxx")` | `Task(subagent_type="xxx")` |

**Rule:** Remove plugin prefix from all agent and skill references.

---

## 9. Agent Description Format

```markdown
# Claude Code - Simple description
description: "Semantic analysis of code changes"

# Codefree CLI - Structured description with usage guidance
description: "Semantic analysis agent for code changes.

Use agent when:
- Need semantic understanding of code modifications
- Analyzing code impact beyond syntax

Do NOT use when:
- Need symbol-level analysis (use symbol-analyzer)
- Need quick syntax checks only"
```

---

## 10. Unsupported Features

### Features to Remove

| Feature               | Migration Strategy              |
| --------------------- | ------------------------------- |
| `context: fork`       | Remove, use explicit commands   |
| `model: xxx`          | Remove, use default model       |
| `disable-model-invocation` | Remove                     |

### Features to Keep

| Feature               | Notes                           |
| --------------------- | ------------------------------- |
| `allowed-tools`       | Fully supported                 |
| `arguments`           | Fully supported                 |
| `AskUserQuestion`     | Fully supported                 |
| `Task/Skill`          | Supported (remove plugin prefix)|
| Hooks                 | Supported (shell scripts)       |
| MCP Tools             | Supported if configured         |
