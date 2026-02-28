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

### Category 1: CLAUDE.md Documentation

| Action                    | Routing                         | Description                  |
| ------------------------- | ------------------------------- | ---------------------------- |
| `claude-plan`             | Skill: `doc-planner`            | Plan documentation scope     |
| `claude-generate full`    | **Step 5 team workflow**        | Generate all CLAUDE.md files |
| `claude-generate related` | **Step 5 team workflow**        | Generate for changed modules |
| `claude-update full`      | **Step 5 team workflow**        | Update all CLAUDE.md         |
| `claude-update related`   | **Step 5 team workflow**        | Update changed modules       |

**⚠️ `claude-generate` and `claude-update` actions MUST go through Step 5 (agent team workflow). Do NOT call `doc-full-generator`, `doc-related-generator`, `doc-full-updater`, or `doc-incremental-updater` skills directly — they are reference specs only.**

### Category 2: API & Rules

| Action       | Skill                  | Description               |
| ------------ | ---------------------- | ------------------------- |
| `swagger`    | `swagger-generator`    | Generate OpenAPI docs     |
| `tech-rules` | `tech-rules-generator` | Generate tech stack rules |

### Category 3: SKILL Package

| Action        | Skill                | Description              |
| ------------- | -------------------- | ------------------------ |
| `skill-index` | `skill-indexer`      | Index and package skills |
| `code-map`    | `code-map-generator` | Generate code maps       |
| `skill-load`  | `skill-loader`       | Load SKILL packages      |

### Category 4: Context & Memory

| Action     | Skill               | Description                            |
| ---------- | ------------------- | -------------------------------------- |
| `load`     | `context-loader`    | Load project context for current task  |
| `compact`  | `session-compactor` | Compact session into persistent memory |
| `style`    | `style-memory`      | Extract style patterns                 |
| `workflow` | `workflow-memory`   | Archive workflow state                 |

## Steps

### Step 1: Gather Context

If an `action` argument was provided, skip to Step 3 with that action.

Otherwise, read the project's root `CLAUDE.md` (or `package.json` / `README.md`) to understand the project context. This step is required before presenting the menu.

### Step 2: Interactive Selection

**⛔ Do NOT create directories, write files, or execute any workflow before the user selects an action.**

Call `AskUserQuestion` with EXACTLY these parameters (all fields are required):

- **question**: "请选择要执行的工作流类型"
- **header**: "Workflow"
- **multiSelect**: false
- **options** (exactly 4):
  1. label: "CLAUDE.md", description: "生成或更新 CLAUDE.md 文档"
  2. label: "API & Rules", description: "生成 OpenAPI 文档或技术栈规则"
  3. label: "SKILL Package", description: "索引打包 SKILL 或生成代码地图"
  4. label: "Context", description: "加载上下文、压缩会话、样式提取"

After the user selects a category, call `AskUserQuestion` AGAIN with the specific actions for that category (2-4 options, same format with question/header/multiSelect/options all provided).

Wait for the user's response, then proceed to Step 3.

### Step 3: Setup Run Directory

After the user has selected an action (from Step 2 or from arguments):

```
run_id = args[--run-id] or "memory-{action-slug}"
run_dir = "openspec/changes/${run_id}"
mkdir -p "${run_dir}"
```

Write OpenSpec scaffold:

- `${run_dir}/proposal.md`: `# Change:` title, `## Why`, `## What Changes`, `## Impact`
- `${run_dir}/tasks.md`: one numbered section per selected action with `- [ ]` items

Mark items `[x]` as each step completes.

### Step 4: Route to Skill

Map selected action to the corresponding skill invocation:

```

action=load → Skill("context-memory:context-loader", {task, run_dir})
action=compact → Skill("context-memory:session-compactor", {run_dir})
action=claude-plan → Skill("context-memory:doc-planner", {run_dir})
action=claude-generate full → MANDATORY: go to Step 5 (team workflow with gemini-core + codex-core agents)
action=claude-generate related → MANDATORY: go to Step 5 (team workflow with gemini-core + codex-core agents)
action=claude-update full → MANDATORY: go to Step 5 (team workflow with gemini-core + codex-core agents)
action=claude-update related → MANDATORY: go to Step 5 (team workflow with gemini-core + codex-core agents)
action=swagger → Skill("context-memory:swagger-generator", {run_dir})
action=tech-rules → Skill("context-memory:tech-rules-generator", {run_dir})
action=skill-index → Skill("context-memory:skill-indexer", {run_dir})
action=code-map → Skill("context-memory:code-map-generator", {run_dir})
action=skill-load → Skill("context-memory:skill-loader")
action=style → Skill("context-memory:style-memory", {run_dir})
action=workflow → Skill("context-memory:workflow-memory", {run_dir})

```

### Step 5: Multi-Model Workflows (for claude-generate/claude-update actions)

**⛔ STOP — Read this before proceeding.**

This step uses a TEAM of typed agents to call external models (Gemini + Codex CLI). You are the orchestrator — you MUST NOT generate CLAUDE.md content yourself. You prepare prompts and route them through the agents below. The agents call gemini-cli/codex-cli skills which invoke `gemini` and `codex` CLI binaries.

**Do NOT call `doc-full-generator` / `doc-related-generator` / `doc-full-updater` / `doc-incremental-updater` skills directly. Those are reference specs for prompt structure only.**

#### MANDATORY Agent Type Restrictions

You MUST ONLY invoke these agent types in this workflow.

| Step     | `subagent_type`                  | Purpose          |
| -------- | -------------------------------- | ---------------- |
| Scan     | `context-memory:project-scanner` | Module discovery |
| Generate | `context-memory:gemini-core`     | Gemini doc-gen   |
| Generate | `context-memory:codex-core`      | Codex doc-gen    |
| Write    | `context-memory:doc-worker`      | File writing     |
| Audit    | `context-memory:codex-core`      | Quality review   |

#### FORBIDDEN Anti-Patterns

| ❌ Forbidden                                         | ✅ Required Instead                                        |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| Spawning `general-purpose` agents for doc generation | Use `context-memory:gemini-core` + `context-memory:codex-core` |
| Batching multiple modules into one generic agent     | Route each module through the agents above per layer       |
| Generating CLAUDE.md content inline (skipping agents)| ALL content generation through gemini-core/codex-core      |
| Skipping external model invocation                   | ALWAYS attempt gemini-core + codex-core before fallback    |

For `claude-generate` and `claude-update` actions, orchestrate via parallel `Agent` calls:

1. **Scan**: `Agent(subagent_type="context-memory:project-scanner", name="scanner", prompt="run_dir=${run_dir} mode=scan")` → `${run_dir}/modules.json`

2. **Generate** — process layers in order (3→2→1). For EACH layer, launch a pair of agents in parallel (single message):

   ```
   # Launch both agents for the current layer in ONE message (parallel execution)
   Agent(
     subagent_type="context-memory:gemini-core",
     name="gemini-layer-{N}",
     prompt="run_dir=${run_dir} role=doc-generator modules=[list of modules in layer {N}]"
   )
   Agent(
     subagent_type="context-memory:codex-core",
     name="codex-layer-{N}",
     prompt="run_dir=${run_dir} role=doc-generator modules=[list of modules in layer {N}]"
   )
   ```

   - Each agent processes ALL modules in its layer sequentially (calling gemini-cli/codex-cli skill per module).
   - Both agents run concurrently for the same layer.
   - Wait for both to complete before processing the next layer (lower-layer docs inform upper layers).
   - Outputs: `${run_dir}/gemini-docs-{module}.md` and `${run_dir}/codex-docs-{module}.md`
   - If **both fail** for a module → fallback: Claude lead generates inline using Read + project context
   - If **one succeeds** → use the successful output as sole source

3. **Merge**: For each module, Claude lead reads available outputs and produces `${run_dir}/merged-docs-{module}.md`:
   - Compare structure, completeness, and accuracy
   - Take the best sections from each source
   - Ensure consistent format

4. **Write**: `Agent(subagent_type="context-memory:doc-worker", name="writer", prompt="run_dir=${run_dir} plan=write-claude-md")` reads `merged-docs-{module}.md` → writes `{module}/CLAUDE.md`

5. **Audit**: `Agent(subagent_type="context-memory:codex-core", name="auditor", prompt="run_dir=${run_dir} role=auditor")` → `${run_dir}/codex-audit.md`
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

### Step 6: Delivery

- Report artifacts created
- Show next recommended actions
- If team workflow, include quality audit summary
```
