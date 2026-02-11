# Integrate Claude Code v2.1.33 Features - Backend Technical Planning

## Metadata

- Proposal ID: integrate-cc-v2133-features
- Created: 2026-02-06T17:30:00Z
- Planner: Codex (Architect Mode)
- Thinking Phase: Consumed (handoff.json, synthesis.md, clarifications.md, boundaries.json)
- Confidence: Medium-High (8.0/10)

---

## 1. Requirement Understanding

### 1.1 Functionality Boundaries

The integration spans 5 sub-tasks across 3 concern areas: memory path isolation, hook system enhancement, and Agent Teams refinement. The scope is narrower than "integrate everything into all plugins" because agent memory is already deployed (23/23 agents) and 4 skills-only plugins are structurally excluded from agent-level features.

**Sub-Task Dependency Graph:**

```
ST-1 (path migration) ─────→ ST-2 (doc reconciliation) ─────→ ST-3 (hook enhancement) ─→ ST-5 (memory docs)
                                                        ─────→ ST-4 (Agent Teams)       ─→ ST-5
```

**Affected Layers:**

| Layer    | Components                                                | Sub-Tasks  |
| -------- | --------------------------------------------------------- | ---------- |
| Scripts  | teammate-idle.sh, task-completed.sh                       | ST-3       |
| Config   | hooks.json, SKILL.md, index.json                          | ST-1, ST-3 |
| Commands | dev.md (Agent Teams section)                              | ST-4       |
| Docs     | hooks-system.md, hook-scripts.md, how-to-create-a-hook.md | ST-2       |
| Docs     | memory-architecture.md, plugin-architecture.md, CLAUDE.md | ST-5       |

### 1.2 Technical Constraints

From thinking phase synthesis (8 hard constraints, 6 soft constraints). The following constraints directly drive architecture decisions:

| ID   | Constraint                                          | Architecture Impact                                    |
| ---- | --------------------------------------------------- | ------------------------------------------------------ |
| HC-1 | .claude/rules/ exclusively owned by Auto Memory     | tech-rules-generator path rewrite required             |
| HC-4 | 5s timeout ceiling for hook scripts                 | Async-only for non-trivial work; jq parse must be fast |
| HC-7 | Backward compat across all 7 plugins                | Feature flag gating on every new behavior              |
| HC-3 | Agent Teams requires experimental env var           | Dual-path execution in dev.md                          |
| HC-6 | Cross-model mailbox prohibited                      | Agent Teams topology constrained to same-model tracks  |
| HC-8 | CLAUDE.md = context-memory, MEMORY.md = Auto Memory | No overlap in write targets                            |

### 1.3 Questions to Clarify

All 3 blocking questions from thinking phase are resolved via user clarifications:

1. **Hook return semantics** -- Resolved: Assume actionable, degrade to logging if observation-only.
2. **Path collision** -- Resolved: Migrate tech-rules to `.claude/memory/rules/`.
3. **CLAUDE.md ownership** -- Resolved: Layered coexistence (context-memory = CLAUDE.md, Auto Memory = MEMORY.md).

Remaining non-blocking unknowns:

- Exact JSON payload schema for TeammateIdle/TaskCompleted (needs empirical test)
- Matcher field semantics for orchestration events
- Agent memory interaction with Agent Teams teammates

---

## 2. Codebase Context

### 2.1 Related Modules

**Hook System (plugins/hooks/):**

| File                                      | Lines | Current State                                                         |
| ----------------------------------------- | ----- | --------------------------------------------------------------------- |
| `hooks/hooks.json`                        | 151   | 7 events, 13 scripts registered; TeammateIdle/TaskCompleted at bottom |
| `scripts/orchestration/teammate-idle.sh`  | 19    | Skeleton: cat stdin, jq extract, JSONL append, echo '{}'              |
| `scripts/orchestration/task-completed.sh` | 19    | Skeleton: identical pattern to teammate-idle.sh                       |
| `scripts/notification/smart-notify.sh`    | 189   | Production-grade: set -euo, color logging, async dispatch, 6 channels |
| `scripts/security/git-conflict-guard.sh`  | 97    | Reference pattern: set -euo, jq parse, structured hookSpecificOutput  |
| `scripts/security/db-guard.sh`            | 40+   | Reference pattern: tool_use_id extraction, uppercase normalize        |
| `scripts/security/privacy-firewall.sh`    | 30+   | Reference pattern: prompt extraction, regex matching                  |

**Tech-Rules Generator (plugins/context-memory/):**

| File                                   | Current Path Reference     |
| -------------------------------------- | -------------------------- |
| `skills/tech-rules-generator/SKILL.md` | `.claude/rules/{stack}.md` |
| Output: `{stack}.md` files             | `.claude/rules/`           |
| Output: `index.json`                   | `.claude/rules/index.json` |

**TPD Dev Command (plugins/tpd/):**

| File              | Lines   | Relevant Section                                  |
| ----------------- | ------- | ------------------------------------------------- |
| `commands/dev.md` | 351-387 | Agent Teams Mode (Experimental) section           |
| `CLAUDE.md`       | Full    | Plugin metadata; no Agent Teams mention currently |

### 2.2 Existing Patterns

**Hook Script Convention** (derived from git-conflict-guard.sh, smart-notify.sh, db-guard.sh):

```
1. Shebang + header comment block (name, lifecycle, description, version)
2. set -euo pipefail
3. Color-coded logging functions (RED/YELLOW/GREEN + NC, logging to stderr)
4. input=$(cat) for stdin consumption
5. jq extraction of relevant fields
6. Guard clause: if input is empty/irrelevant, echo '{}' and exit 0
7. Business logic
8. Structured JSON output to stdout
9. exit 0
```

**hookSpecificOutput Protocol** (from codebase):

- Blocker: `{"hookSpecificOutput": {"permissionDecision": "deny", "permissionDecisionReason": "..."}}`
- Modifier: `{"hookSpecificOutput": {"updatedInput": {...}, "additionalContext": "..."}}`
- Permission: `{"hookSpecificOutput": {"decision": {"behavior": "allow"}}}`
- Informational: `{"hookSpecificOutput": {"message": "..."}}`
- Pass-through: `{}`

**JSONL Logging Pattern** (from current skeletons):

```bash
cat >> "${LOG_DIR}/event-name.jsonl" <<EOF
{"timestamp":"${TIMESTAMP}","field":"${VALUE}","raw":$(echo "$INPUT" | jq -c '. // {}')}
EOF
```

### 2.3 Dependencies

| Dependency          | Source         | Required For           | Fallback                     |
| ------------------- | -------------- | ---------------------- | ---------------------------- |
| jq                  | System package | All hook scripts       | None (hard requirement)      |
| date -u             | coreutils      | Timestamp generation   | None (universally available) |
| mkdir -p            | coreutils      | Log directory creation | None (universally available) |
| curl                | System package | smart-notify dispatch  | Desktop notification only    |
| Agent Teams env var | User config    | /tpd:dev team mode     | Task subagent fallback       |

---

## 3. Architecture Solution

### 3.1 Solution Comparison

#### Area 1: Hook Script Enhancement Architecture

**Solution A: Monolithic Enhancement**

Each hook script handles input validation, logging, orchestration directives, and metrics in a single file.

- Pros: Simple deployment (1 file per hook), no shared dependencies
- Cons: Code duplication between teammate-idle.sh and task-completed.sh; validation logic repeated
- Effort: Low
- Risk: Maintenance burden grows with each new orchestration hook

**Solution B: Shared Library + Specialized Scripts**

Extract common functions (input validation, structured logging, output formatting) into a shared library (`scripts/orchestration/_lib.sh`), sourced by each hook script.

- Pros: DRY; consistent validation across hooks; easy to add new orchestration events
- Cons: Additional file (shared lib); source path must be resolved relative to CLAUDE_PLUGIN_ROOT
- Effort: Medium
- Risk: Library sourcing adds ~10ms startup overhead (negligible vs 5s budget)

**Recommended: Solution A (Monolithic Enhancement)**

Rationale: Only 2 orchestration hooks exist. The shared code surface is limited to ~15 lines of validation/logging boilerplate. A shared library is premature abstraction at this scale. If a third orchestration hook is added in the future, refactor to Solution B at that point.

#### Area 2: Tech-Rules Migration Strategy

**Solution A: Path Update Only**

Change the output path string in SKILL.md from `.claude/rules/` to `.claude/memory/rules/`. Update index.json path references.

- Pros: Minimal change; clear ownership boundary
- Cons: Existing `.claude/rules/` files from previous runs remain (orphaned)
- Effort: Low
- Risk: Users with existing tech-rules output in `.claude/rules/` must manually clean up

**Solution B: Path Update + Migration Script**

Same as A, plus add a one-time migration check at the start of tech-rules-generator that moves existing files from `.claude/rules/{stack}.md` to `.claude/memory/rules/{stack}.md`.

- Pros: Clean transition; no orphaned files
- Cons: Migration logic adds complexity to a skill that should be stateless
- Effort: Medium
- Risk: Migration could interfere with Auto Memory files if both exist

**Recommended: Solution A (Path Update Only)**

Rationale: tech-rules-generator is a skill invoked on-demand (`/memory tech-rules <stack>`). Existing output is regenerated on next invocation. Orphaned files in `.claude/rules/` will be managed by Auto Memory or manually cleaned. Adding migration logic to a stateless skill violates its design principle.

#### Area 3: Agent Teams Integration Architecture

**Solution A: Inline Feature Detection**

Keep the current inline bash check in dev.md (lines 358-362) and expand it with state tracking variables and error handling directly in the markdown pseudocode.

- Pros: All logic visible in one file; easy to audit
- Cons: dev.md grows significantly; mixing orchestration logic with workflow documentation
- Effort: Low
- Risk: dev.md becomes harder to maintain

**Solution B: Structured State Machine**

Define a state machine in dev.md with explicit states (DETECT -> INIT_TEAM -> PROTOTYPE -> AUDIT -> ITERATE_OR_FALLBACK -> COMPLETE), tracked via a JSON state file in `${DEV_DIR}/team-state.json`.

- Pros: Recoverable from interruption; explicit state transitions; iteration metrics recorded
- Cons: Higher complexity; state file management overhead
- Effort: Medium
- Risk: State file corruption could block workflow

**Recommended: Solution B (Structured State Machine)**

Rationale: Agent Teams is an experimental feature with known instability (Research Preview). A state machine enables: (1) recovery from mid-cycle interruptions, (2) metrics on iteration count for empirical evaluation of Agent Teams vs Task subagents, (3) clear audit trail for debugging team failures. The state file is lightweight JSON (~10 fields) and aligns with the existing `state.json` pattern used in thinking phase.

#### Area 4: Backward Compatibility Strategy

**Solution A: Per-Feature Env Var Gating**

Each new behavior checks its own env var (e.g., `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` for teams, `CCG_HOOK_ORCHESTRATION_DIRECTIVES` for hook directives).

- Pros: Fine-grained control; each feature independently toggleable
- Cons: Env var proliferation; user configuration burden increases
- Effort: Medium
- Risk: Users confused by multiple env vars

**Solution B: Platform Version Detection + Single Feature Flag**

Hook scripts detect Claude Code version from the input JSON payload (if available) or from the presence of TeammateIdle/TaskCompleted events (they only fire on v2.1.33+). Agent Teams uses the existing env var. No new env vars introduced.

- Pros: Zero new env vars for hooks (event existence = implicit feature gate); single env var for Agent Teams (already required by platform)
- Cons: Version detection may not be reliable across all Claude Code builds
- Effort: Low
- Risk: If Claude Code removes events, hooks simply never fire (safe degradation)

**Recommended: Solution B (Platform Version Detection + Single Feature Flag)**

Rationale: TeammateIdle/TaskCompleted hooks only fire when Agent Teams is active (they are orchestration events). The event's existence IS the feature gate -- no additional env var needed. For Agent Teams in dev.md, the platform already requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Adding more env vars contradicts the goal of zero-config backward compatibility (HC-7).

### 3.2 Recommended Solution

Combined architecture across all 4 areas:

```
                    ┌─────────────────────────────────────────────┐
                    │           Backward Compatibility Layer       │
                    │  Event existence = implicit feature gate     │
                    │  AGENT_TEAMS env var = explicit opt-in       │
                    └─────────────┬───────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐
│  ST-1: Path      │  │  ST-3: Hook Scripts  │  │  ST-4: Agent Teams  │
│  Migration       │  │  (Monolithic)        │  │  (State Machine)    │
│                  │  │                      │  │                     │
│  .claude/rules/  │  │  teammate-idle.sh    │  │  DETECT state       │
│       ↓          │  │  task-completed.sh   │  │  INIT_TEAM state    │
│  .claude/memory/ │  │                      │  │  PROTOTYPE state    │
│    rules/        │  │  Convention:         │  │  AUDIT state        │
│                  │  │  set -euo pipefail   │  │  ITERATE state      │
│  index.json      │  │  jq validation       │  │  COMPLETE state     │
│  path updated    │  │  structured logging  │  │  FALLBACK state     │
│                  │  │  hookSpecificOutput  │  │                     │
│                  │  │  async background    │  │  team-state.json    │
└──────────────────┘  └──────────────────────┘  └─────────────────────┘
```

### 3.3 Decision Rationale

| Decision                | Chosen             | Rejected        | Key Factor                                                |
| ----------------------- | ------------------ | --------------- | --------------------------------------------------------- |
| Hook enhancement        | Monolithic (A)     | Shared lib (B)  | Only 2 hooks; shared lib is premature abstraction         |
| Tech-rules migration    | Path update (A)    | With script (B) | Skill is stateless; migration logic violates design       |
| Agent Teams integration | State machine (B)  | Inline (A)      | Experimental feature needs recovery + metrics             |
| Backward compat         | Version detect (B) | Per-feature (A) | Event existence is natural feature gate; no env var bloat |

---

## 4. Technical Specs

### 4.1 Hook Script Enhancement (ST-3)

#### 4.1.1 teammate-idle.sh Target Architecture

**Input Schema (expected from Claude Code v2.1.33):**

```json
{
  "session_id": "string",
  "hook_event_name": "TeammateIdle",
  "teammate_name": "string",
  "idle_since": "ISO8601 timestamp",
  "agent_type": "string (optional)",
  "team_id": "string (optional)"
}
```

**Processing Pipeline:**

```
stdin → jq validation → field extraction → structured JSONL logging → orchestration directive → stdout
         (< 50ms)        (< 10ms)          (< 100ms, async)          (< 10ms)
```

**Output Schema (hookSpecificOutput):**

```json
{
  "hookSpecificOutput": {
    "orchestrationDirective": {
      "action": "suggest_reassign",
      "teammate": "<teammate_name>",
      "idleDuration": "<calculated_seconds>",
      "context": "Teammate has been idle since <idle_since>. Consider assigning pending tasks."
    },
    "metrics": {
      "event": "teammate_idle",
      "teammate": "<teammate_name>",
      "idle_since": "<idle_since>",
      "processed_at": "<timestamp>"
    }
  }
}
```

**Degradation Behavior:** If hookSpecificOutput is not consumed by the platform, the structured log in `~/.claude/logs/hook-events/teammate-idle.jsonl` still provides full observability. The orchestration directive becomes informational metadata only.

**Script Structure:**

```
Line 1-10:   Header (shebang, comment block, set -euo pipefail)
Line 11-16:  Color logging functions (stderr)
Line 17-18:  input=$(cat)
Line 19-28:  Schema validation (jq type checks; exit with {} on invalid)
Line 29-35:  Field extraction
Line 36-45:  JSONL logging (append to teammate-idle.jsonl)
Line 46-55:  Idle duration calculation + orchestration directive
Line 56-65:  Structured JSON output
Line 66:     exit 0
```

**Estimated size:** ~65 lines (3.4x current 19-line skeleton)

#### 4.1.2 task-completed.sh Target Architecture

**Input Schema (expected from Claude Code v2.1.33):**

```json
{
  "session_id": "string",
  "hook_event_name": "TaskCompleted",
  "task_id": "string",
  "task_name": "string (optional)",
  "status": "completed|failed|cancelled",
  "agent_id": "string (optional)",
  "team_id": "string (optional)",
  "timestamp": "ISO8601 timestamp (optional)"
}
```

**Output Schema (hookSpecificOutput):**

```json
{
  "hookSpecificOutput": {
    "orchestrationDirective": {
      "action": "task_tracked",
      "taskId": "<task_id>",
      "status": "<status>",
      "context": "Task <task_id> completed with status <status>. Check dependent tasks."
    },
    "metrics": {
      "event": "task_completed",
      "task_id": "<task_id>",
      "status": "<status>",
      "processed_at": "<timestamp>"
    }
  }
}
```

**Additional Feature: Log Rotation**

```bash
# Retain 7 days of logs, max 1000 entries per file
LOG_FILE="${LOG_DIR}/task-completed.jsonl"
if [ -f "$LOG_FILE" ]; then
  LINE_COUNT=$(wc -l < "$LOG_FILE")
  if [ "$LINE_COUNT" -gt 1000 ]; then
    tail -500 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  fi
fi
```

**Estimated size:** ~75 lines (3.9x current 19-line skeleton)

#### 4.1.3 hooks.json Verification

Current TeammateIdle/TaskCompleted config is correct. No changes needed:

```json
"TeammateIdle": [{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": "${CLAUDE_PLUGIN_ROOT}/scripts/orchestration/teammate-idle.sh",
    "timeout": 5
  }]
}]
```

Decision: Keep `async: false` (default). These hooks produce orchestration directives that may be consumed by the platform. Making them async would prevent return value consumption. The processing pipeline completes within ~200ms, well under the 5s budget.

#### 4.1.4 Input Validation Pattern

Standard validation gate for all orchestration hooks:

```bash
# Validate JSON input
if ! echo "$input" | jq empty 2>/dev/null; then
  log_warn "Invalid JSON input, skipping"
  echo '{}'
  exit 0
fi

# Validate required fields
hook_event=$(echo "$input" | jq -r '.hook_event_name // empty')
if [ -z "$hook_event" ]; then
  log_warn "Missing hook_event_name, skipping"
  echo '{}'
  exit 0
fi
```

This pattern ensures: (1) malformed input does not crash the script, (2) missing fields are logged and gracefully skipped, (3) the hook never blocks the platform due to validation failures.

### 4.2 Data Model: Tech-Rules Migration (ST-1)

#### 4.2.1 Path Change Matrix

| Artifact       | Current Path                   | New Path                          |
| -------------- | ------------------------------ | --------------------------------- |
| Stack rules    | `.claude/rules/{stack}.md`     | `.claude/memory/rules/{stack}.md` |
| Rule index     | `.claude/rules/index.json`     | `.claude/memory/rules/index.json` |
| Output dir ref | SKILL.md line 64, 126, 332-338 | Same lines, updated path          |

#### 4.2.2 SKILL.md Changes Required

3 sections in `plugins/context-memory/skills/tech-rules-generator/SKILL.md` reference the output path:

1. **Line 64** (Execution Flow step 5): `5. 输出到 .claude/rules/` -> `5. 输出到 .claude/memory/rules/`
2. **Line 126** (Output Format header): `### .claude/rules/{stack}.md` -> `### .claude/memory/rules/{stack}.md`
3. **Lines 332-338** (Output Location block):
   ```
   .claude/memory/rules/
   ├── typescript.md
   ├── react.md
   ├── nestjs.md
   └── index.json
   ```
4. **Lines 344-361** (index.json example): Update `"path"` field values to reflect new base directory

#### 4.2.3 index.json Schema (unchanged structure, updated paths)

```json
{
  "rules": [
    {
      "stack": "typescript",
      "path": "typescript.md",
      "generated": "2024-01-20T08:00:00Z",
      "sources": ["official", "eslint-config"]
    }
  ],
  "last_updated": "2024-01-20T08:00:00Z"
}
```

The `path` field remains relative (not absolute) -- it is relative to the containing directory. No change needed to the JSON structure itself, only to the SKILL.md documentation that describes the directory location.

#### 4.2.4 Consumer Impact

Consumers that read from `.claude/rules/{stack}.md` must be updated. Based on codebase exploration, the primary consumer is the skill-loader reference in SKILL.md line 387:

```
└── 输出规则供 Claude 会话使用
    └── 可被 skill-loader 加载到上下文
```

This is a documentation reference, not executable code. The actual consumption path is Claude Code's native `.claude/rules/` directory scanning. After migration, tech-rules output at `.claude/memory/rules/` will NOT be auto-scanned by Claude Code's rules system (which only reads `.claude/rules/`). This is intentional -- tech-rules are loaded via the skill-loader mechanism, not the native rules system.

#### 4.2.5 Ownership Boundary Post-Migration

```
.claude/
├── rules/                    # EXCLUSIVE: Auto Memory (Claude Code native)
│   └── *.md                  # Path-scoped rules with frontmatter
├── memory/
│   └── rules/                # EXCLUSIVE: tech-rules-generator
│       ├── {stack}.md
│       └── index.json
├── agent-memory/             # EXCLUSIVE: Agent Memory (per-agent MEMORY.md)
│   └── {agent-name}/
└── CLAUDE.md                 # EXCLUSIVE: context-memory plugin
```

### 4.3 Agent Teams Integration (ST-4)

#### 4.3.1 Feature Flag Detection

```bash
# In dev.md pseudocode
TEAM_MODE=false
if [ "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-}" = "1" ]; then
  TEAM_MODE=true
fi
```

The `:-` parameter expansion ensures unset variables default to empty string (no error under `set -u`).

#### 4.3.2 State Machine Design

**States:**

| State     | Description                                      | Next States                  |
| --------- | ------------------------------------------------ | ---------------------------- |
| DETECT    | Check env var, determine mode                    | INIT_TEAM or FALLBACK        |
| INIT_TEAM | Initialize team with 4 agents                    | PROTOTYPE                    |
| PROTOTYPE | codex + gemini implementers produce prototypes   | AUDIT                        |
| AUDIT     | codex + gemini auditors review prototypes        | COMPLETE or ITERATE          |
| ITERATE   | Fix issues from audit, increment counter         | PROTOTYPE (if iteration < 2) |
| COMPLETE  | Team cycle succeeded                             | (terminal)                   |
| FALLBACK  | Team mode unavailable or max iterations exceeded | (terminal, use Task pattern) |

**team-state.json Schema:**

```json
{
  "mode": "team|task",
  "state": "DETECT|INIT_TEAM|PROTOTYPE|AUDIT|ITERATE|COMPLETE|FALLBACK",
  "iteration": 0,
  "max_iterations": 2,
  "started_at": "ISO8601",
  "last_transition": "ISO8601",
  "agents": {
    "codex-implementer": { "status": "idle|working|done|failed" },
    "gemini-implementer": { "status": "idle|working|done|failed" },
    "codex-auditor": { "status": "idle|working|done|failed" },
    "gemini-auditor": { "status": "idle|working|done|failed" }
  },
  "audit_results": {
    "critical_issues": 0,
    "warnings": 0,
    "passed": false
  },
  "fallback_reason": null
}
```

#### 4.3.3 Fallback Triggers

The state machine transitions to FALLBACK under any of these conditions:

1. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is not set to `1`
2. Iteration counter exceeds `max_iterations` (2)
3. Agent initialization fails (team creation error)
4. Any agent fails with an unrecoverable error
5. Audit produces critical issues after max iterations

On FALLBACK, execution resumes with the standard Task subagent pattern (Steps 3 and 5 from dev.md).

#### 4.3.4 dev.md Section Refinement

The current Agent Teams section (lines 351-387) needs these additions:

1. **State file initialization** at DETECT phase
2. **Iteration counter** with max=2 guard
3. **Error recovery** with FALLBACK transition
4. **Metrics output** recording team mode performance for A/B comparison
5. **Cross-model isolation enforcement** (already present, reinforce)

**Proposed dev.md Agent Teams section structure:**

```markdown
## Agent Teams Mode (Experimental)

### Prerequisites

- Claude Code v2.1.33+
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable

### Activation Check

[env var detection with :-default]

### State Tracking

[team-state.json initialization and management]

### Team Cycle (replaces Step 3 + Step 5)

[State machine: PROTOTYPE -> AUDIT -> ITERATE_OR_COMPLETE]

### Constraints

[Cross-model isolation, max iterations, timeout]

### Fallback

[Conditions and graceful transition to Task subagent mode]

### Default Mode

[Zero behavior change from baseline when env var unset]
```

#### 4.3.5 Hooks CLAUDE.md Update

Add to the `<available-hooks>` table in `plugins/hooks/CLAUDE.md`:

| Hook           | Lifecycle     | Description                             |
| -------------- | ------------- | --------------------------------------- |
| teammate-idle  | TeammateIdle  | Orchestration: idle teammate detection  |
| task-completed | TaskCompleted | Orchestration: task completion tracking |

### 4.4 Security Strategy

#### 4.4.1 Input Validation

All hook scripts MUST validate stdin JSON before processing:

1. `jq empty` check -- reject malformed JSON silently
2. Required field presence check -- log warning and return `{}` on missing fields
3. No shell interpolation of untrusted input -- always use `jq -r` for extraction, never `eval`

#### 4.4.2 Log File Safety

- Log directory: `~/.claude/logs/hook-events/` (user-writable, not project-writable)
- Append-only writes (`>>`) -- no truncation during normal operation
- Log rotation: tail-based truncation at 1000 entries (task-completed.sh only)
- Raw input stored as `jq -c` compressed JSON -- preserves exact input for debugging

#### 4.4.3 Path Isolation

Post-migration ownership is exclusive:

| Path                    | Owner                | Write Protection                                |
| ----------------------- | -------------------- | ----------------------------------------------- |
| `.claude/rules/`        | Auto Memory          | tech-rules-generator MUST NOT write here        |
| `.claude/memory/rules/` | tech-rules-generator | Auto Memory does not write to `.claude/memory/` |
| `.claude/agent-memory/` | Agent Memory system  | Only memory-enabled agents write here           |
| CLAUDE.md               | context-memory       | Auto Memory MUST NOT modify                     |
| Agent MEMORY.md         | Auto Memory          | context-memory MUST NOT modify                  |

### 4.5 Performance

#### 4.5.1 Hook Script Timing Budget

Total budget: 5000ms per hook invocation.

| Phase                 | Budget    | Implementation                          |
| --------------------- | --------- | --------------------------------------- |
| JSON parse + validate | 50ms      | Single `jq empty` + field extraction    |
| Field extraction      | 10ms      | 2-4 `jq -r` calls                       |
| JSONL logging         | 100ms     | Single file append (not fsync)          |
| Log rotation check    | 50ms      | `wc -l` + conditional tail (async-safe) |
| Output generation     | 10ms      | cat heredoc with interpolation          |
| **Total**             | **220ms** | 4780ms headroom                         |

#### 4.5.2 Optimization Decisions

1. **No network calls in hooks** -- All orchestration directives are local JSON output. Network dispatch (if needed) is delegated to smart-notify.sh pattern with background processes.
2. **No fsync on log writes** -- Append-only JSONL writes are crash-safe enough for observability logs.
3. **jq -c for raw storage** -- Compact JSON reduces log file size by ~40% vs pretty-printed.
4. **No subshell spawning** -- All logic uses built-in bash + jq. No `$(command)` chains that fork processes.

---

## 5. Implementation Path

### 5.1 Phases

| Phase | Sub-Tasks  | Description                               | Effort |
| ----- | ---------- | ----------------------------------------- | ------ |
| 1     | ST-1       | Path migration (unblocks all others)      | Small  |
| 2     | ST-2       | Documentation reconciliation              | Small  |
| 3     | ST-3, ST-4 | Hook enhancement + Agent Teams (parallel) | Medium |
| 4     | ST-5       | Memory architecture documentation         | Small  |

### 5.2 Tasks

#### Phase 1: ST-1 -- Migrate tech-rules-generator output path

| #   | File                                                          | Change Description                                                  |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | `plugins/context-memory/skills/tech-rules-generator/SKILL.md` | Replace `.claude/rules/` with `.claude/memory/rules/` (4 locations) |
| 2   | Consumer references (if any in other skills)                  | Update path references                                              |
| 3   | `llmdoc/architecture/memory-architecture.md`                  | Add ownership boundary documentation                                |

**Test:** After running `/memory tech-rules typescript`, verify output lands in `.claude/memory/rules/typescript.md` and `.claude/memory/rules/index.json`.

#### Phase 2: ST-2 -- Reconcile hook documentation

| #   | File                                    | Change Description                                                                          |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | `llmdoc/architecture/hooks-system.md`   | Update "5 hook points" to 7; add TeammateIdle/TaskCompleted rows; update script count to 13 |
| 2   | `llmdoc/reference/hook-scripts.md`      | Add Orchestration category with 2 scripts                                                   |
| 3   | `llmdoc/guides/how-to-create-a-hook.md` | Add `orchestration/` to category list; add orchestration hook example                       |

**Test:** Grep all 3 files for "7 lifecycle" or "7 hook" and "13 scripts" references.

#### Phase 3a: ST-3 -- Enhance hook scripts

| #   | File                                                    | Change Description                                               |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `plugins/hooks/scripts/orchestration/teammate-idle.sh`  | Rewrite: add set -euo, validation, structured output (~65 lines) |
| 2   | `plugins/hooks/scripts/orchestration/task-completed.sh` | Rewrite: add set -euo, validation, log rotation (~75 lines)      |
| 3   | `plugins/hooks/hooks/hooks.json`                        | Verify config (likely no changes needed)                         |

**Test:** Pipe sample JSON payloads into each script and verify (1) valid JSON output with hookSpecificOutput, (2) JSONL log entry created, (3) execution under 1 second.

#### Phase 3b: ST-4 -- Refine /tpd:dev Agent Teams section (parallel with 3a)

| #   | File                          | Change Description                                                |
| --- | ----------------------------- | ----------------------------------------------------------------- |
| 1   | `plugins/tpd/commands/dev.md` | Rewrite lines 351-387: state machine, fallback, iteration metrics |
| 2   | `plugins/hooks/CLAUDE.md`     | Add TeammateIdle/TaskCompleted to available-hooks table           |
| 3   | `plugins/tpd/CLAUDE.md`       | Add Agent Teams mode documentation to plugin metadata             |

**Test:** (1) `/tpd:dev` without env var produces identical output to current behavior, (2) `/tpd:dev` with env var enters team mode and writes `team-state.json`.

#### Phase 4: ST-5 -- Update memory architecture documentation

| #   | File                                         | Change Description                                                   |
| --- | -------------------------------------------- | -------------------------------------------------------------------- |
| 1   | `llmdoc/architecture/memory-architecture.md` | Map Auto Memory to Hot layer; document ownership boundaries          |
| 2   | `llmdoc/architecture/plugin-architecture.md` | Clarify Agent Teams as 7th hook point; update agent frontmatter spec |
| 3   | `CLAUDE.md` (project root)                   | Update memory ownership rules if needed                              |

**Test:** Review all 3 files for consistency with the ownership boundary table in section 4.4.3.

### 5.3 Critical Path

```
ST-1 ──→ ST-2 ──→ ST-3 ──→ ST-5
                  ST-4 ──→ ST-5
```

ST-1 is the sole blocking predecessor. ST-3 and ST-4 can proceed in parallel after ST-2. ST-5 depends on both ST-3 and ST-4 because it documents the results of both.

**Estimated total effort:** 12 files across 5 sub-tasks, all documentation and shell script changes. No TypeScript/JavaScript code involved. No database migrations. No API contract changes.

---

## 6. Risks & Mitigation

| #   | Risk                                                | Severity | Probability | Mitigation                                                                                                        |
| --- | --------------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Hook return values are observation-only             | HIGH     | Medium      | Design actionable directives; degrade to logging. Zero blast radius -- hooks already work as skeletons.           |
| 2   | Agent Teams Research Preview breaking changes       | HIGH     | Medium      | Feature flag + FALLBACK state. Zero impact on Task subagent path.                                                 |
| 3   | Hook timeout exceeded by enhanced logic             | MEDIUM   | Low         | Timing budget shows 220ms / 5000ms. 4780ms headroom.                                                              |
| 4   | TeammateIdle/TaskCompleted input schema mismatch    | MEDIUM   | Medium      | Schema validation returns `{}` on unknown input. Log raw input for debugging.                                     |
| 5   | .claude/memory/rules/ collides with future platform | LOW      | Low         | `.claude/memory/` is a ccg-workflows-owned namespace. Platform uses `.claude/rules/` and `.claude/agent-memory/`. |
| 6   | team-state.json corruption blocks workflow          | LOW      | Low         | FALLBACK state handles any JSON parse failure. Stale state file is overwritten on new run.                        |
| 7   | Documentation changes miss a reference              | LOW      | Medium      | Grep-based verification in test steps.                                                                            |

---

## Appendix A: Hook Script Convention Reference

Derived from analysis of 6 existing production hook scripts:

```bash
#!/bin/bash
# =============================================================================
# {script-name}.sh - {Description}
# =============================================================================
# Lifecycle: {TeammateIdle|TaskCompleted|PreToolUse|...}
# Timeout: {N}s
# Version: 2.1.33+
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[{SCRIPT-TAG}]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[{SCRIPT-TAG}]${NC} $1" >&2; }
log_error() { echo -e "${RED}[{SCRIPT-TAG}]${NC} $1" >&2; }

# Read and validate input
input=$(cat)
if ! echo "$input" | jq empty 2>/dev/null; then
  log_warn "Invalid JSON input"
  echo '{}'
  exit 0
fi

# Extract fields
field=$(echo "$input" | jq -r '.field_name // empty')
if [ -z "$field" ]; then
  echo '{}'
  exit 0
fi

# Business logic
# ...

# Structured output
cat <<EOF
{
  "hookSpecificOutput": {
    ...
  }
}
EOF
exit 0
```

## Appendix B: File Impact Summary

| Sub-Task | File                                                          | Operation |
| -------- | ------------------------------------------------------------- | --------- |
| ST-1     | `plugins/context-memory/skills/tech-rules-generator/SKILL.md` | Edit      |
| ST-1     | `llmdoc/architecture/memory-architecture.md`                  | Edit      |
| ST-2     | `llmdoc/architecture/hooks-system.md`                         | Edit      |
| ST-2     | `llmdoc/reference/hook-scripts.md`                            | Edit      |
| ST-2     | `llmdoc/guides/how-to-create-a-hook.md`                       | Edit      |
| ST-3     | `plugins/hooks/scripts/orchestration/teammate-idle.sh`        | Rewrite   |
| ST-3     | `plugins/hooks/scripts/orchestration/task-completed.sh`       | Rewrite   |
| ST-3     | `plugins/hooks/hooks/hooks.json`                              | Verify    |
| ST-4     | `plugins/tpd/commands/dev.md`                                 | Edit      |
| ST-4     | `plugins/hooks/CLAUDE.md`                                     | Edit      |
| ST-4     | `plugins/tpd/CLAUDE.md`                                       | Edit      |
| ST-5     | `llmdoc/architecture/memory-architecture.md`                  | Edit      |
| ST-5     | `llmdoc/architecture/plugin-architecture.md`                  | Edit      |
| ST-5     | `CLAUDE.md`                                                   | Edit      |
