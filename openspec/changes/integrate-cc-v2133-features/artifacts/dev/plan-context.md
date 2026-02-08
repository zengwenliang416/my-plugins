# Context Analysis: integrate-cc-v2133-features

Generated for PLAN phase. Reuses thinking phase artifacts.

---

## 1. Project Structure

### Plugin Inventory (7 plugins)

| Plugin         | Type        | Agents | Skills | Hooks | Commands |
| -------------- | ----------- | ------ | ------ | ----- | -------- |
| tpd            | Agent-based | 10     | 4+     | No    | 4        |
| commit         | Agent-based | 4      | 4+     | No    | 1        |
| ui-design      | Agent-based | 9      | 5+     | No    | 1        |
| hooks          | Skills-only | 0      | 0      | Yes   | 0        |
| context-memory | Skills-only | 0      | 10+    | No    | 1        |
| brainstorm     | Skills-only | 0      | 1+     | No    | 1        |
| refactor       | Skills-only | 0      | 1+     | No    | 1        |

**Agent-based plugins** (23 agents total): tpd, commit, ui-design
**Skills-only plugins** (0 agents): hooks, context-memory, brainstorm, refactor

### Agent Scope Distribution

| Scope   | Count | Agents                                                                                                                                                                                                                                                                                                          |
| ------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| project | 15    | boundary-explorer, context-analyzer, codex-architect, gemini-architect, codex-implementer, gemini-implementer, change-investigator, semantic-analyzer, symbol-analyzer, commit-worker, requirement-analyzer, existing-code-analyzer, design-variant-generator, gemini-prototype-generator, claude-code-refactor |
| user    | 8     | codex-constraint, gemini-constraint, codex-auditor, gemini-auditor, image-analyzer, style-recommender, ux-guideline-checker, quality-validator                                                                                                                                                                  |
| local   | 0     | (none)                                                                                                                                                                                                                                                                                                          |

### Directory Layout (relevant paths)

```
plugins/
  hooks/
    hooks/hooks.json                          # Master hook registry (14 scripts, 7 events)
    scripts/
      security/       privacy-firewall.sh, db-guard.sh, killshell-guard.sh, git-conflict-guard.sh
      optimization/   read-limit.sh
      quality/        auto-format.sh
      logging/        auto-backup.sh, mcp-logger.sh
      permission/     auto-approve.sh, file-permission.sh
      evaluation/     unified-eval.sh
      notification/   smart-notify.sh
      orchestration/  teammate-idle.sh, task-completed.sh
    CLAUDE.md                                 # User-facing hook documentation
  tpd/
    commands/dev.md                           # Agent Teams skeleton at lines 351-387
    agents/{investigation,reasoning,planning,execution}/*.md
  context-memory/
    skills/tech-rules-generator/SKILL.md      # Outputs to .claude/rules/ (collision target)
    skills/claude-updater/SKILL.md            # CLAUDE.md generation logic
    commands/memory.md                        # 16+ subcommands
llmdoc/
  architecture/
    hooks-system.md                           # Claims 5 lifecycle points, 11 hooks
    memory-architecture.md                    # Three-layer system (Hot/Warm/Cold)
    plugin-architecture.md                    # Agent frontmatter spec
  reference/
    hook-scripts.md                           # Claims 11 scripts, 6 categories
  guides/
    how-to-create-a-hook.md                   # Only covers 5 lifecycle points
```

---

## 2. ST-1: tech-rules-generator Output Path

### Current State

**File**: `plugins/context-memory/skills/tech-rules-generator/SKILL.md`

Output location defined at lines 331-339:

```
.claude/rules/
  {stack}.md          # e.g., typescript.md, react.md
  index.json          # Rule index with stack metadata
```

Index schema (lines 343-362):

```json
{
  "rules": [
    { "stack": "typescript", "path": "typescript.md", "generated": "...", "sources": [...] }
  ],
  "last_updated": "..."
}
```

### Consumers

1. `skill-loader` -- referenced at SKILL.md line 387 as downstream consumer
2. Claude Code native `.claude/rules/` auto-loading (platform reads all `.md` files in this dir)

### Migration Target

Per thinking phase clarification (OQ-BLOCK-3): relocate to `.claude/memory/rules/`.

### Files to Modify

| File                                                          | Change                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `plugins/context-memory/skills/tech-rules-generator/SKILL.md` | Update output path references (lines 5, 64, 331-339, 343-362) |
| `llmdoc/architecture/memory-architecture.md`                  | Add tech-rules migration note                                 |
| Consumers of `.claude/rules/{stack}.md`                       | Update read paths                                             |

---

## 3. ST-2: Hook Documentation Drift

### Reality vs Documentation

| Dimension        | Documentation | Reality (hooks.json) | Delta                                                |
| ---------------- | ------------- | -------------------- | ---------------------------------------------------- |
| Lifecycle events | 5             | 7                    | +TeammateIdle, +TaskCompleted                        |
| Script count     | 11            | 14                   | +git-conflict-guard, +teammate-idle, +task-completed |
| Categories       | 6             | 7                    | +orchestration                                       |

### Documentation Files and Their Drift

**`llmdoc/architecture/hooks-system.md`** (60 lines):

- Line 1: "5 hook points" -- should be 7
- Line 10: "11 hooks" -- should be 14
- Lines 19-25: Lifecycle table missing TeammateIdle and TaskCompleted rows
- Line 33: "3-30s" timeout range -- TeammateIdle/TaskCompleted use 5s
- Missing: git-conflict-guard in PreToolUse/Bash listing

**`llmdoc/reference/hook-scripts.md`** (60 lines):

- Line 1: "11 shell scripts" -- should be 14
- Line 1: "5 lifecycle points" -- should be 7
- Line 1: "6 categories" -- should be 7
- Missing sections: Orchestration category (teammate-idle, task-completed)
- Missing from Security table: git-conflict-guard.sh

**`llmdoc/guides/how-to-create-a-hook.md`** (63 lines):

- Line 45: Lists only 5 lifecycle points -- missing TeammateIdle, TaskCompleted
- Line 46: "Use regex matchers" -- orchestration hooks use `*` (wildcard), no regex needed
- Missing: Orchestration hook creation guidance (different input schema)

**`plugins/hooks/CLAUDE.md`**:

- Hook table lists git-conflict-guard but omits: killshell-guard, read-limit, auto-backup, auto-approve, file-permission, smart-notify, teammate-idle, task-completed
- Hook categories table omits: Optimization, Logging, Permission, Notification, Orchestration

### Accurate Hook Registry (from hooks.json)

| #   | Script                | Event             | Matcher                  | Timeout | Async |
| --- | --------------------- | ----------------- | ------------------------ | ------- | ----- |
| 1   | privacy-firewall.sh   | UserPromptSubmit  | `*`                      | 3s      | No    |
| 2   | unified-eval.sh       | UserPromptSubmit  | `*`                      | 10s     | No    |
| 3   | read-limit.sh         | PreToolUse        | `Read`                   | 5s      | No    |
| 4   | db-guard.sh           | PreToolUse        | `Bash`                   | 3s      | No    |
| 5   | git-conflict-guard.sh | PreToolUse        | `Bash`                   | 5s      | No    |
| 6   | killshell-guard.sh    | PreToolUse        | `KillShell`              | 5s      | No    |
| 7   | auto-backup.sh        | PreToolUse        | `Write`                  | 10s     | Yes   |
| 8   | mcp-logger.sh         | PreToolUse        | `mcp__.*`                | 5s      | Yes   |
| 9   | auto-format.sh        | PostToolUse       | `Write\|Edit\|MultiEdit` | 30s     | No    |
| 10  | auto-approve.sh       | PermissionRequest | `Bash`                   | 3s      | No    |
| 11  | file-permission.sh    | PermissionRequest | `Write\|Edit`            | 3s      | No    |
| 12  | smart-notify.sh       | Notification      | `*`                      | 5s      | No    |
| 13  | teammate-idle.sh      | TeammateIdle      | `*`                      | 5s      | No    |
| 14  | task-completed.sh     | TaskCompleted     | `*`                      | 5s      | No    |

---

## 4. ST-3: Orchestration Hook Scripts (Current State)

### teammate-idle.sh (19 lines)

Location: `plugins/hooks/scripts/orchestration/teammate-idle.sh`

```bash
#!/bin/bash
INPUT=$(cat)
LOG_DIR="${HOME}/.claude/logs/hook-events"
mkdir -p "${LOG_DIR}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // empty')
IDLE_SINCE=$(echo "$INPUT" | jq -r '.idle_since // empty')
cat >> "${LOG_DIR}/teammate-idle.jsonl" <<EOF
{"timestamp":"${TIMESTAMP}","teammate":"${TEAMMATE}","idle_since":"${IDLE_SINCE}","raw":$(echo "$INPUT" | jq -c '. // {}')}
EOF
echo '{}'
```

**Gaps vs established convention**:

- Missing `set -euo pipefail`
- Missing color-coded log functions (stderr)
- Missing input validation (no jq empty check)
- No structured `hookSpecificOutput` response
- No schema validation of input payload
- Assumed input fields (`teammate_name`, `idle_since`) not verified against v2.1.33 payload

### task-completed.sh (19 lines)

Location: `plugins/hooks/scripts/orchestration/task-completed.sh`

Same pattern as teammate-idle.sh but extracts `task_id` and `status` fields.

**Identical gaps**: no `set -euo pipefail`, no log functions, no validation, no structured output.

### Reference Pattern: smart-notify.sh (189 lines)

Location: `plugins/hooks/scripts/notification/smart-notify.sh`

Established conventions to replicate:

- `set -euo pipefail` at top
- Color-coded `log_info`, `log_warn`, `log_debug` functions (stderr output)
- `input=$(cat)` then jq extraction
- Async dispatch via background `&` + `disown`
- 6 notification channels (desktop, bark, ntfy, telegram, slack, discord)
- Environment variable configuration (`BARK_KEY`, `NTFY_TOPIC`, etc.)
- `main()` function pattern
- `exit 0` at end

---

## 5. ST-4: /tpd:dev Agent Teams Section

### Current Implementation

**File**: `plugins/tpd/commands/dev.md` (387 lines total)

**Standard Mode** (lines 1-350): Steps 1-7 using `Task()` subagent calls:

- Step 2: context-retriever + codex-implementer (parallel, max 2)
- Step 3: codex-implementer + gemini-implementer (parallel, max 2)
- Step 5: codex-auditor + gemini-auditor (parallel, max 2)

**Agent Teams Section** (lines 351-387):

```
## Agent Teams Mode (Experimental)

When `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set, Steps 3 and 5 are replaced
with an iterative team cycle.

### Activation Check
if [ "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS}" = "1" ]; then TEAM_MODE=true; fi

### Team Cycle (replaces Step 3 + Step 5)
Team: codex-implementer + gemini-implementer + codex-auditor + gemini-auditor
Cycle (max 2 iterations):
  1. Prototype: codex-implementer + gemini-implementer (parallel)
  2. Audit: codex-auditor + gemini-auditor (parallel)
  3. If audit passes -> proceed to Step 4 (refactor)
  4. If audit fails -> fix issues and re-prototype (iteration++)

### Constraints:
- Cross-model mailbox FORBIDDEN
- Max 2 iterations before manual review fallback
- Each model output isolated; synthesis only in Step 4
```

### Gaps in Current Skeleton

1. No explicit `team()` API call syntax (Agent Teams uses a different invocation than `Task()`)
2. No state tracking between iterations (how to pass audit failures back to implementers)
3. No hook integration (TeammateIdle/TaskCompleted events not leveraged)
4. No fallback detection (how to detect env var at runtime in markdown command)
5. No specification of which agent YAML frontmatter fields Agent Teams reads
6. Section is documentation-only -- no actionable pseudo-code for the team dispatch

### Agent Types Used in /tpd:dev

| Agent Type         | Plugin Path                                          | Memory  | Model |
| ------------------ | ---------------------------------------------------- | ------- | ----- |
| codex-implementer  | `plugins/tpd/agents/execution/codex-implementer.md`  | project | opus  |
| gemini-implementer | `plugins/tpd/agents/execution/gemini-implementer.md` | project | opus  |
| codex-auditor      | `plugins/tpd/agents/execution/codex-auditor.md`      | user    | opus  |
| gemini-auditor     | `plugins/tpd/agents/execution/gemini-auditor.md`     | user    | opus  |

---

## 6. ST-5: Memory Architecture Documentation

### Current State

**`llmdoc/architecture/memory-architecture.md`** (57 lines):

- Three-layer table (Hot/Warm/Cold)
- Layer responsibilities with scope distribution
- Interaction rules (4 points)
- Does NOT mention Auto Memory, `.claude/rules/`, or tech-rules migration

**`llmdoc/architecture/plugin-architecture.md`** (relevant excerpt, lines 72-89):

```yaml
# Agent Frontmatter
---
name: agent-name
description: "Agent purpose"
tools: [Read, Bash, mcp__auggie-mcp__codebase-retrieval]
memory: project # user | project
model: sonnet
color: cyan
---
```

- Documents `memory: user` and `memory: project` scope definitions
- Does NOT mention Auto Memory `.claude/rules/` path or MEMORY.md 200-line cap

### What Needs Adding

1. Auto Memory integration with Hot layer (`.claude/rules/` = Auto Memory exclusive)
2. tech-rules-generator migration from `.claude/rules/` to `.claude/memory/rules/`
3. MEMORY.md 200-line cap and topic file linking strategy
4. Ownership boundary: CLAUDE.md = context-memory, MEMORY.md = Auto Memory
5. Agent Teams interaction with agent memory (open question, document as TBD)

---

## 7. Architecture Patterns

### Agent Frontmatter Convention

All 23 agents use this YAML frontmatter schema:

```yaml
---
name: <kebab-case>
description: "<one-line purpose>"
tools:
  - <tool-name> # Read, Write, Bash, Skill, mcp__*, LSP, Glob, Grep
memory: <scope> # project | user (never local)
model: <model> # opus (tpd) | sonnet (commit, ui-design)
color: <color> # cyan, yellow, magenta, etc.
---
```

Model assignment convention:

- tpd agents: all use `model: opus`
- commit agents: all use `model: sonnet`
- ui-design agents: all use `model: sonnet`

### Hook Script Convention

Established pattern from `smart-notify.sh` and `git-conflict-guard.sh`:

```bash
#!/bin/bash
# Header: name, lifecycle, description, version
set -euo pipefail

# Color-coded log functions
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log_info()  { echo -e "${GREEN}[HOOK-NAME]${NC} $1" >&2; }
log_warn()  { echo -e "${YELLOW}[HOOK-NAME]${NC} $1" >&2; }
log_error() { echo -e "${RED}[HOOK-NAME]${NC} $1" >&2; }

# Read input
input=$(cat)

# Parse with jq
field=$(echo "$input" | jq -r '.field_name // empty')

# Logic + async dispatch via & + disown
# ...

# JSON output to stdout
echo '{"hookSpecificOutput": {...}}'
exit 0
```

### Hook JSON Protocol

**Input (stdin)**: `{ "tool_name": "...", "tool_input": {...}, "prompt": "..." }`

**Output types**:

- Block: `{"decision": "block", "reason": "..."}`
- Modify: `{"hookSpecificOutput": {"updatedInput": {...}, "additionalContext": "..."}}`
- Permission: `{"hookSpecificOutput": {"decision": {"behavior": "allow"}}}`
- Pass-through: `{}` or exit 0 with no output

**Orchestration hook output (to be designed)**: unknown -- TeammateIdle/TaskCompleted may accept different response schemas.

### Plugin 4-Layer Architecture

```
Commands (slash commands)  ->  Agents (Task subagents)  ->  Skills (atomic ops)
                                     |
                                Hooks (lifecycle interception, cross-cutting)
```

### Multi-Phase Data Flow (TPD)

```
THINKING -> handoff.json, synthesis.md, clarifications.md, boundaries.json
    |
PLAN -> architecture.md, constraints.md, pbt.md, risks.md, context.md, tasks.md
    |
DEV -> implements using all above artifacts
```

---

## 8. Integration Points

### APIs / Invocation Patterns

| Pattern       | Syntax                                             | Used By                         |
| ------------- | -------------------------------------------------- | ------------------------------- |
| Task subagent | `Task(subagent_type="plugin:category:agent", ...)` | tpd, commit, ui-design commands |
| Skill call    | `Skill(skill="plugin:skill-name", args="...")`     | All plugins                     |
| Hook trigger  | Automatic via hooks.json lifecycle events          | hooks plugin                    |
| Agent Teams   | `team()` API (experimental, requires env var)      | /tpd:dev only (planned)         |

### Data Stores

| Store                  | Path                               | Owner                   | Purpose                 |
| ---------------------- | ---------------------------------- | ----------------------- | ----------------------- |
| Agent Memory (project) | `.claude/agent-memory/<name>/`     | Claude Code platform    | Per-agent MEMORY.md     |
| Agent Memory (user)    | `~/.claude/agent-memory/<name>/`   | Claude Code platform    | Cross-project MEMORY.md |
| Auto Memory rules      | `.claude/rules/`                   | Claude Code Auto Memory | Path-scoped rules       |
| Tech rules (current)   | `.claude/rules/{stack}.md`         | tech-rules-generator    | COLLISION               |
| Tech rules (target)    | `.claude/memory/rules/{stack}.md`  | tech-rules-generator    | Migration target        |
| Workflow memory        | `.claude/memory/workflows/`        | workflow-memory skill   | Session state           |
| Session snapshots      | `.claude/memory/sessions/`         | session-compactor skill | MCP-based               |
| Hook event logs        | `~/.claude/logs/hook-events/`      | orchestration hooks     | JSONL append            |
| Run artifacts          | `openspec/changes/<id>/artifacts/` | TPD workflow            | Per-phase outputs       |

### Cross-Plugin Dependencies

```
hooks plugin
  <- consumed by: all 7 plugins (hooks.json loaded globally)
  -> depends on: jq (JSON parsing in scripts)

context-memory plugin
  -> owns: CLAUDE.md generation (claude-updater skill)
  -> owns: tech-rules at .claude/rules/ (migrating to .claude/memory/rules/)
  -> conflicts with: Auto Memory at .claude/rules/

tpd plugin
  -> uses: hooks (TeammateIdle/TaskCompleted for Agent Teams awareness)
  -> uses: context-memory (plan-context.md reuse)
```

---

## 9. Tech Stack

| Category        | Items                                                            |
| --------------- | ---------------------------------------------------------------- |
| Languages       | Bash (hooks, scripts), Markdown (commands, agents, skills, docs) |
| Frameworks      | Claude Code CLI plugin system, OpenSpec proposal system          |
| Tools           | jq (JSON), git, osascript/notify-send, curl (notifications)      |
| Platform        | Claude Code v2.1.33+, Agent Teams (Research Preview)             |
| External models | Codex CLI, Gemini CLI (via codeagent-wrapper)                    |
| MCP             | auggie-mcp (codebase retrieval), gemini MCP, core_memory         |

---

## 10. Thinking Phase Artifacts Consumed

| Artifact               | Path                                        | Key Data Carried Forward                                                    |
| ---------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| handoff.json           | `artifacts/thinking/handoff.json`           | 5 sub-tasks, 8 hard constraints, 6 soft constraints, success criteria       |
| synthesis.md           | `artifacts/thinking/synthesis.md`           | Cross-boundary constraint set, dependency table, risk matrix                |
| clarifications.md      | `artifacts/thinking/clarifications.md`      | 3 user decisions: actionable hooks, migrate tech-rules, layered coexistence |
| boundaries.json        | `artifacts/thinking/boundaries.json`        | 4 context boundaries defined                                                |
| conclusion.md          | `artifacts/thinking/conclusion.md`          | 7-step reasoning chain, confidence analysis, assumption risks               |
| complexity-analysis.md | `artifacts/thinking/complexity-analysis.md` | Complexity score 7.3/10, recommended depth: ultra                           |

---

## 11. Key Constraints for Plan Phase

### From Thinking (verified against codebase)

| ID   | Constraint                                                      | Verified                                                             |
| ---- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| HC-1 | `.claude/rules/` namespace collision -- tech-rules must migrate | Yes: SKILL.md lines 331-339 output to `.claude/rules/`               |
| HC-2 | Skills cannot use memory frontmatter                            | Yes: SKILL.md has no `memory` field; only agent `.md` files do       |
| HC-3 | Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`   | Yes: dev.md lines 358-362 check this var                             |
| HC-4 | Hook 5s timeout ceiling                                         | Yes: hooks.json lines 132, 145 set `"timeout": 5`                    |
| HC-5 | MEMORY.md 200-line cap                                          | Yes: memory-architecture.md line 9 says "200-line cap"               |
| HC-6 | Cross-model mailbox prohibition                                 | Yes: dev.md line 380 states forbidden                                |
| HC-7 | Backward compatibility required                                 | Yes: dev.md lines 384-386 "Zero behavior change" for default         |
| HC-8 | CLAUDE.md ownership singular                                    | Yes: claude-updater skill owns generation; Auto Memory for MEMORY.md |

### Documentation Drift (precise delta)

| Document                | Claims                             | Reality                            | Specific Lines |
| ----------------------- | ---------------------------------- | ---------------------------------- | -------------- |
| hooks-system.md         | 5 lifecycle points                 | 7                                  | Lines 1, 19-25 |
| hooks-system.md         | 11 hooks                           | 14                                 | Line 10        |
| hook-scripts.md         | 11 scripts, 5 points, 6 categories | 14 scripts, 7 points, 7 categories | Lines 1, 5     |
| how-to-create-a-hook.md | 5 lifecycle points                 | 7                                  | Line 45        |
| hooks CLAUDE.md         | 7 hooks listed                     | 14 exist                           | Table rows     |
| project-overview.md     | 5 lifecycle points                 | 7                                  | Line 97        |
| plugin-system.md        | 5 lifecycle points                 | 7                                  | Line 15        |

---

## 12. Open Questions Remaining

1. **OQ-BLOCK-2** (unresolved): Exact JSON payload schema for TeammateIdle/TaskCompleted events. Current scripts assume `teammate_name`/`idle_since` and `task_id`/`status` respectively, but these are unverified.
2. **OQ-DESIGN-3** (unresolved): What does `matcher` field match against for orchestration events? Current hooks.json uses `"*"` (wildcard) for both.
3. **OQ-FUTURE-3** (deferred): How Agent memory interacts with Agent Teams teammates.
