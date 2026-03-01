---
name: migrate-to-codefree
description: |
  Migrate Claude Code workflow configurations to Codefree CLI format automatically.
  Converts agents, skills, commands, and rules to Codefree compatible structure.
allowed-tools:
  - Glob
  - Grep
  - Read
  - Write
  - Bash
  - AskUserQuestion
arguments:
  - name: source_path
    type: string
    required: false
    description: Source project path (defaults to current directory)
  - name: target_path
    type: string
    required: false
    description: Target .codefree-cli directory path (defaults to ${source_path}/.codefree-cli)
---

# /migrate-to-codefree

Migrates Claude Code project configurations (agents, skills, commands, rules) to Codefree CLI format.

## When to Use

- When you have a Claude Code project with workflow configurations
- When you want to use the same workflows in Codefree CLI
- When migrating plugins to support both platforms

## Pre-requisites

Source project should have one or more of:

- `agents/*.md` - Agent definitions
- `commands/*.md` - Command workflows
- `skills/*/SKILL.md` - Skills
- `AGENTS.md` or `AGENTS.example.md` - Agent rules
- `CLAUDE.md` or `CLAUDE.example.md` - Project rules

---

## Execution Flow

```
Phase 1: Analyze Source Structure
         ↓
Phase 2: Create Target Directory
         ↓
Phase 3: Convert Agents (agents/ → .codefree-cli/agents/)
         ↓
Phase 4: Convert Skills (commands + skills → .codefree-cli/skills/)
         ↓
Phase 5: Convert Rules (AGENTS.md + CLAUDE.md → .codefree-cli/rules/)
         ↓
Phase 6: Generate MIGRATION.md
         ↓
Phase 7: Summary & Verification
```

---

## Phase Details

### Phase 1: Analyze Source Structure

Scan the source project to identify Claude Code components:

```bash
# Check for components
ls -la ${source_path}/agents/ 2>/dev/null
ls -la ${source_path}/commands/ 2>/dev/null
ls -la ${source_path}/skills/ 2>/dev/null
ls -la ${source_path}/AGENTS.md ${source_path}/AGENTS.example.md 2>/dev/null
ls -la ${source_path}/CLAUDE.md ${source_path}/CLAUDE.example.md 2>/dev/null
ls -la ${source_path}/hooks/ 2>/dev/null
```

Present findings to user:

```markdown
## Claude Code Components Found

| Component         | Count     | Status                          |
| ----------------- | --------- | ------------------------------- |
| Agents            | ${count}  | Will convert to agents/*.md     |
| Commands          | ${count}  | Will convert to Skills          |
| Skills            | ${count}  | Will convert format             |
| Rules (AGENTS.md) | ${exists} | Will split into rules/          |
| Rules (CLAUDE.md) | ${exists} | Will split into rules/          |
| Hooks             | ${count}  | Will migrate (if shell scripts) |

Proceed with migration?
```

**Ask user:**

- (a) Yes, migrate all
- (b) Select specific components
- (c) Cancel

**Output:** Component inventory

---

### Phase 2: Create Target Directory

```bash
mkdir -p ${target_path}/agents
mkdir -p ${target_path}/skills
mkdir -p ${target_path}/rules
mkdir -p ${target_path}/hooks/scripts
```

**Output:** Empty `.codefree-cli/` directory structure

---

### Phase 3: Convert Agents

For each agent in `agents/*.md`:

1. **Read source file**
2. **Transform to Codefree format:**
   - Keep YAML front matter: `name`, `description`, `color`
   - Keep system prompt content
   - Remove Claude Code specific fields
3. **Write to `.codefree-cli/agents/{name}.md`**

**Agent File Format:**

```markdown
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

You are `agent-name`, [role description].

## Execution Protocol

1. Step 1
2. Step 2
...

## Key Practices

- Practice 1
- Practice 2
...

## Output Format

[Output format specification]
```

**Color Palette:**

| Agent Type      | Color   |
| --------------- | ------- |
| Investigation   | Cyan    |
| Analysis        | Green   |
| Documentation   | Yellow  |
| Execution       | Magenta |
| Planning        | Blue    |

**Output:** Converted agents in `.codefree-cli/agents/`

---

### Phase 4: Convert Skills

For each skill in `skills/*/SKILL.md` and `commands/*.md`:

1. **Read source file**
2. **Transform YAML front matter:**
   - Keep: `name`, `description`
   - Keep: `allowed-tools` (Codefree supports this)
   - Keep: `arguments` (Codefree supports this)
   - Remove: `context`, `model`, `disable-model-invocation`
3. **Transform content:**
   - Replace `Task(subagent_type="plugin:xxx")` → `Task(subagent_type="xxx")`
   - Keep `AskUserQuestion` format (Codefree supports this)
   - Keep tool references (Codefree uses same tools)
4. **Write to `.codefree-cli/skills/{name}/SKILL.md`**
5. **Copy references/ directory if exists**

**Transformation Rules:**

| Source Pattern                       | Target Pattern                              |
| ------------------------------------ | ------------------------------------------- |
| `context: fork`                      | (remove)                                    |
| `model: xxx`                         | (remove)                                    |
| `disable-model-invocation: true`     | (remove)                                    |
| `Task(subagent_type="plugin:xxx")`   | `Task(subagent_type="xxx")`                 |
| `Skill("plugin:xxx")`                | `Skill("xxx")`                              |
| `mcp__auggie-mcp__codebase-retrieval`| Keep (if MCP available) or degrade to Grep  |

**Output:** Converted skills in `.codefree-cli/skills/`

---

### Phase 5: Convert Rules

Extract rules from `AGENTS.md`, `AGENTS.example.md`, `CLAUDE.md`, `CLAUDE.example.md`:

1. **Identify rule categories:**
   - Documentation rules (llmdoc-first)
   - Language settings
   - Tool usage preferences
   - Interaction patterns

2. **Create rule files:**
   - `.codefree-cli/rules/README.md` - Index of all rules
   - `.codefree-cli/rules/documentation.md` - Documentation-first principle
   - `.codefree-cli/rules/language.md` - Language settings
   - `.codefree-cli/rules/tool-preferences.md` - Tool usage
   - `.codefree-cli/rules/interaction.md` - Interaction patterns

**Rule Extraction Patterns:**

| Source Pattern           | Target File           |
| ------------------------ | --------------------- |
| `llmdoc` related         | `documentation.md`    |
| `Always answer in 中文`  | `language.md`         |
| `<tool-usage-extension>` | `tool-preferences.md` |
| `<optional-coding>`      | `interaction.md`      |

**Output:** Rule files in `.codefree-cli/rules/`

---

### Phase 6: Generate MIGRATION.md

Create `.codefree-cli/MIGRATION.md` with:

1. **Overview table** - Component mapping summary
2. **Agents list** - All converted agents with files
3. **Skills list** - All converted skills with descriptions
4. **Rules list** - All rule files
5. **Conversion rules** - Reference for manual adjustments
6. **Feature comparison** - Supported vs unsupported features
7. **Rollback strategy** - How to revert if needed

**Template:**

```markdown
# ${project_name} → Codefree CLI Migration Guide

## Overview

| Claude Code | Codefree CLI              | Count    |
| ----------- | ------------------------- | -------- |
| Agents      | .codefree-cli/agents/*.md | ${count} |
| Commands    | .codefree-cli/skills/     | ${count} |
| Skills      | .codefree-cli/skills/     | ${count} |
| Rules       | .codefree-cli/rules/      | ${count} |
| Hooks       | .codefree-cli/hooks/      | ${count} |

---

## 1. Agents

| File | Name | Description |
| ---- | ---- | ----------- |
| ...  | ...  | ...         |

## 2. Skills

| Directory | Name | Description |
| --------- | ---- | ----------- |
| ...       | ...  | ...         |

## 3. Rules

| File | Category | Description |
| ---- | -------- | ----------- |
| ...  | ...      | ...         |

## 4. Conversion Rules Applied

...

## 5. Manual Steps Required

...

## 6. Rollback Strategy

...
```

**Output:** `.codefree-cli/MIGRATION.md`

---

### Phase 7: Summary & Verification

Present migration summary:

```markdown
## Migration Complete

### Files Created

- `.codefree-cli/agents/` - ${count} agent files
- `.codefree-cli/skills/` - ${count} skill directories
- `.codefree-cli/rules/` - ${count} rule files
- `.codefree-cli/MIGRATION.md` - Migration documentation

### Feature Mapping

| Feature              | Support | Notes                    |
| -------------------- | ------- | ------------------------ |
| Agents               | ✅      | Direct file mapping      |
| Skills               | ✅      | Same format              |
| allowed-tools        | ✅      | Supported                |
| arguments            | ✅      | Supported                |
| Hooks                | ✅      | Shell scripts supported  |
| MCP Tools            | ⚠️      | Depends on configuration |
| Pre-fetched context  | ❌      | Remove, use explicit     |

### Verification Checklist

- [ ] All agents converted correctly
- [ ] All skills load without errors
- [ ] Rule files are readable
- [ ] Test agent invocations
```

**Output:** Migration summary

---

## Tool Mapping Reference

| Claude Code             | Codefree CLI    | Notes                      |
| ----------------------- | --------------- | -------------------------- |
| Read                    | Read            | Direct mapping             |
| Glob                    | Glob            | Direct mapping             |
| Grep                    | Grep            | Direct mapping             |
| Write                   | Write           | Direct mapping             |
| Edit                    | Edit            | Direct mapping             |
| Bash                    | Bash            | Direct mapping             |
| WebSearch               | WebSearch       | Direct mapping             |
| WebFetch                | WebFetch        | Direct mapping             |
| AskUserQuestion         | AskUserQuestion | Direct mapping             |
| Task(subagent_type=...) | Task(...)       | Remove plugin prefix       |
| Skill(...)              | Skill(...)      | Remove plugin prefix       |
| mcp__*                  | mcp__*          | Keep if MCP configured     |
| LSP                     | LSP             | Keep if available          |

---

## Quality Gates

### Pre-execution

- [ ] Source project has Claude Code components
- [ ] No existing `.codefree-cli/` directory (or user confirms overwrite)

### Post-execution

- [ ] All agents converted with correct YAML front matter
- [ ] All skills converted and syntactically valid
- [ ] Rule files cover all extracted rules
- [ ] MIGRATION.md is comprehensive
- [ ] No source files modified

---

## Anti-Patterns

**DO:**

- Preserve original files (non-destructive migration)
- Keep tool references that Codefree supports
- Generate comprehensive documentation
- Flag unsupported features clearly

**DO NOT:**

- Modify source Claude Code files
- Skip validation of converted files
- Remove supported features unnecessarily
- Assume all MCP tools are unavailable

---

## Return Format

```
✅ Migration complete
📁 Agents: ${n} | Skills: ${n} | Rules: ${n}
📋 See .codefree-cli/MIGRATION.md for details
```
