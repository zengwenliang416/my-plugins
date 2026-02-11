# Task Decomposition: integrate-cc-v2133-features

## Metadata

- Proposal: integrate-cc-v2133-features
- Generated: 2026-02-06
- Total Tasks: 8
- Waves: 5
- Max Files Per Task: 3 (enforced)

## Dependency DAG

```
T-1 ──────────────────────────────────────────────> T-5
 |                                                   ^
 v                                                   |
T-2a ──> T-2b ──> T-2d (Wave 2 gate) ──> T-3 ──────┤
 |                  ^                      |         |
 +──> T-2c          |                      v         |
                    +────────────────────> T-4 ──────┘
```

## Constraint Summary

| ID    | Constraint                                        | Affects Tasks    |
| ----- | ------------------------------------------------- | ---------------- |
| HC-1  | `.claude/rules/` exclusively owned by Auto Memory | T-1, T-5         |
| HC-4  | Hook scripts 5s timeout ceiling                   | T-3              |
| HC-7  | All plugins work without v2.1.33 features         | T-3, T-4         |
| HC-9  | Hook scripts fail-open (exit 0 + return `{}`)     | T-3              |
| HC-10 | Agent Teams iteration limit fixed at 2            | T-4              |
| SC-5  | Documentation correction before enhancement       | T-2a..T-2d < T-3 |

---

## T-1: Migrate tech-rules-generator Output Path

**Wave**: 1
**Dependencies**: None
**Files** (max 3):

1. `plugins/context-memory/skills/tech-rules-generator/SKILL.md` -- Edit output path references from `.claude/rules/` to `.claude/memory/rules/` at 4 locations (lines 5, 64, 331-339, 343-362)

**Description**: Update the tech-rules-generator skill to write output to `.claude/memory/rules/` instead of `.claude/rules/`, resolving the namespace collision with Auto Memory (HC-1). This is a path-only migration with no migration script needed (ADR-002): the skill is stateless and regenerates output on next invocation.

**Acceptance Criteria**:

- [ ] All `.claude/rules/` references in SKILL.md replaced with `.claude/memory/rules/`
- [ ] Output directory structure definition updated: `.claude/memory/rules/{stack}.md` and `.claude/memory/rules/index.json`
- [ ] Index schema `path` field examples reflect new base directory
- [ ] No other files in the skill directory reference the old path

**[TEST]**:

- Grep SKILL.md for `.claude/rules/` -- expect 0 matches
- Grep SKILL.md for `.claude/memory/rules/` -- expect >= 4 matches
- Verify PBT-1 (Path Isolation): confirm output path and Auto Memory path are disjoint directories

---

## T-2a: Fix hooks-system.md Canonical Reference

**Wave**: 2
**Dependencies**: T-1
**Files** (max 3):

1. `llmdoc/architecture/hooks-system.md` -- Edit to correct lifecycle event count (5 -> 7), hook count (11 -> 14), add TeammateIdle/TaskCompleted rows to lifecycle table, add git-conflict-guard to PreToolUse listing

**Description**: hooks-system.md is the canonical architecture reference that other docs cross-reference. Fix it first per SC-5 (documentation correction before enhancement). All counts and tables must match the source of truth: `plugins/hooks/hooks/hooks.json` (7 events, 14 script entries, 8 categories).

**Acceptance Criteria**:

- [ ] Document header references 7 lifecycle events (not 5)
- [ ] Document references 14 hook scripts (not 11)
- [ ] Lifecycle table includes all 7 events: UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Notification, TeammateIdle, TaskCompleted
- [ ] PreToolUse listing includes git-conflict-guard.sh
- [ ] Timeout range accounts for orchestration hooks (5s)

**[TEST]**:

- Grep hooks-system.md for the string "5 lifecycle" or "5 hook points" -- expect 0 matches
- Grep hooks-system.md for "TeammateIdle" -- expect >= 1 match
- Grep hooks-system.md for "TaskCompleted" -- expect >= 1 match
- Cross-reference event count with `jq 'keys' hooks.json | wc -l` (should report 7 top-level event keys inside `.hooks`)
- Verify PBT-5 (Documentation Consistency): event count in this file matches hooks.json

---

## T-2b: Fix hook-scripts.md Reference Document

**Wave**: 2
**Dependencies**: T-2a
**Files** (max 3):

1. `llmdoc/reference/hook-scripts.md` -- Edit to correct script count (11 -> 14), lifecycle count (5 -> 7), category count (6 -> 7), add Orchestration category section with teammate-idle.sh and task-completed.sh entries, add git-conflict-guard.sh to Security table

**Description**: hook-scripts.md is the per-script reference document. Update all counts and add missing script entries. The Orchestration category section must document both scripts with their lifecycle event, matcher pattern (`*`), and timeout (5s). Must align with hooks-system.md (T-2a) counts.

**Acceptance Criteria**:

- [ ] Header references 14 scripts, 7 lifecycle points, 7 categories
- [ ] Orchestration category section added with teammate-idle.sh and task-completed.sh
- [ ] Security table includes git-conflict-guard.sh entry
- [ ] All 14 scripts from hooks.json are documented
- [ ] Category list matches directory structure: security, optimization, quality, logging, permission, evaluation, notification, orchestration

**[TEST]**:

- Grep hook-scripts.md for "11 " -- expect 0 matches (no stale counts)
- Count unique script names mentioned -- expect 14
- Count category sections -- expect 7 or 8 (depending on how evaluation/routing is categorized)
- Verify PBT-5: counts match T-2a hooks-system.md and hooks.json

---

## T-2c: Fix how-to-create-a-hook.md Guide

**Wave**: 2
**Dependencies**: T-2a
**Files** (max 3):

1. `llmdoc/guides/how-to-create-a-hook.md` -- Edit to add TeammateIdle and TaskCompleted to lifecycle points list (5 -> 7), add orchestration hook creation guidance with wildcard matcher note, add orchestration hook template variant

**Description**: The hook creation guide only covers 5 lifecycle points. Add TeammateIdle and TaskCompleted with their specific characteristics: wildcard `*` matcher (no regex needed, per SC-7), different input payload schema (OQ-BLOCK-2: document field names as best-effort with TBD note), and orchestration-specific output protocol (`hookSpecificOutput.orchestrationDirective`).

**Acceptance Criteria**:

- [ ] Lifecycle points list includes all 7 events
- [ ] Orchestration hook section explains wildcard matcher usage
- [ ] Template variant for orchestration hooks provided (different from PreToolUse template)
- [ ] Input payload fields documented with TBD caveat for unverified schemas (OQ-BLOCK-2)

**[TEST]**:

- Grep how-to-create-a-hook.md for "5 lifecycle" -- expect 0 matches
- Grep for "TeammateIdle" -- expect >= 1 match
- Grep for "TaskCompleted" -- expect >= 1 match
- Verify PBT-5: lifecycle count matches T-2a hooks-system.md

---

## T-2d: Fix hooks CLAUDE.md User-Facing Documentation

**Wave**: 2
**Dependencies**: T-2a, T-2b
**Files** (max 3):

1. `plugins/hooks/CLAUDE.md` -- Edit to add all 14 hooks to the available-hooks table (currently 7), add missing categories to the Hook Categories table (currently 4, should be 8), update hook script template with `set -euo pipefail` and input validation

**Description**: The user-facing hooks CLAUDE.md is the most severely drifted document: it lists only 7 of 14 hooks and 4 of 8 categories. This is the document users consult when configuring hooks. Must add: killshell-guard, read-limit, auto-backup, auto-approve, file-permission, smart-notify, teammate-idle, task-completed. Must add categories: Optimization, Logging, Permission, Notification, Orchestration.

**Acceptance Criteria**:

- [ ] Available-hooks table lists all 14 hooks with correct lifecycle events
- [ ] Hook Categories table lists all 8 categories: Security, Quality, Logging, Routing, Optimization, Permission, Notification, Orchestration
- [ ] Hook script template includes `set -euo pipefail` and jq validation pattern
- [ ] No stale "7 hooks" or "4 categories" claims remain

**[TEST]**:

- Count rows in available-hooks table -- expect 14
- Count rows in Hook Categories table -- expect 8
- Grep for "set -euo pipefail" in template section -- expect 1 match
- Cross-check every script in hooks.json has a corresponding row in the available-hooks table

---

## T-3: Enhance Orchestration Hook Scripts

**Wave**: 3
**Dependencies**: T-2d
**Files** (max 3):

1. `plugins/hooks/scripts/orchestration/teammate-idle.sh` -- Rewrite to follow established hook convention (set -euo pipefail, color log functions, jq input validation, structured hookSpecificOutput, JSONL logging with rotation, fail-open error handling)
2. `plugins/hooks/scripts/orchestration/task-completed.sh` -- Rewrite with same convention as teammate-idle.sh
3. `plugins/hooks/hooks/hooks.json` -- Verify existing entries for TeammateIdle and TaskCompleted are correct (no edit expected; validation only)

**Description**: Both orchestration scripts (19 lines each) lack the established hook convention used by smart-notify.sh (189 lines) and git-conflict-guard.sh (97 lines). Rewrite both to include: shebang, header comment, `set -euo pipefail`, color-coded log functions (stderr), `input=$(cat)`, jq validation (`jq empty` check), field extraction, structured JSONL logging with 10k-line rotation (HC-11), orchestration directive output via `hookSpecificOutput`, and fail-open exit 0 + `{}` on any error (HC-9). Total processing must stay within 220ms budget against the 5s ceiling (HC-4). Monolithic per-script, no shared library (ADR-001).

**Acceptance Criteria**:

- [ ] Both scripts include `set -euo pipefail`
- [ ] Both scripts include color-coded log functions writing to stderr
- [ ] Both scripts validate input with `jq empty` before field extraction
- [ ] Both scripts produce structured `hookSpecificOutput` with `orchestrationDirective` and `metrics` fields
- [ ] Both scripts implement JSONL log rotation (10k threshold, tail 5k)
- [ ] Both scripts exit 0 and return `{}` on any error (fail-open)
- [ ] hooks.json TeammateIdle and TaskCompleted entries are correct (matcher: `*`, timeout: 5)

**[TEST]**:

- PBT-3 (Timeout): `time echo '{}' | bash teammate-idle.sh` -- expect < 5s (target < 300ms)
- PBT-4 (Fail-Open): `echo 'invalid' | bash teammate-idle.sh; echo $?` -- expect exit code 0 and output `{}`
- PBT-4 (Fail-Open): `echo '' | bash task-completed.sh; echo $?` -- expect exit code 0 and output `{}`
- PBT-8 (Schema): `echo '{"hook_event_name":"TeammateIdle"}' | bash teammate-idle.sh | jq empty` -- expect success
- PBT-8 (Schema): `echo '{"hook_event_name":"TaskCompleted"}' | bash task-completed.sh | jq empty` -- expect success
- Grep both scripts for `set -euo pipefail` -- expect 1 match each
- Grep both scripts for `jq empty` -- expect >= 1 match each
- Verify hooks.json unchanged: `jq '.hooks.TeammateIdle[0].hooks[0].timeout' hooks.json` -- expect 5

---

## T-4: Refine Agent Teams Section in /tpd:dev

**Wave**: 4
**Dependencies**: T-2d
**Files** (max 3):

1. `plugins/tpd/commands/dev.md` -- Edit Agent Teams section (lines 351-387) to implement 7-state state machine (ADR-003), team-state.json schema, explicit fallback triggers, iteration tracking, and activation/fallback UX messaging
2. `plugins/hooks/CLAUDE.md` -- Edit to add Agent Teams awareness note explaining TeammateIdle/TaskCompleted hooks fire during team mode
3. `plugins/tpd/CLAUDE.md` -- Edit to add Agent Teams configuration section with env var documentation and iteration limit

**Description**: The current Agent Teams section in dev.md is a documentation-only skeleton (37 lines) with 6 identified gaps: no team() API syntax, no state tracking, no hook integration, no fallback detection, no frontmatter field spec, and no actionable pseudo-code. Replace with a structured state machine definition (DETECT -> INIT_TEAM -> PROTOTYPE -> AUDIT -> ITERATE/COMPLETE/FALLBACK) with team-state.json schema, explicit fallback triggers (env var unset, iteration > 2 per HC-10, agent init failure), and UX messaging. Agent Teams API syntax documented as TBD pending official docs (SC-8). Cross-model mailbox remains forbidden (HC-6). Standard mode must remain completely unchanged (HC-7).

**Acceptance Criteria**:

- [ ] dev.md Agent Teams section defines all 7 states with transitions
- [ ] dev.md includes team-state.json schema definition
- [ ] dev.md specifies all fallback triggers (env var, iteration limit, init failure, API error)
- [ ] dev.md preserves standard mode (lines 1-350) completely unchanged
- [ ] dev.md cross-model mailbox prohibition stated explicitly (HC-6)
- [ ] dev.md iteration limit hardcoded at 2 (HC-10)
- [ ] hooks CLAUDE.md mentions orchestration hooks fire during Agent Teams
- [ ] tpd CLAUDE.md documents `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` env var

**[TEST]**:

- PBT-2 (Backward Compat): Verify dev.md lines 1-350 are unchanged (diff against main branch)
- PBT-6 (State Machine): Trace all state paths in the document -- verify every non-terminal state has a defined next state, and all paths reach COMPLETE or FALLBACK
- Grep dev.md for "FALLBACK" -- expect >= 3 matches (definition, triggers, UX message)
- Grep dev.md for "max_iterations.*2" or "iteration.*2" -- expect >= 1 match
- Grep dev.md for "cross-model mailbox" or "mailbox.\*forbidden" -- expect >= 1 match
- Grep tpd/CLAUDE.md for "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS" -- expect >= 1 match

---

## T-5: Update Memory Architecture Documentation

**Wave**: 5
**Dependencies**: T-1, T-3, T-4
**Files** (max 3):

1. `llmdoc/architecture/memory-architecture.md` -- Edit to add Auto Memory integration at Hot layer, add tech-rules migration note (`.claude/rules/` -> `.claude/memory/rules/`), document MEMORY.md 200-line cap with topic file linking strategy, document ownership boundaries (CLAUDE.md = context-memory, MEMORY.md = Auto Memory per HC-8)
2. `llmdoc/architecture/plugin-architecture.md` -- Edit to add agent memory scope distribution table (15 project, 8 user, 0 local), add Auto Memory path note, add MEMORY.md 200-line cap reference
3. `CLAUDE.md` -- Edit to add memory ownership boundary note if not already present, ensure tech-rules output path references `.claude/memory/rules/`

**Description**: Final wave. All prior tasks have completed, so documentation can reference the settled state: migrated tech-rules path (T-1), corrected hook counts (T-2a..T-2d), enhanced orchestration hooks (T-3), and Agent Teams state machine (T-4). The three-layer memory model table must be updated to include Auto Memory at the Hot layer with `.claude/rules/` as its exclusive path. The five-row ownership model: Hot/agent-memory (platform), Hot/auto-memory-rules (Auto Memory), Warm/workflow-memory (context-memory), Warm/tech-rules (context-memory), Cold/session-compactor (context-memory MCP).

**Acceptance Criteria**:

- [ ] memory-architecture.md Hot layer includes Auto Memory with `.claude/rules/` path
- [ ] memory-architecture.md includes tech-rules migration from `.claude/rules/` to `.claude/memory/rules/`
- [ ] memory-architecture.md documents MEMORY.md 200-line cap (HC-5)
- [ ] memory-architecture.md documents ownership boundaries: CLAUDE.md = context-memory, MEMORY.md = Auto Memory (HC-8)
- [ ] plugin-architecture.md includes scope distribution table (15 project, 8 user, 0 local)
- [ ] CLAUDE.md references correct tech-rules output path `.claude/memory/rules/`
- [ ] No document references the stale `.claude/rules/` path for tech-rules output

**[TEST]**:

- PBT-7 (Memory Ownership): Verify memory-architecture.md defines exclusive owners for every path in the ownership model
- Grep memory-architecture.md for "Auto Memory" -- expect >= 1 match
- Grep memory-architecture.md for ".claude/memory/rules/" -- expect >= 1 match
- Grep plugin-architecture.md for "15 project" or scope distribution data -- expect >= 1 match
- Grep all 3 files for `.claude/rules/{stack}` or `.claude/rules/index` -- expect 0 matches (stale path eliminated)

---

## Execution Summary

| Wave      | Tasks       | Parallelizable | Total Files | Gate Condition         |
| --------- | ----------- | -------------- | ----------- | ---------------------- |
| 1         | T-1         | N/A            | 1           | None                   |
| 2         | T-2a,b,c,d  | T-2b \|\| T-2c | 4           | T-1 complete           |
| 3         | T-3         | T-3 \|\| T-4   | 3           | Wave 2 complete        |
| 4         | T-4         | T-3 \|\| T-4   | 3           | Wave 2 complete        |
| 5         | T-5         | N/A            | 3           | T-1, T-3, T-4 complete |
| **Total** | **8 tasks** |                | **14 ops**  |                        |

## PBT Coverage Matrix

| PBT   | Property                     | Covered By Tasks |
| ----- | ---------------------------- | ---------------- |
| PBT-1 | Path Isolation               | T-1, T-5         |
| PBT-2 | Backward Compatibility       | T-4              |
| PBT-3 | Hook Timeout Compliance      | T-3              |
| PBT-4 | Hook Fail-Open               | T-3              |
| PBT-5 | Documentation Consistency    | T-2a, T-2b, T-2c |
| PBT-6 | State Machine Completeness   | T-4              |
| PBT-7 | Memory Ownership Exclusivity | T-5              |
| PBT-8 | Hook Output Schema           | T-3              |
