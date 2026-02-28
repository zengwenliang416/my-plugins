---
description: "Generate, update, or plan CLAUDE.md documentation via Gemini pipeline"
argument-hint: "[plan|generate|update] [--scope full|related] [--run-id <id>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - AskUserQuestion
  - Task
  - mcp__auggie-mcp__codebase-retrieval
---

# /context-memory:doc

## Purpose

Manage CLAUDE.md documentation for project modules. Supports three modes:

- **plan**: Analyze project structure and plan documentation scope
- **generate**: Create new CLAUDE.md files via Gemini pipeline
- **update**: Update existing CLAUDE.md files with latest changes

## Required Constraints

- All artifacts go to `openspec/changes/{run_id}/`
- Gemini model outputs are reviewed by Claude before delivery
- Session IDs are preserved for multi-turn model interactions

## Steps

### Step 1: Determine Action — HARD STOP

If action argument is provided (`plan`, `generate`, or `update`), skip to Step 2.

**MANDATORY**: If no action argument is provided, you MUST call `AskUserQuestion` below and WAIT for the user's response. Do NOT guess or infer the action. Do NOT skip this step.

```
AskUserQuestion({
  questions: [{
    question: "Which documentation action?",
    header: "Action",
    multiSelect: false,
    options: [
      { label: "generate", description: "Create new CLAUDE.md for project modules" },
      { label: "update", description: "Update existing CLAUDE.md with latest changes" },
      { label: "plan", description: "Analyze project and plan documentation scope" }
    ]
  }]
})
```

### Step 2: Determine Scope — HARD STOP (for generate/update only)

If `--scope` argument is provided (`full` or `related`), skip to Step 3.

**MANDATORY**: For `generate` or `update` actions without `--scope`, you MUST call `AskUserQuestion` below and WAIT for the user's response. Do NOT default to `full` or `related` without asking.

```
AskUserQuestion({
  questions: [{
    question: "What scope?",
    header: "Scope",
    multiSelect: false,
    options: [
      { label: "full", description: "All modules in the project" },
      { label: "related", description: "Only modules affected by recent changes" }
    ]
  }]
})
```

### Step 3: Setup Workspace

```bash
run_id="${args[--run-id]:-memory-doc-$(date +%Y%m%d-%H%M%S)}"
run_dir="openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${run_dir}/proposal.md`: `# Change: CLAUDE.md ${action}`, `## Why`, `## What Changes`, `## Impact`
- `${run_dir}/tasks.md`: task items for the selected action

### Step 4: Route by Action

```
action=plan → Skill("context-memory:doc-planner", {run_dir: "${run_dir}"})
action=generate|update → Go to Step 5 (Gemini Workflow)
```

### Step 5: Gemini Doc Workflow (generate/update)

**You are the orchestrator — you MUST NOT generate CLAUDE.md content yourself.** Prepare prompts and route them through `context-memory:gemini-core` agents which call `gemini-cli` skill.

**Do NOT call `doc-full-generator` / `doc-related-generator` / `doc-full-updater` / `doc-incremental-updater` skills directly. Those are reference specs for prompt structure only.**

#### MANDATORY Agent Type Restrictions

| Step     | `subagent_type`                  | Purpose          |
| -------- | -------------------------------- | ---------------- |
| Scan     | `context-memory:project-scanner` | Module discovery |
| Generate | `context-memory:gemini-core`     | Gemini doc-gen   |
| Write    | `context-memory:doc-worker`      | File writing     |
| Audit    | `context-memory:gemini-core`     | Quality review   |

#### FORBIDDEN Anti-Patterns

| Forbidden                                             | Required Instead                                  |
| ----------------------------------------------------- | ------------------------------------------------- |
| Spawning `general-purpose` agents for doc generation  | Use `context-memory:gemini-core` agents only      |
| Batching multiple modules into one agent              | One gemini-core agent per module, parallel launch |
| Generating CLAUDE.md content inline (skipping agents) | ALL content generation through gemini-core        |
| Skipping Gemini invocation                            | ALWAYS use gemini-core, fail fast if unavailable  |

#### Workflow

1. **Scan**: `Agent(subagent_type="context-memory:project-scanner", name="scanner", prompt="run_dir=${run_dir} mode=scan")` -> `${run_dir}/modules.json`

2. **Generate** — process layers in order (3->2->1). For EACH layer, spawn one `gemini-core` agent **per module**, all in parallel (single message):

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
   - If Gemini fails for a module -> report error with module name and failure reason, skip that module

3. **Write**: `Agent(subagent_type="context-memory:doc-worker", name="writer", prompt="run_dir=${run_dir} plan=write-claude-md")` reads `gemini-docs-{module}.md` -> writes `{module}/CLAUDE.md`

4. **Audit**: `Agent(subagent_type="context-memory:gemini-core", name="auditor", prompt="run_dir=${run_dir} role=auditor")` -> `${run_dir}/gemini-audit.md`
   - If auditor fails, report error and skip audit step

5. **Summary**: Report artifacts created and audit results

#### Scope Variants

- **full**: Scan ALL modules, generate/update ALL CLAUDE.md files
- **related**: Use `change-detector` skill first to identify affected modules, then only process those modules and their dependents

For `related` scope, insert before the Scan step:

```
Skill("context-memory:change-detector", {run_dir: "${run_dir}"})
```

Then filter `modules.json` to only include affected modules.

#### No Fallback — Fail Fast

**Claude MUST NOT generate CLAUDE.md content as a fallback.** If Gemini is unavailable, report the error clearly so the user can diagnose the issue (e.g., `gemini` CLI not installed, API key missing, network error).

#### Error Handling

- Each Agent call has implicit timeout (agent turn limit)
- If scan fails -> abort workflow, report error to user
- If Gemini fails for a module -> report error (module name + reason), skip that module
- If ALL modules fail -> abort workflow, report full error summary to user
- **NEVER** generate CLAUDE.md content inline as a substitute

### Step 6: Delivery

- Report artifacts created
- Show next recommended actions
- If Gemini workflow, include quality audit summary
