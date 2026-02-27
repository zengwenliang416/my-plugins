---
description: "Interactive memory workflow router for context management, documentation, and SKILL packaging"
argument-hint: "[action] [--run-id <id>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - AskUserQuestion
  - Task
---

# /context-memory:memory

## Purpose

Single entry point for all context-memory workflows. Routes to the appropriate skill based on user selection.

## Required Constraints

- All file writes go to `openspec/changes/{run_id}/` or `.claude/memory/`
- Multi-model outputs are reviewed by Claude before delivery
- Session IDs are preserved for multi-turn model interactions

## Menu Structure

When invoked without arguments, present this interactive menu via `AskUserQuestion`:

### Category 1: Context

| Action    | Skill               | Description                            |
| --------- | ------------------- | -------------------------------------- |
| `load`    | `context-loader`    | Load project context for current task  |
| `compact` | `session-compactor` | Compact session into persistent memory |

### Category 2: CLAUDE.md

| Action                    | Skill                     | Description                  |
| ------------------------- | ------------------------- | ---------------------------- |
| `claude-plan`             | `doc-planner`             | Plan documentation scope     |
| `claude-generate full`    | `doc-full-generator`      | Generate all CLAUDE.md files |
| `claude-generate related` | `doc-related-generator`   | Generate for changed modules |
| `claude-update full`      | `doc-full-updater`        | Update all CLAUDE.md         |
| `claude-update related`   | `doc-incremental-updater` | Update changed modules       |

### Category 3: API & Rules

| Action       | Skill                  | Description               |
| ------------ | ---------------------- | ------------------------- |
| `swagger`    | `swagger-generator`    | Generate OpenAPI docs     |
| `tech-rules` | `tech-rules-generator` | Generate tech stack rules |

### Category 4: SKILL Package

| Action        | Skill                | Description              |
| ------------- | -------------------- | ------------------------ |
| `skill-index` | `skill-indexer`      | Index and package skills |
| `code-map`    | `code-map-generator` | Generate code maps       |
| `skill-load`  | `skill-loader`       | Load SKILL packages      |

### Category 5: Memory

| Action     | Skill             | Description            |
| ---------- | ----------------- | ---------------------- |
| `style`    | `style-memory`    | Extract style patterns |
| `workflow` | `workflow-memory` | Archive workflow state |

## Steps

### Step 0: Parse Arguments

```bash
# If --run-id provided, use as CHANGE_ID (resume mode)
# Otherwise derive from action: kebab-case
# Examples: "memory-doc-generation", "memory-style-extraction"
# Fallback: "memory-$(date +%Y%m%d-%H%M%S)"
run_id="${args[--run-id]:-memory-${slug_from_action}}"
run_dir="openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${run_dir}/proposal.md`: `# Change:` title, `## Why` (memory action purpose), `## What Changes` (memory deliverables), `## Impact`
- `${run_dir}/tasks.md`: one numbered section per selected action with `- [ ]` items

Mark items `[x]` as each step completes.

```

If an `action` argument is provided, skip to Step 2 with that action.

### Step 1: Interactive Selection

Use `AskUserQuestion` with categories above. Present as grouped options.

### Step 2: Route to Skill

Map selected action to the corresponding skill invocation:

```

action=load → Skill("context-memory:context-loader", {task, run_dir})
action=compact → Skill("context-memory:session-compactor", {run_dir})
action=claude-plan → Skill("context-memory:doc-planner", {run_dir})
action=claude-generate full → launch team workflow (see Step 3)
action=claude-generate related → launch team workflow (see Step 3)
action=claude-update full → launch team workflow (see Step 3)
action=claude-update related → launch team workflow (see Step 3)
action=swagger → Skill("context-memory:swagger-generator", {run_dir})
action=tech-rules → Skill("context-memory:tech-rules-generator", {run_dir})
action=skill-index → Skill("context-memory:skill-indexer", {run_dir})
action=code-map → Skill("context-memory:code-map-generator", {run_dir})
action=skill-load → Skill("context-memory:skill-loader")
action=style → Skill("context-memory:style-memory", {run_dir})
action=workflow → Skill("context-memory:workflow-memory", {run_dir})

```

### Step 3: Multi-Model Workflows (for claude-generate/claude-update actions)

For `claude-generate` and `claude-update` actions, orchestrate via parallel `Task` calls:

1. **Scan**: `Task(subagent_type="context-memory:project-scanner", name="scanner", prompt="run_dir=${run_dir} mode=scan")` → `${run_dir}/modules.json`
2. **Generate** (per module layer, 3→2→1):
   - Try **primary path** — launch parallel Task calls in a single message:
     - `Task(subagent_type="context-memory:gemini-core", name="gemini-gen", prompt="run_dir=${run_dir} role=doc-generator module=${module}")`
     - `Task(subagent_type="context-memory:codex-core", name="codex-gen", prompt="run_dir=${run_dir} role=doc-generator module=${module}")`
     - Both run concurrently. Each blocks until completion.
     - Collect `${run_dir}/gemini-docs-{module}.md` and `${run_dir}/codex-docs-{module}.md`
   - If **both fail** → **fallback**: Claude lead generates docs inline using Read + project context
   - If **one succeeds** → use the successful output as sole source
3. **Merge**: For each module, Claude lead reads available outputs and produces `${run_dir}/merged-docs-{module}.md`:
   - Compare structure, completeness, and accuracy
   - Take the best sections from each source
   - Ensure consistent format: sections, code examples, dependency notes
4. **Write**: `Task(subagent_type="context-memory:doc-worker", name="writer", prompt="run_dir=${run_dir} plan=write-claude-md")` reads `merged-docs-{module}.md` → writes `{module}/CLAUDE.md`
5. **Audit**: `Task(subagent_type="context-memory:codex-core", name="auditor", prompt="run_dir=${run_dir} role=auditor")` → `${run_dir}/codex-audit.md`
   - If auditor unavailable, Claude lead performs inline quality review
6. **Summary**: Report artifacts created and audit results

#### Fallback Chain

```

Gemini + Codex (parallel, preferred)
→ Single model (if one fails)
→ Claude inline (last resort, if both fail)

```

#### Error Handling

- Each Task call has implicit timeout (agent turn limit)
- If scan fails → abort workflow, report error to user
- If all doc-generation fails for a module → skip module, log warning

### Step 4: Delivery

- Report artifacts created
- Show next recommended actions
- If team workflow, include quality audit summary
```
