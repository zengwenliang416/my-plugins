---
name: migrate-to-trae
description: |
  Migrate Claude Code workflow configurations to Trae format automatically.
  Converts agents, skills, commands, and rules to Trae IDE compatible structure.
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
    description: Target .trae directory path (defaults to ${source_path}/.trae)
---

# /migrate-to-trae

Migrates Claude Code project configurations (agents, skills, commands, rules) to Trae IDE format.

## When to Use

- When you have a Claude Code project with workflow configurations
- When you want to use the same workflows in Trae IDE
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
Phase 3: Convert Skills (commands + skills → .trae/skills/)
         ↓
Phase 4: Convert Agents (agents/ → .trae/agents/ + UI config)
         ↓
Phase 5: Convert Rules (AGENTS.md + CLAUDE.md → .trae/rules/)
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

| Component         | Count     | Status                    |
| ----------------- | --------- | ------------------------- |
| Agents            | ${count}  | Will migrate to UI config |
| Commands          | ${count}  | Will convert to Skills    |
| Skills            | ${count}  | Will convert format       |
| Rules (AGENTS.md) | ${exists} | Will split into rules/    |
| Rules (CLAUDE.md) | ${exists} | Will split into rules/    |
| Hooks             | ${count}  | ❌ Not supported in Trae  |

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
mkdir -p ${target_path}/skills
mkdir -p ${target_path}/agents
mkdir -p ${target_path}/rules
```

**Output:** Empty `.trae/` directory structure

---

### Phase 3: Convert Skills

For each skill in `skills/*/SKILL.md` and `commands/*.md`:

1. **Read source file**
2. **Transform YAML front matter:**
   - Keep: `name`, `description`
   - Remove: `allowed-tools`, `context`, `model`, `disable-model-invocation`, `arguments`
3. **Transform content:**
   - Replace `Task(subagent_type="xxx")` → `调用 @xxx，参数：`
   - Replace `AskUserQuestion({...})` → Direct question format with (a), (b), (c) options
   - Replace tool references: Glob/Grep → Read, Bash → Terminal
   - Remove Pre-fetched context sections (convert to manual commands)
4. **Write to `.trae/skills/{name}/SKILL.md`**
5. **Copy references/ directory if exists**

**Transformation Rules:**

| Source Pattern                         | Target Pattern                       |
| -------------------------------------- | ------------------------------------ |
| `allowed-tools: [...]`                 | (remove)                             |
| `context: fork`                        | (remove)                             |
| `model: xxx`                           | (remove)                             |
| `arguments: [...]`                     | (remove or simplify)                 |
| `!command` (pre-fetch)                 | Convert to explicit Terminal command |
| `Task(subagent_type="xxx:yyy", ...)`   | `调用 @yyy，参数：...`               |
| `Skill("xxx:yyy", ...)`                | `调用 /yyy，参数：...`               |
| `AskUserQuestion({question, options})` | Question with (a)/(b)/(c) format     |
| `run_in_background=true`               | `并行调用以下智能体：`               |

**Output:** Converted skills in `.trae/skills/`

---

### Phase 4: Convert Agents

For each agent in `agents/*.md`:

1. **Read source file**
2. **Extract agent configuration:**
   - Name (Chinese + English identifier)
   - Description
   - Tool permissions (from allowed-tools)
3. **Generate system prompt** (extract from agent definition)
4. **Write to `.trae/agents/README.md`**

**Agent Configuration Template:**

```markdown
# Trae 智能体配置

在 Trae 设置 → 智能体中创建以下智能体：

| 智能体名称 | 英文标识   | 可被调用 | 工具配置 |
| ---------- | ---------- | -------- | -------- |
| ${name_cn} | ${name_en} | ✅/❌    | ${tools} |

## 详细配置

### ${agent_name}

**系统提示词：**
${system_prompt}

**工具权限：**

- Read: ✅
- Edit: ✅/❌
- Terminal: ✅/❌
- Web Search: ✅/❌
```

**Output:** Agent configuration guide in `.trae/agents/README.md`

---

### Phase 5: Convert Rules

Extract rules from `AGENTS.md`, `AGENTS.example.md`, `CLAUDE.md`, `CLAUDE.example.md`:

1. **Identify rule categories:**
   - Documentation rules (llmdoc-first)
   - Language settings
   - Tool usage preferences
   - Interaction patterns

2. **Create rule files:**
   - `.trae/rules/README.md` - Index of all rules
   - `.trae/rules/documentation.md` - Documentation-first principle
   - `.trae/rules/language.md` - Language settings
   - `.trae/rules/tool-preferences.md` - Tool usage
   - `.trae/rules/interaction.md` - Interaction patterns

**Rule Extraction Patterns:**

| Source Pattern           | Target File           |
| ------------------------ | --------------------- |
| `llmdoc` related         | `documentation.md`    |
| `Always answer in 中文`  | `language.md`         |
| `<tool-usage-extension>` | `tool-preferences.md` |
| `<optional-coding>`      | `interaction.md`      |

**Output:** Rule files in `.trae/rules/`

---

### Phase 6: Generate MIGRATION.md

Create `.trae/MIGRATION.md` with:

1. **Overview table** - Component mapping summary
2. **Skills list** - All converted skills with descriptions
3. **Agents list** - UI configuration checklist
4. **Rules list** - All rule files
5. **Conversion rules** - Reference for manual adjustments
6. **Feature comparison** - Supported vs unsupported features
7. **Rollback strategy** - How to revert if needed

**Template:**

```markdown
# ${project_name} → Trae Migration Guide

## Overview

| Claude Code | Trae                | Count    |
| ----------- | ------------------- | -------- |
| Commands    | Orchestration Skill | ${count} |
| Agents      | 自定义智能体 (UI)   | ${count} |
| Skills      | Skills              | ${count} |
| Hooks       | ❌ Not supported    | ${count} |

---

## 1. Trae 智能体配置清单

...

## 2. Trae Skills 目录结构

...

## 3. 关键转换规则

...

## 4. 迁移检查清单

...

## 5. 限制说明

...

## 6. 回滚策略

...
```

**Output:** `.trae/MIGRATION.md`

---

### Phase 7: Summary & Verification

Present migration summary:

```markdown
## Migration Complete

### Files Created

- `.trae/skills/` - ${count} skills
- `.trae/agents/README.md` - Agent configuration guide
- `.trae/rules/` - ${count} rule files
- `.trae/MIGRATION.md` - Migration documentation

### Manual Steps Required

1. Create ${count} agents in Trae UI (see `.trae/agents/README.md`)
2. Configure tool permissions for each agent
3. Test skill workflows

### Unsupported Features

- Hooks (${count} hooks cannot be migrated)
- Pre-fetched context (converted to manual commands)
- MCP tools (will use degraded alternatives)

### Verification Checklist

- [ ] All skills load correctly
- [ ] Agent configurations applied in Trae UI
- [ ] Test `/skill-name` invocations
- [ ] Verify rule files are readable
```

**Output:** Migration summary

---

## Tool Mapping Reference

| Claude Code             | Trae            | Notes                   |
| ----------------------- | --------------- | ----------------------- |
| Read, Glob, Grep        | Read            | Search merged into Read |
| Write, Edit             | Edit            | -                       |
| Bash                    | Terminal        | -                       |
| WebSearch, WebFetch     | Web Search      | -                       |
| AskUserQuestion         | Dialog question | Output in conversation  |
| Task(subagent_type=...) | @agent 调用     | -                       |
| Skill(...)              | /skill 调用     | -                       |
| mcp\_\_auggie-mcp       | ❌              | Degrade to Read         |
| LSP                     | ❌              | Degrade to Read         |

---

## Quality Gates

### Pre-execution

- [ ] Source project has Claude Code components
- [ ] No existing `.trae/` directory (or user confirms overwrite)

### Post-execution

- [ ] All skills converted and syntactically valid
- [ ] Agent configuration guide is complete
- [ ] Rule files cover all extracted rules
- [ ] MIGRATION.md is comprehensive
- [ ] No source files modified

---

## Anti-Patterns

**DO:**

- Preserve original files (non-destructive migration)
- Generate comprehensive documentation
- Flag unsupported features clearly
- Provide manual step checklists

**DO NOT:**

- Modify source Claude Code files
- Skip validation of converted files
- Ignore hooks (document them as unsupported)
- Assume Trae supports all features

---

## Return Format

```
✅ Migration complete
📁 Skills: ${n} | 👤 Agents: ${n} | 📜 Rules: ${n}
📋 See .trae/MIGRATION.md for details
⚠️ Manual steps: ${n} (agent UI config)
```
