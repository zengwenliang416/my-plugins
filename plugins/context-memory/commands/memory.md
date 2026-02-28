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
- Gemini model outputs are reviewed by Claude before delivery
- Session IDs are preserved for multi-turn model interactions

## Menu Structure

When invoked without arguments, present this interactive menu via `AskUserQuestion`.

### Category 1: Context & Memory

| Action     | Skill               | Description                            |
| ---------- | ------------------- | -------------------------------------- |
| `load`     | `context-loader`    | Load project context for current task  |
| `compact`  | `session-compactor` | Compact session into persistent memory |
| `style`    | `style-memory`      | Extract style patterns                 |
| `workflow` | `workflow-memory`   | Archive workflow state                 |

### Category 2: CLAUDE.md

| Action                    | Routing                  | Description                  |
| ------------------------- | ------------------------ | ---------------------------- |
| `claude-plan`             | Skill: `doc-planner`     | Plan documentation scope     |
| `claude-generate full`    | **Step 4 Gemini workflow** | Generate all CLAUDE.md files |
| `claude-generate related` | **Step 4 Gemini workflow** | Generate for changed modules |
| `claude-update full`      | **Step 4 Gemini workflow** | Update all CLAUDE.md         |
| `claude-update related`   | **Step 4 Gemini workflow** | Update changed modules       |

**`claude-generate` and `claude-update` actions MUST go through Step 4 (Gemini agent workflow). Do NOT call `doc-full-generator`, `doc-related-generator`, `doc-full-updater`, or `doc-incremental-updater` skills directly — they are reference specs only.**

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

## Steps

### Step 1: Determine Action

If an `action` argument is provided, skip directly to Step 2.

Otherwise, present the interactive menu using `AskUserQuestion`:

```
AskUserQuestion({
  questions: [{
    question: "Which workflow do you want to run?",
    header: "Workflow",
    multiSelect: false,
    options: [
      { label: "Context & Memory", description: "Load context, compact session, extract style, archive workflow" },
      { label: "CLAUDE.md", description: "Plan, generate, or update CLAUDE.md documentation" },
      { label: "API & Rules", description: "Generate OpenAPI docs or tech stack rules" },
      { label: "SKILL Package", description: "Index skills, generate code maps, load packages" }
    ]
  }]
})
```

After user selects a category, ask a follow-up question to pick the specific action within that category. For example, if user selects "Context & Memory":

```
AskUserQuestion({
  questions: [{
    question: "Which context/memory action?",
    header: "Action",
    multiSelect: false,
    options: [
      { label: "load", description: "Load project context for current task" },
      { label: "compact", description: "Compact session into persistent memory" },
      { label: "style", description: "Extract style patterns" },
      { label: "workflow", description: "Archive workflow state" }
    ]
  }]
})
```

### Step 2: Setup Workspace

```bash
# Derive run_id from selected action
# Examples: "memory-doc-generation", "memory-style-extraction"
# If --run-id provided, use as CHANGE_ID (resume mode)
# Fallback: "memory-$(date +%Y%m%d-%H%M%S)"
run_id="${args[--run-id]:-memory-${slug_from_action}}"
run_dir="openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${run_dir}/proposal.md`: `# Change:` title, `## Why` (memory action purpose), `## What Changes` (memory deliverables), `## Impact`
- `${run_dir}/tasks.md`: one numbered section per selected action with `- [ ]` items

Mark items `[x]` as each step completes.

### Step 3: Route to Skill

Map selected action to the corresponding skill invocation:

```
action=load → Skill("context-memory:context-loader", {task, run_dir})
action=compact → Skill("context-memory:session-compactor", {run_dir})
action=claude-plan → Skill("context-memory:doc-planner", {run_dir})
action=claude-generate full → MANDATORY: go to Step 4 (Gemini workflow)
action=claude-generate related → MANDATORY: go to Step 4 (Gemini workflow)
action=claude-update full → MANDATORY: go to Step 4 (Gemini workflow)
action=claude-update related → MANDATORY: go to Step 4 (Gemini workflow)
action=swagger → Skill("context-memory:swagger-generator", {run_dir})
action=tech-rules → Skill("context-memory:tech-rules-generator", {run_dir})
action=skill-index → Skill("context-memory:skill-indexer", {run_dir})
action=code-map → Skill("context-memory:code-map-generator", {run_dir})
action=skill-load → Skill("context-memory:skill-loader")
action=style → Skill("context-memory:style-memory", {run_dir})
action=workflow → Skill("context-memory:workflow-memory", {run_dir})
```

### Step 4: Gemini Doc Workflow (for claude-generate/claude-update actions)

**You are the orchestrator — you MUST NOT generate CLAUDE.md content yourself.** Prepare prompts and route them through `context-memory:gemini-core` agents which call `gemini-cli` skill → `invoke-gemini.ts` → `gemini` CLI.

**Do NOT call `doc-full-generator` / `doc-related-generator` / `doc-full-updater` / `doc-incremental-updater` skills directly. Those are reference specs for prompt structure only.**

#### MANDATORY Agent Type Restrictions

| Step     | `subagent_type`                  | Purpose          |
| -------- | -------------------------------- | ---------------- |
| Scan     | `context-memory:project-scanner` | Module discovery |
| Generate | `context-memory:gemini-core`     | Gemini doc-gen   |
| Write    | `context-memory:doc-worker`      | File writing     |
| Audit    | `context-memory:gemini-core`     | Quality review   |

#### FORBIDDEN Anti-Patterns

| Forbidden                                            | Required Instead                                  |
| ---------------------------------------------------- | ------------------------------------------------- |
| Spawning `general-purpose` agents for doc generation | Use `context-memory:gemini-core` agents only      |
| Batching multiple modules into one agent             | One gemini-core agent per module, parallel launch  |
| Generating CLAUDE.md content inline (skipping agents)| ALL content generation through gemini-core        |
| Skipping Gemini invocation                           | ALWAYS attempt gemini-core before Claude fallback |

#### Workflow

1. **Scan**: `Agent(subagent_type="context-memory:project-scanner", name="scanner", prompt="run_dir=${run_dir} mode=scan")` → `${run_dir}/modules.json`

2. **Generate** — process layers in order (3→2→1). For EACH layer, spawn one `gemini-core` agent **per module**, all in parallel (single message):

   ```
   # Layer N has modules [mod-a, mod-b, mod-c] — launch ALL in one message
   Agent(
     subagent_type="context-memory:gemini-core",
     name="gemini-mod-a",
     prompt="run_dir=${run_dir} role=doc-generator modules=[mod-a]"
   )
   Agent(
     subagent_type="context-memory:gemini-core",
     name="gemini-mod-b",
     prompt="run_dir=${run_dir} role=doc-generator modules=[mod-b]"
   )
   Agent(
     subagent_type="context-memory:gemini-core",
     name="gemini-mod-c",
     prompt="run_dir=${run_dir} role=doc-generator modules=[mod-c]"
   )
   ```

   - **One agent per module**, each calls `gemini-cli` skill once for its module.
   - All agents in the same layer run concurrently (launched in a single message).
   - Wait for ALL agents in current layer to complete before starting the next layer (lower-layer docs inform upper layers).
   - Outputs: `${run_dir}/gemini-docs-{module}.md` per agent
   - If Gemini fails for a module → fallback: Claude lead generates inline using Read + project context

3. **Write**: `Agent(subagent_type="context-memory:doc-worker", name="writer", prompt="run_dir=${run_dir} plan=write-claude-md")` reads `gemini-docs-{module}.md` → writes `{module}/CLAUDE.md`

4. **Audit**: `Agent(subagent_type="context-memory:gemini-core", name="auditor", prompt="run_dir=${run_dir} role=auditor")` → `${run_dir}/gemini-audit.md`
   - If auditor unavailable, Claude lead performs inline quality review

5. **Summary**: Report artifacts created and audit results

#### Fallback Chain

```
Gemini (preferred)
→ Claude inline (if Gemini fails)
```

#### Error Handling

- Each Agent call has implicit timeout (agent turn limit)
- If scan fails → abort workflow, report error to user
- If Gemini fails for a module → Claude lead generates inline for that module
- If all generation fails → skip module, log warning

### Step 5: Delivery

- Report artifacts created
- Show next recommended actions
- If Gemini workflow, include quality audit summary
