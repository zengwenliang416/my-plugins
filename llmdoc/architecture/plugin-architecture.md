# Plugin Architecture

## 1. Identity

- **What it is:** A modular 4-layer plugin system for extending Claude Code with reusable workflows.
- **Purpose:** Enable composable development workflows via Commands, Agents, Skills, and Hooks.

## 2. Core Components

- `plugins/{plugin}/.claude-plugin/plugin.json`: Plugin metadata (name, version, description).
- `plugins/{plugin}/commands/{cmd}.md`: Workflow entry points with YAML frontmatter.
- `plugins/{plugin}/agents/{agent}.md`: Sub-task agents invoked via Task tool.
- `plugins/{plugin}/skills/{skill}/SKILL.md`: Atomic reusable operations with references/assets.
- `plugins/hooks/hooks/hooks.json`: Lifecycle hooks for cross-cutting concerns.
- `.claude-plugin/marketplace.json`: Local plugin marketplace registry.

## 3. Execution Flow (LLM Retrieval Map)

### 3.1 Plugin Resolution

- **1. Discovery:** Claude Code reads `.claude-plugin/marketplace.json` to enumerate plugins.
- **2. Loading:** Each plugin's `plugin.json` provides metadata.
- **3. Command Registration:** Commands from `commands/*.md` are registered as slash commands.

### 3.2 Command Execution (4-Layer Pattern)

- **1. Entry:** User invokes `/commit` or `/tpd:plan`.
- **2. Command Layer:** `plugins/commit/commands/commit.md` orchestrates phases.
- **3. Agent Layer:** Command calls `Task(prompt="Read plugins/commit/agents/change-investigator.md...")`.
- **4. Skill Layer:** Agents or commands call `Skill("analysis-synthesizer", "run_dir=${RUN_DIR}")`.
- **5. Hooks Layer:** `hooks.json` intercepts tool calls (PreToolUse, PostToolUse, etc.).

### 3.3 Parallel Execution Pattern

```
Task("semantic-analyzer", run_in_background=true)  --\
                                                      --> Skill("analysis-synthesizer")
Task("symbol-analyzer", run_in_background=true)   --/
```

## 4. Directory Structure

```
plugins/{plugin-name}/
├── .claude-plugin/
│   └── plugin.json           # name, version, description
├── commands/
│   └── {command}.md          # YAML frontmatter + workflow phases
├── agents/                   # Sub-task workers (v2.0)
│   └── {agent}.md            # name, tools, model, color
├── skills/
│   ├── {skill}/
│   │   ├── SKILL.md          # name, allowed-tools, arguments
│   │   ├── references/       # JSON/MD configuration
│   │   └── assets/           # Templates
│   └── _shared/              # Cross-skill resources (ui-design)
└── docs/                     # Integration examples
```

## 5. Frontmatter Specifications

### Command Frontmatter

```yaml
---
description: "Workflow description"
argument-hint: "[--flags] <args>"
allowed-tools: [Task, Skill, AskUserQuestion, Read, Bash]
---
```

### Agent Frontmatter

```yaml
---
name: agent-name
description: "Agent purpose"
tools:
  - Read
  - Bash
  - mcp__auggie-mcp__codebase-retrieval
memory: project # user | project
model: sonnet
color: cyan
---
```

- `memory: user` — Cross-project reusable knowledge (standards, patterns, heuristics)
- `memory: project` — Project-specific knowledge (codebase structure, conventions, decisions)

### Skill Frontmatter

```yaml
---
name: skill-name
description: |
  Trigger conditions and output specification.
allowed-tools: [Read, Write, LSP, mcp__auggie-mcp__codebase-retrieval]
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory
---
```

## 6. Hooks System

7 lifecycle hook points defined in `plugins/hooks/hooks/hooks.json`:

| Hook              | Timing        | Example Use Case               |
| ----------------- | ------------- | ------------------------------ |
| UserPromptSubmit  | Before LLM    | Privacy filtering, intent eval |
| PreToolUse        | Before tool   | Read limits, security guards   |
| PostToolUse       | After tool    | Auto-formatting                |
| PermissionRequest | On permission | Auto-approve safe commands     |
| Notification      | On events     | Smart notifications            |
| TeammateIdle      | Agent idle    | Orchestration event logging    |
| TaskCompleted     | Task done     | Completion tracking            |

## 7. Design Rationale

- **Separation of Concerns:** Commands orchestrate, Agents execute sub-tasks, Skills provide atomics.
- **Parallel-First:** Background task execution enables multi-model analysis.
- **Run Directory Isolation:** `.claude/{plugin}/runs/{timestamp}/` for artifact management.
- **Dual-Model Collaboration:** Codex (backend) + Gemini (frontend) for comprehensive coverage.
