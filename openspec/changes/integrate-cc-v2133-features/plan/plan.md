# Execution Plan: integrate-cc-v2133-features

## Metadata

- Generated: 2026-02-06T17:50:00Z
- Proposal: integrate-cc-v2133-features
- Task Type: fullstack (backend 100%)
- Total Tasks: 8 across 5 waves
- Total File Operations: 14
- Constraints: 11 hard, 8 soft
- Risks: 12 identified, 4 residual
- PBT Properties: 8
- Ambiguities: 9 resolved, 0 blocking

---

## Executive Summary

Selective integration of Claude Code v2.1.33 features (Agent Teams, Auto Memory, TeammateIdle/TaskCompleted hooks) into 7 ccg-workflows plugins. Zero behavior change for non-v2.1.33 users (HC-7). Execution follows a 5-wave dependency chain: path migration → documentation reconciliation → hook script enhancement → Agent Teams refinement → memory architecture documentation.

---

## Constraint Set

### Hard Constraints

| ID    | Constraint                                                            |
| ----- | --------------------------------------------------------------------- |
| HC-1  | `.claude/rules/` exclusively owned by Auto Memory after migration     |
| HC-2  | Skills cannot use memory frontmatter (4 skills-only plugins excluded) |
| HC-3  | Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`         |
| HC-4  | Hook scripts 5s timeout ceiling, no synchronous network calls         |
| HC-5  | Agent MEMORY.md capped at 200 lines, use linked topic files           |
| HC-6  | Cross-model mailbox prohibited in Agent Teams                         |
| HC-7  | All 7 plugins must work identically without v2.1.33 features          |
| HC-8  | CLAUDE.md = context-memory, MEMORY.md = Auto Memory                   |
| HC-9  | Hook scripts MUST fail-open: exit 0 + return `{}` on any error        |
| HC-10 | Agent Teams iteration limit fixed at 2                                |
| HC-11 | Log rotation: internal, 10k line threshold, tail 5k                   |

### Soft Constraints

| ID   | Constraint                                                        |
| ---- | ----------------------------------------------------------------- |
| SC-1 | Agent Teams targets /tpd:dev only                                 |
| SC-2 | No conversion of skills-only plugins to agents                    |
| SC-3 | Existing memory scope assignments unchanged                       |
| SC-4 | Auto Memory defers to context-memory where overlap exists         |
| SC-5 | Documentation correction before enhancement (doc-first)           |
| SC-6 | Hook enhancement logging-first, orchestration optional            |
| SC-7 | Orchestration event matcher uses `*` wildcard, no filtering in v1 |
| SC-8 | Agent Teams API syntax documented as TBD pending official docs    |

### Architecture Decisions

| ADR     | Decision                               | Rationale                                         |
| ------- | -------------------------------------- | ------------------------------------------------- |
| ADR-001 | Monolithic per-script (no shared lib)  | Only 2 hooks; shared lib is premature abstraction |
| ADR-002 | Path update only (no migration script) | Skill is stateless; output regenerated on demand  |
| ADR-003 | 7-state state machine for Agent Teams  | Experimental feature needs recovery + metrics     |
| ADR-004 | Event existence as feature gate        | No env var proliferation                          |
| ADR-005 | 5-wave execution ordering              | SC-5 requires finer doc-first ordering            |

---

## Execution Order

### Dependency DAG

```
T-1 ──────────────────────────────────────────────> T-5
 |                                                   ^
 v                                                   |
T-2a ──> T-2b ──> T-2d (Wave 2 gate) ──> T-3 ──────┤
 |                  ^                      |         |
 +──> T-2c          |                      v         |
                    +────────────────────> T-4 ──────┘
```

### Wave Schedule

| Wave | Tasks      | Parallelizable | Files | Gate Condition         |
| ---- | ---------- | -------------- | ----- | ---------------------- |
| 1    | T-1        | N/A            | 1     | None                   |
| 2    | T-2a,b,c,d | T-2b ‖ T-2c    | 4     | T-1 complete           |
| 3    | T-3        | T-3 ‖ T-4      | 3     | Wave 2 complete        |
| 4    | T-4        | T-3 ‖ T-4      | 3     | Wave 2 complete        |
| 5    | T-5        | N/A            | 3     | T-1, T-3, T-4 complete |

**Critical path**: T-1 → T-2a → T-2b → T-2d → T-3 → T-5 (6 sequential steps)

---

## Task Specifications

### T-1: Migrate tech-rules-generator Output Path

**Wave 1** | Dependencies: None | Files: 1

| #   | File                                                          | Operation |
| --- | ------------------------------------------------------------- | --------- |
| 1   | `plugins/context-memory/skills/tech-rules-generator/SKILL.md` | Edit      |

**What**: Replace all `.claude/rules/` references with `.claude/memory/rules/` at 4 locations (lines 5, 64, 331-339, 343-362). No migration script (ADR-002).

**Acceptance**:

- Zero `.claude/rules/` references remain in SKILL.md
- `>= 4` occurrences of `.claude/memory/rules/` present
- Index schema `path` field examples reflect new base directory

**[TEST]**:

- `grep -c '.claude/rules/' SKILL.md` → 0
- `grep -c '.claude/memory/rules/' SKILL.md` → >= 4
- PBT-1: Output path and Auto Memory path are disjoint

---

### T-2a: Fix hooks-system.md Canonical Reference

**Wave 2** | Dependencies: T-1 | Files: 1

| #   | File                                  | Operation |
| --- | ------------------------------------- | --------- |
| 1   | `llmdoc/architecture/hooks-system.md` | Edit      |

**What**: Correct lifecycle event count (5→7), hook count (11→14). Add TeammateIdle/TaskCompleted rows. Add git-conflict-guard to PreToolUse listing. This is the canonical reference; all other docs cross-reference it.

**Acceptance**:

- Document references 7 lifecycle events, 14 hook scripts
- All 7 events listed: UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Notification, TeammateIdle, TaskCompleted
- PreToolUse listing includes git-conflict-guard.sh

**[TEST]**:

- `grep -c '5 lifecycle\|5 hook points' hooks-system.md` → 0
- `grep -c 'TeammateIdle' hooks-system.md` → >= 1
- `grep -c 'TaskCompleted' hooks-system.md` → >= 1
- PBT-5: Event count matches hooks.json

---

### T-2b: Fix hook-scripts.md Reference Document

**Wave 2** | Dependencies: T-2a | Files: 1

| #   | File                               | Operation |
| --- | ---------------------------------- | --------- |
| 1   | `llmdoc/reference/hook-scripts.md` | Edit      |

**What**: Correct script count (11→14), lifecycle count (5→7), category count (6→7). Add Orchestration category section with teammate-idle.sh and task-completed.sh. Add git-conflict-guard.sh to Security table.

**Acceptance**:

- Header references 14 scripts, 7 lifecycle points, 7 categories
- Orchestration category section present with both orchestration scripts
- All 14 scripts from hooks.json documented

**[TEST]**:

- `grep -c '11 ' hook-scripts.md` → 0 (no stale counts)
- Count unique script names → 14
- PBT-5: Counts match hooks-system.md and hooks.json

---

### T-2c: Fix how-to-create-a-hook.md Guide

**Wave 2** | Dependencies: T-2a | Parallel with: T-2b | Files: 1

| #   | File                                    | Operation |
| --- | --------------------------------------- | --------- |
| 1   | `llmdoc/guides/how-to-create-a-hook.md` | Edit      |

**What**: Add TeammateIdle and TaskCompleted to lifecycle points list (5→7). Add orchestration hook creation guidance with wildcard matcher note (SC-7). Add orchestration hook template variant. Document input payload fields with TBD caveat (OQ-BLOCK-2).

**Acceptance**:

- Lifecycle points list includes all 7 events
- Orchestration hook template variant provided
- Input payload fields documented with TBD caveat

**[TEST]**:

- `grep -c '5 lifecycle' how-to-create-a-hook.md` → 0
- `grep -c 'TeammateIdle' how-to-create-a-hook.md` → >= 1
- PBT-5: Lifecycle count matches hooks-system.md

---

### T-2d: Fix hooks CLAUDE.md User-Facing Documentation

**Wave 2** | Dependencies: T-2a, T-2b | Files: 1

| #   | File                      | Operation |
| --- | ------------------------- | --------- |
| 1   | `plugins/hooks/CLAUDE.md` | Edit      |

**What**: Add all 14 hooks to available-hooks table (currently 7). Add missing categories (currently 4, target 8). Update hook script template with `set -euo pipefail` and input validation. This is the most severely drifted document.

**Acceptance**:

- Available-hooks table lists all 14 hooks
- Hook Categories table lists all 8 categories
- Hook script template includes `set -euo pipefail` and jq validation

**[TEST]**:

- Count rows in available-hooks table → 14
- Count rows in Hook Categories table → 8
- `grep -c 'set -euo pipefail' plugins/hooks/CLAUDE.md` → 1 (in template)

---

### T-3: Enhance Orchestration Hook Scripts

**Wave 3** | Dependencies: T-2d | Parallel with: T-4 | Files: 3

| #   | File                                                    | Operation   |
| --- | ------------------------------------------------------- | ----------- |
| 1   | `plugins/hooks/scripts/orchestration/teammate-idle.sh`  | Rewrite     |
| 2   | `plugins/hooks/scripts/orchestration/task-completed.sh` | Rewrite     |
| 3   | `plugins/hooks/hooks/hooks.json`                        | Verify only |

**What**: Rewrite both 19-line skeleton scripts to follow established hook convention: `set -euo pipefail`, color-coded log functions (stderr), `input=$(cat)`, jq validation, field extraction, structured JSONL logging with 10k-line rotation (HC-11), orchestration directive output via `hookSpecificOutput`, fail-open (HC-9). Monolithic per-script (ADR-001). Total processing within 220ms budget against 5s ceiling (HC-4).

**Hook Processing Pipeline**:

```
stdin → jq validation → field extraction → structured JSONL logging → orchestration directive → stdout
         (< 50ms)        (< 10ms)          (< 100ms, async)          (< 10ms)
Total: ~220ms / 5000ms budget
```

**hookSpecificOutput Protocol**:

```json
{"hookSpecificOutput": {"orchestrationDirective": {...}, "metrics": {...}}}
```

**Input Validation Pattern**:

```bash
if ! echo "$input" | jq empty 2>/dev/null; then
  log_warn "Invalid JSON input, skipping"
  echo '{}'
  exit 0
fi
```

**Acceptance**:

- Both scripts include `set -euo pipefail`
- Both scripts validate input with `jq empty`
- Both scripts produce `hookSpecificOutput` with `orchestrationDirective` and `metrics`
- Both scripts implement JSONL log rotation (10k threshold, tail 5k)
- Both scripts exit 0 and return `{}` on any error
- hooks.json entries unchanged (matcher: `*`, timeout: 5)

**[TEST]**:

- PBT-3: `time echo '{}' | bash teammate-idle.sh` → < 5s (target < 300ms)
- PBT-4: `echo 'invalid' | bash teammate-idle.sh; echo $?` → exit 0, output `{}`
- PBT-4: `echo '' | bash task-completed.sh; echo $?` → exit 0, output `{}`
- PBT-8: `echo '{"hook_event_name":"TeammateIdle"}' | bash teammate-idle.sh | jq empty` → success
- PBT-8: `echo '{"hook_event_name":"TaskCompleted"}' | bash task-completed.sh | jq empty` → success
- `grep -c 'set -euo pipefail' teammate-idle.sh` → 1
- `grep -c 'jq empty' teammate-idle.sh` → >= 1

---

### T-4: Refine Agent Teams Section in /tpd:dev

**Wave 4** | Dependencies: T-2d | Parallel with: T-3 | Files: 3

| #   | File                          | Operation |
| --- | ----------------------------- | --------- |
| 1   | `plugins/tpd/commands/dev.md` | Edit      |
| 2   | `plugins/hooks/CLAUDE.md`     | Edit      |
| 3   | `plugins/tpd/CLAUDE.md`       | Edit      |

**What**: Replace Agent Teams skeleton (lines 351-387) with 7-state state machine (ADR-003): DETECT → INIT_TEAM → PROTOTYPE → AUDIT → ITERATE → COMPLETE/FALLBACK. Add team-state.json schema, fallback triggers (env var unset, iteration > 2 per HC-10, agent init failure), UX messaging. Standard mode (lines 1-350) unchanged (HC-7). Cross-model mailbox forbidden (HC-6). API syntax TBD (SC-8).

**State Machine**:

| State     | Next States           |
| --------- | --------------------- |
| DETECT    | INIT_TEAM or FALLBACK |
| INIT_TEAM | PROTOTYPE             |
| PROTOTYPE | AUDIT                 |
| AUDIT     | COMPLETE or ITERATE   |
| ITERATE   | PROTOTYPE (if < 2)    |
| COMPLETE  | (terminal)            |
| FALLBACK  | (terminal)            |

**Acceptance**:

- dev.md Agent Teams section defines all 7 states with transitions
- dev.md includes team-state.json schema
- dev.md specifies all fallback triggers
- dev.md lines 1-350 completely unchanged
- dev.md cross-model mailbox prohibition stated (HC-6)
- dev.md iteration limit hardcoded at 2 (HC-10)
- hooks CLAUDE.md mentions orchestration hooks fire during Agent Teams
- tpd CLAUDE.md documents env var

**[TEST]**:

- PBT-2: `diff` dev.md lines 1-350 against main branch → no changes
- PBT-6: Trace all state paths → every path reaches COMPLETE or FALLBACK
- `grep -c 'FALLBACK' dev.md` → >= 3
- `grep -c 'cross-model mailbox' dev.md` → >= 1
- `grep -c 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS' plugins/tpd/CLAUDE.md` → >= 1

---

### T-5: Update Memory Architecture Documentation

**Wave 5** | Dependencies: T-1, T-3, T-4 | Files: 3

| #   | File                                         | Operation |
| --- | -------------------------------------------- | --------- |
| 1   | `llmdoc/architecture/memory-architecture.md` | Edit      |
| 2   | `llmdoc/architecture/plugin-architecture.md` | Edit      |
| 3   | `CLAUDE.md`                                  | Edit      |

**What**: Add Auto Memory to Hot layer in three-layer model. Document tech-rules migration (`.claude/rules/` → `.claude/memory/rules/`). Document MEMORY.md 200-line cap (HC-5). Document ownership boundaries (HC-8). Add scope distribution table (15 project, 8 user, 0 local).

**Five-Row Ownership Model**:

| Layer | System               | Path                           | Owner                   |
| ----- | -------------------- | ------------------------------ | ----------------------- |
| Hot   | Native agent memory  | `.claude/agent-memory/<name>/` | Claude Code platform    |
| Hot   | Auto Memory rules    | `.claude/rules/`               | Claude Code Auto Memory |
| Warm  | workflow-memory      | `.claude/memory/workflows/`    | context-memory plugin   |
| Warm  | tech-rules-generator | `.claude/memory/rules/`        | context-memory plugin   |
| Cold  | session-compactor    | `.claude/memory/sessions/`     | context-memory (MCP)    |

**Acceptance**:

- memory-architecture.md Hot layer includes Auto Memory
- memory-architecture.md documents ownership boundaries (HC-8)
- memory-architecture.md documents MEMORY.md 200-line cap (HC-5)
- plugin-architecture.md includes scope distribution table
- No file references stale `.claude/rules/` path for tech-rules

**[TEST]**:

- PBT-7: Verify exclusive owners defined for every path
- `grep -c 'Auto Memory' memory-architecture.md` → >= 1
- `grep -c '.claude/memory/rules/' memory-architecture.md` → >= 1
- `grep -c '.claude/rules/{stack}\|.claude/rules/index' memory-architecture.md plugin-architecture.md CLAUDE.md` → 0

---

## Risk Summary

### Critical & High Risks

| ID  | Risk                                  | Severity | Mitigation                                 |
| --- | ------------------------------------- | -------- | ------------------------------------------ |
| R-8 | Backward compatibility regression     | CRITICAL | Event-existence gate + dual-mode testing   |
| R-1 | Hook return values observation-only   | HIGH     | Logging-first design (SC-6)                |
| R-2 | Agent Teams Research Preview breaking | HIGH     | Fallback to Task() mode (HC-3)             |
| R-4 | Input schema mismatch                 | HIGH     | jq empty + fail-open + raw payload capture |
| R-9 | Wave ordering violation               | HIGH     | DAG enforcement in task dependencies       |

### Residual Risks (Accepted)

| ID   | Risk                            | Acceptance                                           |
| ---- | ------------------------------- | ---------------------------------------------------- |
| RR-1 | Platform semantics opacity      | SC-6 logging-first ensures baseline value            |
| RR-2 | Agent Teams API instability     | HC-3 fallback to Task() proven path                  |
| RR-3 | Cross-platform jq variance      | Basic jq ops only (stable across jq 1.5+)            |
| RR-4 | Undiscovered documentation refs | PBT-5 covers numeric patterns; text refs need review |

---

## PBT Coverage Matrix

| PBT   | Property                     | Tasks    | Falsification Strategy                                     |
| ----- | ---------------------------- | -------- | ---------------------------------------------------------- |
| PBT-1 | Path Isolation               | T-1, T-5 | Run tech-rules; verify output in `.claude/memory/rules/`   |
| PBT-2 | Backward Compatibility       | T-4      | Run all 7 plugins with/without env vars; compare outputs   |
| PBT-3 | Hook Timeout Compliance      | T-3      | Pipe max-size JSON into each hook; measure wall time < 5s  |
| PBT-4 | Hook Fail-Open               | T-3      | Pipe invalid/empty/binary into hooks; verify exit 0 + `{}` |
| PBT-5 | Documentation Consistency    | T-2a,b,c | Grep docs for counts; verify match with hooks.json         |
| PBT-6 | State Machine Completeness   | T-4      | Simulate all state transitions; verify terminal states     |
| PBT-7 | Memory Ownership Exclusivity | T-5      | Run concurrent memory ops; check for path overlap          |
| PBT-8 | Hook Output Schema           | T-3      | Parse all hook outputs with `jq empty`                     |

---

## File Impact Summary

| Task | File                                                          | Op      | Wave |
| ---- | ------------------------------------------------------------- | ------- | ---- |
| T-1  | `plugins/context-memory/skills/tech-rules-generator/SKILL.md` | Edit    | 1    |
| T-2a | `llmdoc/architecture/hooks-system.md`                         | Edit    | 2    |
| T-2b | `llmdoc/reference/hook-scripts.md`                            | Edit    | 2    |
| T-2c | `llmdoc/guides/how-to-create-a-hook.md`                       | Edit    | 2    |
| T-2d | `plugins/hooks/CLAUDE.md`                                     | Edit    | 2    |
| T-3  | `plugins/hooks/scripts/orchestration/teammate-idle.sh`        | Rewrite | 3    |
| T-3  | `plugins/hooks/scripts/orchestration/task-completed.sh`       | Rewrite | 3    |
| T-3  | `plugins/hooks/hooks/hooks.json`                              | Verify  | 3    |
| T-4  | `plugins/tpd/commands/dev.md`                                 | Edit    | 4    |
| T-4  | `plugins/hooks/CLAUDE.md`                                     | Edit    | 4    |
| T-4  | `plugins/tpd/CLAUDE.md`                                       | Edit    | 4    |
| T-5  | `llmdoc/architecture/memory-architecture.md`                  | Edit    | 5    |
| T-5  | `llmdoc/architecture/plugin-architecture.md`                  | Edit    | 5    |
| T-5  | `CLAUDE.md`                                                   | Edit    | 5    |

---

## Validation Checklist

Before marking plan complete, verify:

- [ ] All 8 tasks have explicit file lists (max 3 per task)
- [ ] All 8 tasks have [TEST] sections with PBT mapping
- [ ] All 11 hard constraints are addressed by at least one task
- [ ] All 8 PBT properties are covered by at least one task
- [ ] All 12 risks have mitigation strategies
- [ ] Dependency DAG is acyclic and respects SC-5 (doc-first)
- [ ] No task requires user decisions (zero-decision plan)
- [ ] Backward compatibility (HC-7) verified through PBT-2
