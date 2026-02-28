# Context-Memory Plugin

Always answer in Chinese (Simplified).

<available-skills>

| Skill                    | Trigger                            | Description                        |
| ------------------------ | ---------------------------------- | ---------------------------------- |
| `/context-memory:memory` | "memory", "上下文管理", "文档生成" | Interactive memory workflow router |

</available-skills>

## Overview

Context-memory manages project knowledge: CLAUDE.md generation, SKILL packaging, style/workflow memory, session compaction, and tech rules. One router command orchestrates 18 skills with 4 agents.

## Quick Start

```bash
# Interactive router (recommended entry point)
/context-memory:memory

# Direct skill invocation examples
Skill("context-memory:context-loader", {task: "implement auth"})
Skill("context-memory:doc-full-updater", {run_dir: "openspec/changes/my-change/"})
Skill("context-memory:module-discovery", {run_dir: "openspec/changes/my-change/"})
```

## Skills Inventory

### Context Management

| Skill               | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `context-loader`    | Load project context for a task (auggie-mcp + module scan) |
| `session-compactor` | Compact session insights into persistent memory            |

### CLAUDE.md Generation

| Skill                     | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `doc-planner`             | Plan documentation scope and grouping                     |
| `doc-full-generator`      | Generate CLAUDE.md for all modules (3-layer architecture) |
| `doc-related-generator`   | Generate CLAUDE.md for changed modules only               |
| `doc-full-updater`        | Update all CLAUDE.md via multi-model analysis             |
| `doc-incremental-updater` | Incrementally update CLAUDE.md for affected modules       |

### API & Rules

| Skill                  | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `swagger-generator`    | Generate OpenAPI/Swagger docs from code              |
| `tech-rules-generator` | Generate tech stack rules to `.claude/memory/rules/` |

### SKILL Packaging

| Skill                | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `skill-indexer`      | Index and package skills from project modules |
| `code-map-generator` | Generate code maps with Mermaid diagrams      |
| `skill-loader`       | Load and activate SKILL packages              |

### Memory

| Skill             | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `style-memory`    | Extract and persist design tokens and style patterns |
| `workflow-memory` | Archive and recall workflow execution state          |

### Shared Utilities

| Skill              | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `module-discovery` | Scan project tree, classify modules, group by layer  |
| `change-detector`  | Git diff to affected modules with impact propagation |
| `codex-cli`        | Codex wrapper via CLI subprocess                     |
| `gemini-cli`       | Gemini wrapper via CLI subprocess                    |

## Agent Team

- `gemini-core`: PROXY agent — MUST invoke `gemini-cli` skill for all content generation (`doc-generator`, `style-analyzer`, `api-extractor`). Never generates content inline.
- `codex-core`: PROXY agent — MUST invoke `codex-cli` skill for all content generation (`analyzer`, `doc-generator`, `auditor`). Never generates content inline.
- `project-scanner`: Investigation agent (`scan`, `detect`, `analyze-deps`). Falls back to Glob/Grep when auggie-mcp unavailable.
- `doc-worker`: Execution agent for file writing and SKILL packaging. Runs in same workspace as other agents (no worktree isolation).

## Gemini Pipeline

Doc generation uses Gemini via the agent → skill → script chain:

```
Agent (gemini-core)
  → Skill (gemini-cli)
    → Script (invoke-gemini.ts)
      → CLI: gemini -p "<prompt>" --approval-mode plan -o text
```

### Fallback Chain

```
Gemini (preferred)
  → Claude inline (if Gemini fails)
```

All Gemini output is reviewed by Claude lead before writing.

## Artifact Storage

```
openspec/changes/{run_id}/       # Run artifacts (ephemeral)
.claude/skills/{package}/        # SKILL packages (persistent)
.claude/memory/
  sessions/{id}.json             # Session snapshots
  rules/{stack}.md               # Tech rules
  styles/{pkg}.json              # Style memory
  workflows/{id}.json            # Workflow state
{module}/CLAUDE.md               # Generated CLAUDE.md files
```
