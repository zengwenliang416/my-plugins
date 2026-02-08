# integrate-cc-v2133-features: Documentation & DX Architecture Plan

## Metadata

- Proposal ID: integrate-cc-v2133-features
- Created: 2026-02-06T17:00:00Z
- Planner: Gemini Architect (Claude ultra-thinking fallback)
- Focus: documentation, ux, developer-experience, frontend
- Thinking Phase: Consumed (handoff.json, synthesis.md, clarifications.md, boundaries.json, conclusion.md)

---

## 1. Documentation Architecture

### 1.1 Documentation Drift Inventory

Source of truth: `plugins/hooks/hooks/hooks.json` (151 lines, 14 script entries, 7 lifecycle event keys, 8 category directories).

| File                                                          | Current Claims                             | Reality                                        | Delta                                  | Priority |
| ------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------- | -------------------------------------- | -------- |
| `llmdoc/architecture/hooks-system.md`                         | 5 lifecycle points, 11 hooks               | 7 events, 14 scripts                           | +2 events, +3 scripts                  | P1       |
| `llmdoc/reference/hook-scripts.md`                            | 11 scripts, 5 points, 6 categories         | 14 scripts, 7 points, 8 categories             | +3 scripts, +2 points, +2 categories   | P1       |
| `llmdoc/guides/how-to-create-a-hook.md`                       | 5 lifecycle points, no orchestration       | 7 points, orchestration hooks differ           | +2 points, +orchestration guidance     | P1       |
| `plugins/hooks/CLAUDE.md`                                     | 7 hooks, 4 categories                      | 14 hooks, 8 categories                         | +7 hooks, +4 categories                | P1       |
| `llmdoc/architecture/memory-architecture.md`                  | No Auto Memory, no ownership rules         | Auto Memory at Hot layer, ownership boundaries | +Auto Memory section, +ownership rules | P2       |
| `llmdoc/architecture/plugin-architecture.md`                  | 7 events (correct), no memory scope detail | Already correct for events, missing scope docs | +memory scope documentation            | P3       |
| `plugins/context-memory/skills/tech-rules-generator/SKILL.md` | Output to `.claude/rules/`                 | Must migrate to `.claude/memory/rules/`        | Path change at 4 locations             | P1       |

### 1.2 Documentation Dependency Graph

```
Phase 1 (Foundation - no dependencies):
  ST-1a: tech-rules-generator SKILL.md path migration
         Lines: 5, 64, 331-339, 343-362
         Reason: Resolves HC-1 (.claude/rules/ collision) before any doc references the new path

Phase 2 (Hook docs - depends on Phase 1 for accurate hook count):
  ST-2a: hooks-system.md correction
         Lines: 1 (title count), 10 (hook count), 19-25 (lifecycle table), 33 (timeout range)
         Reason: Architecture doc is the canonical reference; others cross-reference it

  ST-2b: hook-scripts.md correction (depends on ST-2a)
         Lines: 1 (summary counts), 5 (source-of-truth reference)
         Add: Orchestration category section with teammate-idle.sh and task-completed.sh tables
         Reason: References hooks-system.md for architecture context

  ST-2c: how-to-create-a-hook.md update (depends on ST-2a)
         Lines: 45 (lifecycle list), 46 (matcher guidance)
         Add: Orchestration hook creation guidance (different input schema, wildcard matcher)
         Reason: Guide must reflect all lifecycle points for completeness

  ST-2d: hooks CLAUDE.md update (depends on ST-2a, ST-2b)
         Hook table: Add killshell-guard, read-limit, auto-backup, auto-approve,
                     file-permission, smart-notify, teammate-idle, task-completed
         Categories table: Add Optimization, Logging, Permission, Notification, Orchestration
         Reason: User-facing plugin doc must be complete; cross-references architecture docs

Phase 3 (Memory docs - depends on ST-1a for path accuracy):
  ST-5a: memory-architecture.md update (depends on ST-1a)
         Add: Auto Memory integration section, ownership boundaries, tech-rules migration note
         Reason: Must reflect the new .claude/memory/rules/ path from ST-1a

  ST-5b: plugin-architecture.md update (depends on ST-5a)
         Add: Memory scope table with agent-to-scope mapping
         Reason: References memory-architecture.md for scope definitions
```

### 1.3 Cross-Reference Integrity Matrix

Documents that reference each other, requiring coordinated updates.

| Source Document               | References                                              | Referenced By                                                    | Coordination Need                            |
| ----------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| hooks-system.md               | hooks.json (source of truth)                            | hook-scripts.md, how-to-create-a-hook.md, plugin-architecture.md | Counts must match hooks.json exactly         |
| hook-scripts.md               | hooks-system.md (architecture), hooks.json (scripts)    | hooks CLAUDE.md, how-to-create-a-hook.md                         | Category list must match directory structure |
| how-to-create-a-hook.md       | hooks-system.md (lifecycle), hook-scripts.md (examples) | None (leaf doc)                                                  | Lifecycle list must match hooks-system.md    |
| hooks CLAUDE.md               | hook-scripts.md (categories), hooks.json (registry)     | None (user-facing)                                               | Hook table must match hooks.json             |
| memory-architecture.md        | Agent frontmatter (agents/\*.md), SKILL.md (tech-rules) | plugin-architecture.md, context-memory CLAUDE.md                 | Layer table must include Auto Memory         |
| plugin-architecture.md        | memory-architecture.md (scopes), hooks.json (events)    | None (architecture overview)                                     | Event count already correct (7)              |
| tech-rules-generator SKILL.md | None (self-contained)                                   | memory-architecture.md (path reference)                          | Output path must be .claude/memory/rules/    |

### 1.4 Content Accuracy Verification Matrix

Per-file, line-level changes required for documentation correction.

#### hooks-system.md (60 lines)

| Line(s) | Current Content                                             | Required Change                                                 |
| ------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| 1       | "5 hook points"                                             | "7 lifecycle event points"                                      |
| 10      | "all 11 hooks"                                              | "all 14 hooks"                                                  |
| 19-25   | 5-row lifecycle table (missing TeammateIdle, TaskCompleted) | 7-row table adding TeammateIdle and TaskCompleted rows          |
| 33      | "3-30s" timeout range                                       | "3-30s" (keep range, but add note: orchestration hooks use 5s)  |
| NEW     | N/A                                                         | Add git-conflict-guard.sh to PreToolUse/Bash listing at line 22 |

#### hook-scripts.md (60 lines)

| Line(s) | Current Content                                   | Required Change                                                                                                                                    |
| ------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | "11 shell scripts executed at 5 lifecycle points" | "14 shell scripts executed at 7 lifecycle event points"                                                                                            |
| 1       | "6 categories"                                    | "8 categories"                                                                                                                                     |
| 5       | "11 hooks" in source-of-truth section             | "14 hooks"                                                                                                                                         |
| 15-21   | Security table: 3 rows                            | Keep 3 rows (privacy-firewall, db-guard, killshell-guard). git-conflict-guard is already in PreToolUse but needs its own row in the Security table |
| NEW     | N/A                                               | Add Security row for git-conflict-guard.sh (PreToolUse, Bash, 5s, Git conflict marker detection)                                                   |
| NEW     | N/A                                               | Add Orchestration category section with 2 scripts                                                                                                  |

Template for new Orchestration section:

```markdown
### Orchestration (TeammateIdle, TaskCompleted)

| Script                                    | Hook Point    | Matcher | Timeout | Key Feature                                            |
| ----------------------------------------- | ------------- | ------- | ------- | ------------------------------------------------------ |
| `scripts/orchestration/teammate-idle.sh`  | TeammateIdle  | `*`     | 5s      | Logs idle teammate events for orchestration awareness  |
| `scripts/orchestration/task-completed.sh` | TaskCompleted | `*`     | 5s      | Logs task completion events for orchestration tracking |
```

#### how-to-create-a-hook.md (63 lines)

| Line(s) | Current Content                                                                       | Required Change                                                                                                     |
| ------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1-10    | Category list: 5 categories (Security, Optimization, Logging, Permission, Evaluation) | Add: Notification, Orchestration                                                                                    |
| 45      | Implicit 5 lifecycle points                                                           | List all 7: UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Notification, TeammateIdle, TaskCompleted |
| 46      | "Use regex matchers"                                                                  | Add: "Orchestration hooks use `*` (wildcard). Matcher semantics differ by event type."                              |
| NEW     | N/A                                                                                   | Add orchestration hook creation guidance section (see template below)                                               |

Template for orchestration hook guidance:

```markdown
## Creating Orchestration Hooks

Orchestration hooks (TeammateIdle, TaskCompleted) differ from tool-lifecycle hooks:

1. **Input schema**: Receives agent/task metadata, not tool invocation data
   - TeammateIdle: `{"teammate_name": "...", "idle_since": "..."}`
   - TaskCompleted: `{"task_id": "...", "status": "..."}`
     (Note: exact fields require empirical verification against v2.1.33)

2. **Matcher**: Always `*` (wildcard) -- no tool-name filtering applies

3. **Response**: Currently logging-only (`{}`). Future: `hookSpecificOutput` with orchestration directives

4. **Timeout**: 5s ceiling (HC-4). Use async background processes for heavy work.
```

#### hooks CLAUDE.md (121 lines)

| Section                        | Current Content                                     | Required Change                                            |
| ------------------------------ | --------------------------------------------------- | ---------------------------------------------------------- |
| Hook table (lines 12-21)       | 7 hooks listed                                      | Expand to all 14 hooks with accurate lifecycle/description |
| Categories table (lines 68-73) | 4 categories (Security, Quality, Logging, Routing)  | Expand to 8 categories                                     |
| Script template (lines 99-120) | Only covers PreToolUse/PostToolUse/UserPromptSubmit | Add orchestration hook template variant                    |

Complete hook table (replacement):

```markdown
| Hook               | Lifecycle         | Description                         |
| ------------------ | ----------------- | ----------------------------------- |
| privacy-firewall   | UserPromptSubmit  | Sensitive data detection            |
| unified-eval       | UserPromptSubmit  | Smart plugin routing                |
| read-limit         | PreToolUse        | Auto-inject read limits             |
| db-guard           | PreToolUse        | Dangerous SQL detection             |
| git-conflict-guard | PreToolUse        | Git conflict marker detection       |
| killshell-guard    | PreToolUse        | codeagent-wrapper process guard     |
| auto-backup        | PreToolUse        | Timestamped file backup (async)     |
| mcp-logger         | PreToolUse        | MCP call logging (async)            |
| auto-format        | PostToolUse       | Auto code formatting                |
| auto-approve       | PermissionRequest | Safe command auto-approval          |
| file-permission    | PermissionRequest | File write permission management    |
| smart-notify       | Notification      | Multi-channel workflow notification |
| teammate-idle      | TeammateIdle      | Agent idle event logging            |
| task-completed     | TaskCompleted     | Task completion event logging       |
```

Complete categories table (replacement):

```markdown
| Category      | Hooks                                                           | Purpose              |
| ------------- | --------------------------------------------------------------- | -------------------- |
| Security      | privacy-firewall, db-guard, git-conflict-guard, killshell-guard | Block dangerous ops  |
| Optimization  | read-limit                                                      | Optimize tool inputs |
| Quality       | auto-format                                                     | Code formatting      |
| Logging       | auto-backup, mcp-logger                                         | Audit and backup     |
| Permission    | auto-approve, file-permission                                   | Auto-approval        |
| Evaluation    | unified-eval                                                    | Intent routing       |
| Notification  | smart-notify                                                    | Event notifications  |
| Orchestration | teammate-idle, task-completed                                   | Agent coordination   |
```

#### tech-rules-generator SKILL.md

| Line(s) | Current Content                 | Required Change                                            |
| ------- | ------------------------------- | ---------------------------------------------------------- |
| 5       | `.claude/rules/{stack}.md`      | `.claude/memory/rules/{stack}.md`                          |
| 64      | `5. 输出到 .claude/rules/`      | `5. 输出到 .claude/memory/rules/`                          |
| 331-339 | `.claude/rules/` directory tree | `.claude/memory/rules/` directory tree                     |
| 343-362 | `// .claude/rules/index.json`   | `// .claude/memory/rules/index.json`; update `path` values |

---

## 2. Developer Experience: Hook Creation

### 2.1 Current DX Gaps

The how-to-create-a-hook.md guide has three DX problems for developers creating orchestration hooks:

1. **Missing lifecycle coverage**: Guide only covers 5 of 7 lifecycle events. A developer wanting to hook TeammateIdle or TaskCompleted finds no guidance.

2. **No input schema documentation**: Each lifecycle event has a different input payload. The guide shows only `tool_name`/`tool_input` (PreToolUse schema), but orchestration events deliver `teammate_name`/`idle_since` or `task_id`/`status`.

3. **Template gap**: The hook script template assumes PreToolUse-style inputs. Orchestration hooks need a different template with different jq extraction patterns.

### 2.2 Input Schema Documentation Structure

Add a new section to how-to-create-a-hook.md documenting the input schema per lifecycle event type:

```
## Input Schema by Lifecycle Event

### Tool Lifecycle Events (PreToolUse, PostToolUse)
Input: {"tool_name": "...", "tool_input": {...}}

### Prompt Events (UserPromptSubmit)
Input: {"prompt": "..."}

### Permission Events (PermissionRequest)
Input: {"tool_name": "...", "tool_input": {...}}

### Notification Events (Notification)
Input: {"message": "...", "level": "..."}
(Note: schema inferred from smart-notify.sh implementation)

### Orchestration Events (TeammateIdle, TaskCompleted)
Input: {"teammate_name": "...", "idle_since": "..."} (TeammateIdle)
Input: {"task_id": "...", "status": "..."} (TaskCompleted)
(Note: fields assumed from current scripts; requires v2.1.33 empirical verification)
```

### 2.3 Hook Script Template Updates

The hooks CLAUDE.md script template (lines 99-120) needs an orchestration variant:

```bash
#!/bin/bash
# Hook: your-orchestration-hook
# Lifecycle: TeammateIdle | TaskCompleted
# Description: What this hook does
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log_info()  { echo -e "${GREEN}[HOOK-NAME]${NC} $1" >&2; }
log_warn()  { echo -e "${YELLOW}[HOOK-NAME]${NC} $1" >&2; }
log_error() { echo -e "${RED}[HOOK-NAME]${NC} $1" >&2; }

input=$(cat)

# Validate input has expected fields
if ! echo "$input" | jq -e '.teammate_name // .task_id' > /dev/null 2>&1; then
  log_warn "Unexpected input schema"
  echo '{}'
  exit 0
fi

# Extract fields (adapt to TeammateIdle or TaskCompleted)
FIELD=$(echo "$input" | jq -r '.teammate_name // .task_id // empty')

# Structured JSONL logging
LOG_DIR="${HOME}/.claude/logs/hook-events"
mkdir -p "${LOG_DIR}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "{\"timestamp\":\"${TIMESTAMP}\",\"field\":\"${FIELD}\",\"raw\":$(echo "$input" | jq -c '. // {}')}" >> "${LOG_DIR}/your-hook.jsonl"

# Structured response (logging-first; orchestration directives optional)
echo '{"hookSpecificOutput": {"logged": true}}'
exit 0
```

### 2.4 Registration Guidance for Orchestration Hooks

Add to how-to-create-a-hook.md step 4 (registration):

```json
{
  "TeammateIdle": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/scripts/orchestration/your-hook.sh",
          "timeout": 5
        }
      ]
    }
  ]
}
```

Note: Orchestration events always use `"matcher": "*"` because there is no tool name to match against. The `timeout` ceiling is 5s per HC-4.

---

## 3. /tpd:dev Command UX

### 3.1 Current UX Problems

The Agent Teams section (lines 351-387 of `plugins/tpd/commands/dev.md`) has six UX gaps:

| #   | Gap                                                     | Impact                                                       |
| --- | ------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | No explicit `team()` API call syntax                    | Developer cannot understand how to invoke Agent Teams        |
| 2   | No state tracking between iterations                    | Audit failures cannot be passed back to implementers         |
| 3   | No hook integration awareness                           | TeammateIdle/TaskCompleted events not leveraged for feedback |
| 4   | No runtime env var detection mechanism                  | Markdown command cannot check shell env vars                 |
| 5   | No agent frontmatter field requirements for Agent Teams | Unclear which YAML fields Agent Teams reads                  |
| 6   | Section is documentation-only skeleton                  | No actionable pseudo-code for team dispatch                  |

### 3.2 Agent Teams Activation Feedback Design

When Agent Teams mode activates, the /tpd:dev command should provide clear user feedback:

**Activation flow:**

```
Step 0: Environment Detection
  IF process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === "1":
    LOG to user: "[Agent Teams] Experimental mode activated. Steps 3+5 use iterative team cycle."
    LOG to user: "[Agent Teams] Team: codex-implementer, gemini-implementer, codex-auditor, gemini-auditor"
    LOG to user: "[Agent Teams] Max iterations: 2. Fallback: manual review."
    PROCEED with team cycle
  ELSE:
    LOG to user: "[Standard Mode] Using Task() subagent dispatch for Steps 3 and 5."
    PROCEED with standard mode (no change from baseline)
```

**Iteration feedback:**

```
Iteration 1/2:
  LOG: "[Agent Teams] Iteration 1: Dispatching implementers..."
  LOG: "[Agent Teams] Iteration 1: Dispatching auditors..."
  IF audit passes:
    LOG: "[Agent Teams] Audit passed. Proceeding to Step 4 (refactor)."
  ELSE:
    LOG: "[Agent Teams] Audit failed. Issues: <count>. Starting iteration 2."

Iteration 2/2:
  LOG: "[Agent Teams] Iteration 2 (final): Re-dispatching implementers with audit feedback..."
  IF audit passes:
    LOG: "[Agent Teams] Audit passed on retry. Proceeding to Step 4."
  ELSE:
    LOG: "[Agent Teams] Max iterations reached. Falling back to manual review."
    LOG: "[Agent Teams] Audit issues saved to: ${RUN_DIR}/audit-unresolved.md"
```

### 3.3 Fallback Messaging Design

Three fallback scenarios with distinct messaging:

| Scenario                | Trigger                                                   | User Message                                                                                                               |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Feature flag unset      | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` not set or not "1" | Silent: no Agent Teams mention. Standard mode proceeds.                                                                    |
| Max iterations exceeded | 2 iterations without audit pass                           | "[Agent Teams] Exhausted 2 iterations. Unresolved issues written to audit-unresolved.md. Manual review required."          |
| Agent Teams API error   | Runtime error in team dispatch                            | "[Agent Teams] Team dispatch failed: <error>. Falling back to standard Task() mode." Then proceed with standard Steps 3+5. |

### 3.4 State Tracking Between Iterations

The team cycle needs to pass audit results back to implementers. Proposed file-based state:

```
${RUN_DIR}/
  team-state.json          # Iteration tracking
  audit-iteration-1.md     # First audit results
  audit-iteration-2.md     # Second audit results (if needed)
  audit-unresolved.md      # Issues remaining after max iterations
```

`team-state.json` schema:

```json
{
  "mode": "agent-teams",
  "iteration": 1,
  "max_iterations": 2,
  "audit_passed": false,
  "audit_issues": ["issue-1", "issue-2"],
  "implementer_outputs": ["prototype-codex.diff", "prototype-gemini.diff"],
  "auditor_outputs": ["audit-codex.md", "audit-gemini.md"]
}
```

### 3.5 Cross-Model Isolation Enforcement

Per HC-6, the command must enforce that codex-implementer and gemini-implementer never exchange messages. The isolation model:

```
codex-implementer  -->  RUN_DIR/prototype-codex.diff   \
                                                        --> Step 4 (refactor) synthesizes
gemini-implementer -->  RUN_DIR/prototype-gemini.diff  /

codex-auditor  -->  RUN_DIR/audit-codex.md   \
                                              --> team-state.json aggregates pass/fail
gemini-auditor -->  RUN_DIR/audit-gemini.md  /
```

No shared state between codex-_ and gemini-_ agents. Synthesis only happens in the refactor step by the orchestrating command, not by the agents themselves.

---

## 4. Memory Architecture Documentation

### 4.1 Three-Layer Model Update

Current `llmdoc/architecture/memory-architecture.md` (57 lines) describes the Hot/Warm/Cold model but omits Auto Memory. The updated layer table:

| Layer | System                    | Storage                | Lifecycle                    | Path                           | Owner                       |
| ----- | ------------------------- | ---------------------- | ---------------------------- | ------------------------------ | --------------------------- |
| Hot   | Native agent `memory`     | Agent-learned patterns | Persistent (200-line cap)    | `.claude/agent-memory/<name>/` | Claude Code platform        |
| Hot   | Auto Memory rules         | Path-scoped rules      | Persistent                   | `.claude/rules/`               | Claude Code Auto Memory     |
| Warm  | `workflow-memory` skill   | Workflow phase state   | Session-level, 7d expiry     | `.claude/memory/workflows/`    | context-memory plugin       |
| Warm  | tech-rules-generator      | Stack-specific rules   | Persistent until regenerated | `.claude/memory/rules/`        | context-memory plugin       |
| Cold  | `session-compactor` skill | Session recovery       | Time-limited                 | `.claude/memory/sessions/`     | context-memory plugin (MCP) |

### 4.2 Auto Memory Integration Section

New section to add after the existing "Hot Layer" section in memory-architecture.md:

```markdown
### Hot Layer: Auto Memory (v2.1.33+)

Claude Code Auto Memory writes path-scoped rules to `.claude/rules/`:

- **Ownership**: `.claude/rules/` is exclusively owned by Auto Memory
- **Content**: Learned project patterns, style conventions, tool preferences
- **Format**: Markdown files auto-loaded into agent system prompt
- **Lifecycle**: Persistent; managed by Claude Code platform, not by plugins

### Ownership Boundaries (HC-8)

| Domain                  | Owner                                 | Path                                    | Content                               |
| ----------------------- | ------------------------------------- | --------------------------------------- | ------------------------------------- |
| Project instructions    | context-memory (claude-updater skill) | `.claude/CLAUDE.md`                     | Curated project instructions          |
| Agent persistent memory | Claude Code Auto Memory               | `.claude/agent-memory/<name>/MEMORY.md` | Agent-learned patterns (200-line cap) |
| Auto Memory rules       | Claude Code Auto Memory               | `.claude/rules/*.md`                    | Path-scoped learned rules             |
| Tech stack rules        | tech-rules-generator skill            | `.claude/memory/rules/{stack}.md`       | Generated best-practice rules         |

Neither system writes to the other's domain. context-memory NEVER writes to `.claude/rules/` or agent MEMORY.md. Auto Memory NEVER writes to `.claude/CLAUDE.md` or `.claude/memory/`.
```

### 4.3 Tech-Rules Migration Note

Add to memory-architecture.md:

```markdown
### Migration: tech-rules-generator (v2.1.33)

The tech-rules-generator skill previously wrote output to `.claude/rules/{stack}.md`.
This collided with Auto Memory's exclusive ownership of `.claude/rules/` (HC-1).

**Resolution**: Output relocated to `.claude/memory/rules/{stack}.md` (Warm layer).

- Old path: `.claude/rules/{stack}.md` + `.claude/rules/index.json`
- New path: `.claude/memory/rules/{stack}.md` + `.claude/memory/rules/index.json`
- Consumers must update read paths accordingly
```

### 4.4 MEMORY.md 200-Line Cap Strategy

Add to the Hot Layer section:

```markdown
### MEMORY.md Management (HC-5)

Agent MEMORY.md files are capped at 200 lines. Lines beyond 200 are silently truncated
from the agent's system prompt injection.

**Strategy**: Keep MEMORY.md as a concise index. Link to topic files for detailed notes:
```

.claude/agent-memory/<name>/
MEMORY.md # Max 200 lines. Links to topic files below.
debugging.md # Detailed debugging patterns
patterns.md # Architecture patterns learned
conventions.md # Project-specific conventions

```

MEMORY.md should contain:
- Key learnings (most impactful, concise)
- Links to topic files for detailed notes
- Organized semantically by topic, not chronologically
```

---

## 5. Plugin Architecture Documentation Updates

### 5.1 Agent Frontmatter: Memory Scope Table

Add to `llmdoc/architecture/plugin-architecture.md` after the Agent Frontmatter section (line 86):

```markdown
### Agent Memory Scope Assignment Convention

| Scope     | Criteria                                                                      | Agent Count | Examples                                            |
| --------- | ----------------------------------------------------------------------------- | ----------- | --------------------------------------------------- |
| `project` | Codebase-specific knowledge: structure, conventions, module boundaries        | 15          | codex-implementer, context-analyzer, commit-worker  |
| `user`    | Cross-project reusable knowledge: standards, security patterns, UX heuristics | 8           | codex-auditor, gemini-constraint, quality-validator |
| `local`   | Not used                                                                      | 0           | N/A                                                 |

All 23 agents across tpd (10), commit (4), and ui-design (9) have correct memory scope assignments.
Skills-only plugins (hooks, context-memory, brainstorm, refactor) cannot use agent memory frontmatter (HC-2).
```

### 5.2 Agent Teams Frontmatter Requirements

Add to plugin-architecture.md after the memory scope table:

```markdown
### Agent Teams Integration (Experimental, v2.1.33+)

Agent Teams uses the standard agent frontmatter fields. No additional frontmatter is required.
The `team()` API reads the same `name`, `tools`, `model`, and `memory` fields as `Task()`.

Activation: Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable.
Scope: Only /tpd:dev command. All other workflows use Task() subagents.
```

### 5.3 Skills-Only Plugin Documentation

No changes needed to skills-only plugin documentation. The 4 skills-only plugins (hooks, context-memory, brainstorm, refactor) remain unchanged. Document the platform limitation explicitly:

```markdown
### Skills-Only Plugins

4 plugins operate without agents: hooks, context-memory, brainstorm, refactor.

These plugins use `Skill()` invocations exclusively and cannot benefit from:

- Agent memory frontmatter (`memory: user|project`)
- Agent Teams coordination
- Per-agent MEMORY.md persistent learning

This is a Claude Code platform limitation (HC-2), not a design choice.
```

---

## 6. Documentation Dependency Ordering

### 6.1 Execution Order (SC-5 Enforced)

SC-5 mandates: "Documentation correction is a prerequisite before hook enhancement."

The complete ordering with rationale:

```
WAVE 1: Path Migration (independent, no doc dependencies)
  [ST-1] tech-rules-generator SKILL.md
         - 4 path references to update
         - Unblocks: memory-architecture.md can reference correct path

WAVE 2: Hook Documentation Correction (SC-5 prerequisite)
  [ST-2a] hooks-system.md
          - Canonical architecture reference
          - Must be correct before other hook docs update
          - Unblocks: ST-2b, ST-2c, ST-2d

  [ST-2b] hook-scripts.md (after ST-2a)
          - References hooks-system.md
          - Must add Orchestration category section
          - Unblocks: ST-2d

  [ST-2c] how-to-create-a-hook.md (after ST-2a)
          - References hooks-system.md lifecycle points
          - Must add orchestration hook guidance
          - Independent of ST-2b

  [ST-2d] hooks CLAUDE.md (after ST-2a, ST-2b)
          - User-facing; must reflect complete hook inventory
          - Must add 7 missing hooks and 4 missing categories

WAVE 3: Hook Script Enhancement (after WAVE 2 complete)
  [ST-3] teammate-idle.sh, task-completed.sh, hooks.json
         - Can only proceed after documentation is accurate
         - Enhancement follows documented conventions

WAVE 4: /tpd:dev Agent Teams Refinement (after WAVE 2 complete)
  [ST-4] dev.md Agent Teams section
         - References hook events documented in WAVE 2
         - hooks CLAUDE.md must be accurate for hook integration awareness

WAVE 5: Memory Architecture Documentation (after WAVE 1, 3, 4)
  [ST-5a] memory-architecture.md
          - Depends on ST-1 (correct tech-rules path)
          - Depends on ST-3 (hook events for orchestration awareness)

  [ST-5b] plugin-architecture.md (after ST-5a)
          - References memory-architecture.md
          - Adds scope table and Agent Teams notes
```

### 6.2 Dependency DAG

```
ST-1 ────────────────────────────────────────────> ST-5a -> ST-5b
  |                                                  ^        ^
  v                                                  |        |
ST-2a ──> ST-2b ──> ST-2d                          ST-3     ST-4
  |                                                  ^        ^
  +────> ST-2c                                       |        |
  |                                                  |        |
  +──────────────────────────────────────────────> (WAVE 2 gate)
```

### 6.3 File-to-Sub-Task Mapping (3-File Rule)

| Sub-Task       | Files (max 3)                                                            | Wave |
| -------------- | ------------------------------------------------------------------------ | ---- |
| ST-1           | SKILL.md, memory-architecture.md (path note only), index.json references | 1    |
| ST-2 (batch a) | hooks-system.md, hook-scripts.md, how-to-create-a-hook.md                | 2    |
| ST-2d          | hooks CLAUDE.md (single file, significant changes)                       | 2    |
| ST-3           | teammate-idle.sh, task-completed.sh, hooks.json                          | 3    |
| ST-4           | dev.md, team-state.json schema definition                                | 4    |
| ST-5           | memory-architecture.md, plugin-architecture.md, root CLAUDE.md           | 5    |

---

## 7. Quality Gates

### 7.1 Documentation Accuracy Checklist

After all waves complete, verify:

- [ ] hooks-system.md: References 7 lifecycle events, 14 hooks
- [ ] hook-scripts.md: References 14 scripts, 7 points, 8 categories; has Orchestration section
- [ ] how-to-create-a-hook.md: Lists all 7 lifecycle points; has orchestration hook guidance
- [ ] hooks CLAUDE.md: Lists all 14 hooks; 8 categories; has orchestration template
- [ ] memory-architecture.md: Documents Auto Memory integration, ownership boundaries, tech-rules migration
- [ ] plugin-architecture.md: Has memory scope table, Agent Teams notes, skills-only limitation
- [ ] tech-rules-generator SKILL.md: All paths reference `.claude/memory/rules/`
- [ ] No cross-reference inconsistencies between documents

### 7.2 DX Verification Checklist

- [ ] A developer can create a new orchestration hook using only how-to-create-a-hook.md
- [ ] Input schema documentation covers all 7 lifecycle event types
- [ ] Hook script template exists for both tool-lifecycle and orchestration variants
- [ ] Registration guidance includes orchestration event JSON example

### 7.3 UX Verification Checklist

- [ ] /tpd:dev prints activation feedback when Agent Teams enabled
- [ ] /tpd:dev prints no Agent Teams mention when feature flag unset
- [ ] Iteration progress is visible to user during team cycle
- [ ] Fallback messaging is clear for all 3 scenarios (flag unset, max iterations, API error)
- [ ] Cross-model isolation is enforced (no shared state between codex-_/gemini-_ agents)

### 7.4 Backward Compatibility Gate (HC-7)

- [ ] All 7 plugins produce identical results without v2.1.33 env vars
- [ ] /tpd:dev standard mode (no feature flag) is unchanged
- [ ] Hook scripts that existed before (11 original) are unmodified in behavior
- [ ] `.claude/rules/` consumers are updated to `.claude/memory/rules/`
- [ ] No new required dependencies on experimental features

---

## 8. Open Items (Deferred)

| Item                                                        | Status             | Impact                                                                      |
| ----------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| OQ-BLOCK-2: Exact TeammateIdle/TaskCompleted payload schema | Unresolved         | Hook scripts use defensive jq extraction; validated on first real execution |
| OQ-DESIGN-3: Matcher semantics for orchestration events     | Unresolved         | Using `*` wildcard; no filtering needed                                     |
| OQ-FUTURE-3: Agent memory interaction with Agent Teams      | Deferred           | Document as TBD in plugin-architecture.md                                   |
| `team()` API syntax                                         | Unknown            | Agent Teams documentation from Claude Code team needed before ST-4          |
| Hook return value consumption                               | Assumed actionable | Graceful degradation to logging if observation-only                         |
