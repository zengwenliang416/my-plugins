# Tasks: integrate-cc-v2133-features

Status: Plan complete (8 tasks, 5 waves, 14 file operations)
Plan: `artifacts/plan/plan.md`

## T-1: Migrate tech-rules-generator output path

**Wave**: 1 | **Dependencies**: None

**Files** (1):

1. `plugins/context-memory/skills/tech-rules-generator/SKILL.md` - Replace `.claude/rules/` with `.claude/memory/rules/` at 4 locations

**Success**: Zero `.claude/rules/` references in SKILL.md; >= 4 `.claude/memory/rules/` references present.

---

## T-2a: Fix hooks-system.md canonical reference

**Wave**: 2 | **Dependencies**: T-1

**Files** (1):

1. `llmdoc/architecture/hooks-system.md` - Correct event count (5→7), hook count (11→14), add TeammateIdle/TaskCompleted

**Success**: Document references 7 lifecycle events, 14 hook scripts, all 7 events listed.

---

## T-2b: Fix hook-scripts.md reference document

**Wave**: 2 | **Dependencies**: T-2a

**Files** (1):

1. `llmdoc/reference/hook-scripts.md` - Correct counts, add Orchestration category, add git-conflict-guard

**Success**: Header references 14 scripts, 7 lifecycle points, 7 categories.

---

## T-2c: Fix how-to-create-a-hook.md guide

**Wave**: 2 | **Dependencies**: T-2a | **Parallel with**: T-2b

**Files** (1):

1. `llmdoc/guides/how-to-create-a-hook.md` - Add TeammateIdle/TaskCompleted, orchestration template variant

**Success**: Lifecycle points list includes all 7 events with orchestration template.

---

## T-2d: Fix hooks CLAUDE.md user-facing documentation

**Wave**: 2 | **Dependencies**: T-2a, T-2b

**Files** (1):

1. `plugins/hooks/CLAUDE.md` - Add all 14 hooks to table (currently 7), all 8 categories (currently 4)

**Success**: Available-hooks table lists 14 hooks, Categories table lists 8 categories.

---

## T-3: Enhance orchestration hook scripts

**Wave**: 3 | **Dependencies**: T-2d | **Parallel with**: T-4

**Files** (3):

1. `plugins/hooks/scripts/orchestration/teammate-idle.sh` - Rewrite with full convention
2. `plugins/hooks/scripts/orchestration/task-completed.sh` - Rewrite with full convention
3. `plugins/hooks/hooks/hooks.json` - Verify entries (no edit expected)

**Success**: Both scripts produce valid JSON within 220ms, fail-open on invalid input, include JSONL logging with rotation.

---

## T-4: Refine Agent Teams section in /tpd:dev

**Wave**: 4 | **Dependencies**: T-2d | **Parallel with**: T-3

**Files** (3):

1. `plugins/tpd/commands/dev.md` - Replace skeleton with 7-state state machine
2. `plugins/hooks/CLAUDE.md` - Add Agent Teams awareness note
3. `plugins/tpd/CLAUDE.md` - Document env var and iteration limit

**Success**: `/tpd:dev` works with and without `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`; all state paths reach terminal state.

---

## T-5: Update memory architecture documentation

**Wave**: 5 | **Dependencies**: T-1, T-3, T-4

**Files** (3):

1. `llmdoc/architecture/memory-architecture.md` - Add Auto Memory to Hot layer, ownership boundaries
2. `llmdoc/architecture/plugin-architecture.md` - Add scope distribution table
3. `CLAUDE.md` - Update memory path references

**Success**: Three-layer model includes Auto Memory; no stale `.claude/rules/` references for tech-rules.
