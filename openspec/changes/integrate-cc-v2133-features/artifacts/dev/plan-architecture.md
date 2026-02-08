# Architecture Design

## Metadata

- Analysis Time: 2026-02-06T17:30:00Z
- Analysis Models: Codex (backend technical) + Gemini (documentation & DX)
- Task Type: fullstack (backend 100%)
- Integration Mode: Dual plan integration

## Architecture Overview

Selective integration of Claude Code v2.1.33 features into 7 ccg-workflows plugins across 5 sub-tasks: path migration, documentation reconciliation, hook script enhancement, Agent Teams refinement, and memory architecture documentation. The architecture prioritizes backward compatibility (HC-7) through event-existence feature gating, monolithic hook scripts (2 hooks only, no shared lib), a 7-state state machine for Agent Teams (experimental with fallback), and documentation-first execution ordering (SC-5).

---

## Backend Architecture (Codex Analysis)

### Hook Script Enhancement Architecture

**Decision: Monolithic Enhancement (per-script)**

Each hook script (teammate-idle.sh, task-completed.sh) handles input validation, logging, orchestration directives, and metrics in a single file. Only 2 orchestration hooks exist; shared library is premature abstraction at this scale.

**Processing Pipeline:**

```
stdin → jq validation → field extraction → structured JSONL logging → orchestration directive → stdout
         (< 50ms)        (< 10ms)          (< 100ms, async)          (< 10ms)
Total: ~220ms / 5000ms budget (4780ms headroom)
```

**Input Validation Pattern (standard for all orchestration hooks):**

```bash
if ! echo "$input" | jq empty 2>/dev/null; then
  log_warn "Invalid JSON input, skipping"
  echo '{}'
  exit 0
fi
hook_event=$(echo "$input" | jq -r '.hook_event_name // empty')
if [ -z "$hook_event" ]; then
  log_warn "Missing hook_event_name, skipping"
  echo '{}'
  exit 0
fi
```

**hookSpecificOutput Protocol:**

| Type          | Schema                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------- |
| Orchestration | `{"hookSpecificOutput": {"orchestrationDirective": {...}, "metrics": {...}}}`               |
| Blocker       | `{"hookSpecificOutput": {"permissionDecision": "deny", "permissionDecisionReason": "..."}}` |
| Modifier      | `{"hookSpecificOutput": {"updatedInput": {...}, "additionalContext": "..."}}`               |
| Pass-through  | `{}`                                                                                        |

### Tech-Rules Migration Data Flow

**Decision: Path Update Only (no migration script)**

tech-rules-generator is stateless; existing output is regenerated on next invocation.

| Artifact    | Current Path               | New Path                          |
| ----------- | -------------------------- | --------------------------------- |
| Stack rules | `.claude/rules/{stack}.md` | `.claude/memory/rules/{stack}.md` |
| Rule index  | `.claude/rules/index.json` | `.claude/memory/rules/index.json` |

SKILL.md changes at 4 locations: line 5, 64, 331-339, 343-362.

**Post-Migration Ownership:**

```
.claude/
├── rules/                    # EXCLUSIVE: Auto Memory (Claude Code native)
├── memory/
│   └── rules/                # EXCLUSIVE: tech-rules-generator
│       ├── {stack}.md
│       └── index.json
├── agent-memory/             # EXCLUSIVE: Agent Memory (per-agent MEMORY.md)
└── CLAUDE.md                 # EXCLUSIVE: context-memory plugin
```

### Agent Teams State Machine

**Decision: Structured State Machine (7 states)**

Experimental feature needs recovery from interruptions, iteration metrics, and clear audit trail.

**States:**

| State     | Description                                    | Next States           |
| --------- | ---------------------------------------------- | --------------------- |
| DETECT    | Check env var, determine mode                  | INIT_TEAM or FALLBACK |
| INIT_TEAM | Initialize team with 4 agents                  | PROTOTYPE             |
| PROTOTYPE | codex + gemini implementers produce prototypes | AUDIT                 |
| AUDIT     | codex + gemini auditors review prototypes      | COMPLETE or ITERATE   |
| ITERATE   | Fix issues from audit, increment counter       | PROTOTYPE (if < 2)    |
| COMPLETE  | Team cycle succeeded                           | (terminal)            |
| FALLBACK  | Unavailable or max iterations exceeded         | (terminal)            |

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
  "audit_results": { "critical_issues": 0, "warnings": 0, "passed": false },
  "fallback_reason": null
}
```

**Fallback Triggers:** env var unset, iteration > 2, agent init failure, unrecoverable error, critical issues after max iterations.

### Backward Compatibility Strategy

**Decision: Event Existence as Feature Gate**

TeammateIdle/TaskCompleted hooks only fire when Agent Teams is active. The event's existence IS the feature gate. Agent Teams uses the existing `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` env var. No new env vars introduced.

### Security Strategy

| Domain           | Protection                                                    |
| ---------------- | ------------------------------------------------------------- |
| Input validation | `jq empty` check; required field presence; no shell eval      |
| Log file safety  | Append-only `>>`; user-writable `~/.claude/logs/hook-events/` |
| Log rotation     | Tail-based at 10,000 entries; fail-open on rotation error     |
| Path isolation   | Exclusive ownership per directory; no cross-writes            |

### Performance Budget

| Phase               | Budget    | Implementation                       |
| ------------------- | --------- | ------------------------------------ |
| JSON parse+validate | 50ms      | Single `jq empty` + field extraction |
| Field extraction    | 10ms      | 2-4 `jq -r` calls                    |
| JSONL logging       | 100ms     | Single file append (not fsync)       |
| Log rotation check  | 50ms      | `wc -l` + conditional tail           |
| Output generation   | 10ms      | cat heredoc with interpolation       |
| **Total**           | **220ms** | 4780ms headroom vs 5s ceiling        |

---

## Frontend Architecture (Gemini Analysis)

### Documentation Drift Inventory

Source of truth: `plugins/hooks/hooks/hooks.json` (14 script entries, 7 lifecycle events, 8 categories).

| File                          | Current Claims     | Reality                  | Delta                 |
| ----------------------------- | ------------------ | ------------------------ | --------------------- |
| hooks-system.md               | 5 events, 11 hooks | 7 events, 14 scripts     | +2 events, +3 scripts |
| hook-scripts.md               | 11 scripts, 6 cats | 14 scripts, 8 categories | +3 scripts, +2 cats   |
| how-to-create-a-hook.md       | 5 lifecycle points | 7 points                 | +2 points             |
| hooks CLAUDE.md               | 7 hooks, 4 cats    | 14 hooks, 8 categories   | +7 hooks, +4 cats     |
| memory-architecture.md        | No Auto Memory     | Auto Memory at Hot layer | +section              |
| plugin-architecture.md        | No scope detail    | Missing scope docs       | +scope table          |
| tech-rules-generator SKILL.md | `.claude/rules/`   | Must migrate             | 4 path changes        |

### Cross-Reference Integrity Matrix

| Source Document         | Referenced By                                    | Coordination Need                        |
| ----------------------- | ------------------------------------------------ | ---------------------------------------- |
| hooks-system.md         | hook-scripts.md, how-to-create, plugin-arch      | Counts must match hooks.json             |
| hook-scripts.md         | hooks CLAUDE.md, how-to-create                   | Category list must match dir structure   |
| how-to-create-a-hook.md | None (leaf doc)                                  | Lifecycle list must match hooks-system   |
| hooks CLAUDE.md         | None (user-facing)                               | Hook table must match hooks.json         |
| memory-architecture.md  | plugin-architecture.md, context-memory CLAUDE.md | Layer table must include Auto Memory     |
| tech-rules SKILL.md     | memory-architecture.md (path reference)          | Output path must be .claude/memory/rules |

### Developer Experience: Orchestration Hooks

Three DX gaps identified and addressed:

1. **Missing lifecycle coverage**: Guide only covers 5 of 7 events → add TeammateIdle, TaskCompleted
2. **No input schema docs**: Each event type has different payload → add per-event schema section
3. **Template gap**: Only PreToolUse template exists → add orchestration hook template variant

### Agent Teams UX Design

**Activation Feedback:**

```
IF CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === "1":
  "[Agent Teams] Experimental mode activated. Steps 3+5 use iterative team cycle."
  "[Agent Teams] Team: codex-implementer, gemini-implementer, codex-auditor, gemini-auditor"
  "[Agent Teams] Max iterations: 2. Fallback: manual review."
ELSE:
  "[Standard Mode] Using Task() subagent dispatch for Steps 3 and 5."
```

**Fallback Messaging:**

| Scenario           | User Message                                                                      |
| ------------------ | --------------------------------------------------------------------------------- |
| Flag unset         | Silent: no Agent Teams mention. Standard mode proceeds.                           |
| Max iterations hit | "[Agent Teams] Exhausted 2 iterations. Unresolved issues in audit-unresolved.md." |
| API error          | "[Agent Teams] Team dispatch failed. Falling back to standard Task() mode."       |

### Memory Architecture Updates

**Three-Layer Model (updated with Auto Memory):**

| Layer | System               | Path                           | Owner                   |
| ----- | -------------------- | ------------------------------ | ----------------------- |
| Hot   | Native agent memory  | `.claude/agent-memory/<name>/` | Claude Code platform    |
| Hot   | Auto Memory rules    | `.claude/rules/`               | Claude Code Auto Memory |
| Warm  | workflow-memory      | `.claude/memory/workflows/`    | context-memory plugin   |
| Warm  | tech-rules-generator | `.claude/memory/rules/`        | context-memory plugin   |
| Cold  | session-compactor    | `.claude/memory/sessions/`     | context-memory (MCP)    |

---

## Cross-cutting Concerns

### Execution Ordering (5-Wave)

SC-5 mandates documentation fixes before hook enhancement. Gemini's 5-wave ordering (finer than Codex's 4-phase) selected per ADR-005.

```
WAVE 1: ST-1 (path migration) — no dependencies
WAVE 2: ST-2 (hook docs) — depends on Wave 1 for accurate paths
  ST-2a: hooks-system.md (canonical reference)
  ST-2b: hook-scripts.md (after ST-2a)
  ST-2c: how-to-create-a-hook.md (after ST-2a)
  ST-2d: hooks CLAUDE.md (after ST-2a, ST-2b)
WAVE 3: ST-3 (hook scripts) — after Wave 2 complete
WAVE 4: ST-4 (Agent Teams) — after Wave 2 complete, parallel with Wave 3
WAVE 5: ST-5 (memory docs) — after Waves 1, 3, 4
```

### Dependency DAG

```
ST-1 ────────────────────────────────────────> ST-5a -> ST-5b
  |                                              ^        ^
  v                                              |        |
ST-2a ──> ST-2b ──> ST-2d                      ST-3     ST-4
  |                                              ^        ^
  +────> ST-2c                                   |        |
  |                                              |        |
  +──────────────────────────────────────────> (WAVE 2 gate)
```

### Error Handling Contract

All hooks follow fail-open strategy (HC-9):

- Exit 0 on any error
- Return `{}` on failure
- Log to stderr
- No retry mechanism

### Backward Compatibility

Zero behavior change for users not opting in:

- Hook scripts that existed before (11 original) are unmodified
- `/tpd:dev` standard mode (no feature flag) is unchanged
- All 7 plugins produce identical results without v2.1.33 env vars
- No new required dependencies on experimental features

---

## Architecture Decision Records

### ADR-001: Hook Script Architecture

**Status**: Decided
**Context**: 2 orchestration hooks (teammate-idle.sh, task-completed.sh) share ~15 lines of validation/logging boilerplate.
**Decision**: Monolithic per-script (no shared library).
**Rationale**: Only 2 hooks; shared lib is premature abstraction. Refactor to shared lib if a third orchestration hook is added.
**Consequences**: ~15 lines of duplicated boilerplate between 2 scripts.

### ADR-002: Tech-Rules Migration Strategy

**Status**: Decided
**Context**: tech-rules-generator writes to `.claude/rules/` which collides with Auto Memory.
**Decision**: Path update only (no migration script).
**Rationale**: Skill is stateless and on-demand. Output is regenerated on next invocation. Adding migration logic violates stateless design.
**Consequences**: Orphaned files in `.claude/rules/` from previous runs managed by Auto Memory or manual cleanup.

### ADR-003: Agent Teams Integration

**Status**: Decided
**Context**: Agent Teams is a Research Preview feature with known instability.
**Decision**: Structured state machine (7 states) with `team-state.json`.
**Rationale**: Enables recovery from interruptions, iteration metrics, and debugging audit trail. Aligns with existing `state.json` pattern.
**Consequences**: State file management overhead (~10-field JSON). Corruption handled by FALLBACK state.

### ADR-004: Backward Compatibility Strategy

**Status**: Decided
**Context**: New features must not change behavior for non-v2.1.33 users.
**Decision**: Event existence as implicit feature gate (hooks); single env var for Agent Teams.
**Rationale**: TeammateIdle/TaskCompleted events only fire on v2.1.33+. Event existence IS the feature gate. No env var proliferation.
**Consequences**: Version detection relies on event firing, not explicit version checks.

### ADR-005: Execution Ordering

**Status**: Decided
**Context**: Codex proposed 4-phase ordering; Gemini proposed 5-wave ordering.
**Decision**: 5-wave ordering (Gemini proposal).
**Rationale**: SC-5 requires documentation correction before hook enhancement. 5-wave ordering provides finer granularity for doc dependency management (ST-2a → ST-2b → ST-2d chain).
**Consequences**: More sequential constraints within Wave 2, but clearer dependency tracking.

---

## Quality Attributes

| Attribute       | Target                                        | Verification Method                                             |
| --------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Compatibility   | Zero behavior change without v2.1.33 features | PBT-2: Run all 7 plugins with/without env vars                  |
| Performance     | Hook scripts < 5s (budget: 220ms actual)      | PBT-3: Pipe max-size JSON into each hook, measure wall time     |
| Robustness      | Hooks never block workflow                    | PBT-4: Pipe invalid JSON/empty/binary into hooks, verify exit 0 |
| Consistency     | Docs reference same counts across all files   | PBT-5: Grep docs for lifecycle/event/script counts              |
| Recoverability  | Agent Teams always reaches terminal state     | PBT-6: Simulate all state transitions                           |
| Isolation       | No cross-write between memory domains         | PBT-7: Run concurrent memory operations, check for overlap      |
| Schema validity | All hook outputs are valid JSON               | PBT-8: Parse all hook outputs with `jq empty`                   |

---

## File Impact Summary

| Sub-Task | File                                                          | Operation | Wave |
| -------- | ------------------------------------------------------------- | --------- | ---- |
| ST-1     | `plugins/context-memory/skills/tech-rules-generator/SKILL.md` | Edit      | 1    |
| ST-2     | `llmdoc/architecture/hooks-system.md`                         | Edit      | 2    |
| ST-2     | `llmdoc/reference/hook-scripts.md`                            | Edit      | 2    |
| ST-2     | `llmdoc/guides/how-to-create-a-hook.md`                       | Edit      | 2    |
| ST-2     | `plugins/hooks/CLAUDE.md`                                     | Edit      | 2    |
| ST-3     | `plugins/hooks/scripts/orchestration/teammate-idle.sh`        | Rewrite   | 3    |
| ST-3     | `plugins/hooks/scripts/orchestration/task-completed.sh`       | Rewrite   | 3    |
| ST-3     | `plugins/hooks/hooks/hooks.json`                              | Verify    | 3    |
| ST-4     | `plugins/tpd/commands/dev.md`                                 | Edit      | 4    |
| ST-4     | `plugins/hooks/CLAUDE.md`                                     | Edit      | 4    |
| ST-4     | `plugins/tpd/CLAUDE.md`                                       | Edit      | 4    |
| ST-5     | `llmdoc/architecture/memory-architecture.md`                  | Edit      | 5    |
| ST-5     | `llmdoc/architecture/plugin-architecture.md`                  | Edit      | 5    |
| ST-5     | `CLAUDE.md`                                                   | Edit      | 5    |

---

Next step: Call task-decomposer for task decomposition
