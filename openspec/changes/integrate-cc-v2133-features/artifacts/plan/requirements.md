# Requirement Specification

## Metadata

- Parse Time: 2026-02-06T16:32:00Z
- Task Type: fullstack
- Frontend Weight: 0%
- Backend Weight: 100%
- Thinking Phase: Integrated (constraints, clarifications, boundaries reused)

## Requirement Overview

Selectively adopt Claude Code v2.1.33 features (Auto Memory path separation, hook documentation/enhancement, Agent Teams refinement, memory architecture docs) into 7 ccg-workflows plugins while maintaining full backward compatibility.

## Functional Requirements

| ID     | Requirement Description                                                                     | Priority | Acceptance Criteria                                                                                    |
| ------ | ------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| FR-001 | Migrate tech-rules-generator output from `.claude/rules/` to `.claude/memory/rules/`        | P1       | `ls .claude/rules/` contains NO tech-rules-generator files; `ls .claude/memory/rules/` contains output |
| FR-002 | Update tech-rules-generator SKILL.md with new output path                                   | P1       | SKILL.md references `.claude/memory/rules/` as output directory                                        |
| FR-003 | Update index.json path references for tech-rules output                                     | P1       | index.json paths point to `.claude/memory/rules/{stack}.md`                                            |
| FR-004 | Reconcile hook documentation to reflect 7 lifecycle events / 13+ scripts                    | P1       | hooks-system.md, hook-scripts.md, how-to-create-a-hook.md all reference correct counts                 |
| FR-005 | Enhance TeammateIdle hook script with structured JSON logging and orchestration directives  | P2       | teammate-idle.sh outputs structured JSON with `hookSpecificOutput`; completes within 5s                |
| FR-006 | Enhance TaskCompleted hook script with structured JSON logging and orchestration directives | P2       | task-completed.sh outputs structured JSON with `hookSpecificOutput`; completes within 5s               |
| FR-007 | Update hooks.json with correct event definitions for TeammateIdle/TaskCompleted             | P2       | hooks.json accurately reflects all 7 lifecycle events and 13 scripts                                   |
| FR-008 | Refine /tpd:dev Agent Teams section for production readiness                                | P2       | dev.md Agent Teams section includes feature flag check, fallback path, cross-model prohibition         |
| FR-009 | Add Agent Teams feature flag detection with fallback to Task subagents                      | P2       | /tpd:dev works identically when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is unset                        |
| FR-010 | Update memory-architecture.md for Auto Memory integration                                   | P3       | memory-architecture.md documents Auto Memory → Hot layer mapping and ownership boundaries              |
| FR-011 | Update plugin-architecture.md with v2.1.33 feature integration notes                        | P3       | plugin-architecture.md reflects agent memory frontmatter status across all plugins                     |
| FR-012 | Update root CLAUDE.md with Auto Memory coexistence rules                                    | P3       | CLAUDE.md documents ownership boundary: CLAUDE.md = context-memory, MEMORY.md = Auto Memory            |

## Non-Functional Requirements

| ID      | Category      | Constraint Description                                                                                          |
| ------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| NFR-001 | Compatibility | All 7 plugins MUST produce identical results with and without v2.1.33 env vars (HC-7)                           |
| NFR-002 | Performance   | Hook scripts MUST complete within 5s wall-clock time (HC-4)                                                     |
| NFR-003 | Safety        | No cross-model mailbox messaging in Agent Teams mode (HC-6)                                                     |
| NFR-004 | Robustness    | Hook scripts MUST include `set -euo pipefail` and input schema validation                                       |
| NFR-005 | Scalability   | No agent MEMORY.md exceeds 200 lines; use linked topic files for overflow (HC-5)                                |
| NFR-006 | Ownership     | `.claude/rules/` exclusively owned by Auto Memory; `.claude/memory/rules/` by tech-rules-generator (HC-1, HC-8) |
| NFR-007 | Degradation   | Agent Teams hooks degrade gracefully to logging+metrics if return semantics are observation-only                |

## Constraints

- **Technical Constraints**:
  - Claude Code v2.1.33+ required for TeammateIdle/TaskCompleted events (D-1)
  - `jq` required for JSON parsing in hook scripts (D-2)
  - Agent Teams env var required for orchestration hooks to fire (D-3)
  - Skills cannot use memory frontmatter - platform limitation (HC-2)
  - Existing memory scope assignments (15 project, 8 user) are correct and unchanged (SC-3)

- **Design Constraints**:
  - Agent Teams ONLY for /tpd:dev iterative cycle (SC-1)
  - No conversion of skills-only plugins to agents (SC-2)
  - Auto Memory defers to context-memory where overlap exists (SC-4)
  - Documentation fixes BEFORE hook enhancement (SC-5)
  - Hook enhancement is logging-first, orchestration is optional (SC-6)

- **Compatibility Constraints**:
  - Zero behavior change for users not opting in to v2.1.33 features
  - No public command signature changes
  - All existing workflows pass without modification

## Assumptions & Dependencies

- Assumptions:
  - Claude Code v2.1.33 hook event system is stable for TeammateIdle/TaskCompleted
  - `smart-notify.sh` async pattern is reusable for orchestration hooks
  - Three-layer memory architecture (Hot/Warm/Cold) remains valid

- Dependencies:
  - D-1: Claude Code v2.1.33+ hook event system (Required)
  - D-2: jq for JSON parsing in hook scripts (Required)
  - D-3: Agent Teams env var for orchestration events (Required for AT features)
  - D-4: MCP core_memory for session-compactor (Optional, local fallback exists)
  - D-5: smart-notify.sh for notification dispatch patterns (Reuse target)
  - D-6: llmdoc/ documentation system (Must update)
  - D-7: Three-layer memory architecture (Must align)

## Pre-Resolved Decisions (from Thinking Phase)

| Decision                 | Resolution                                                                     | Source      |
| ------------------------ | ------------------------------------------------------------------------------ | ----------- |
| Hook return semantics    | Assume actionable, degrade gracefully                                          | OQ-BLOCK-1  |
| .claude/rules/ collision | Migrate tech-rules to .claude/memory/rules/                                    | OQ-BLOCK-3  |
| CLAUDE.md ownership      | Layered coexistence: context-memory owns CLAUDE.md, Auto Memory owns MEMORY.md | OQ-DESIGN-2 |

## Items to Clarify

- [x] Hook return semantics (resolved: assume actionable)
- [x] .claude/rules/ path collision (resolved: migrate tech-rules)
- [x] CLAUDE.md ownership (resolved: layered coexistence)
- [ ] Exact JSON payload schema for TeammateIdle/TaskCompleted (needs empirical verification - non-blocking, design defensively)
- [ ] What matcher field matches against for orchestration events (non-blocking, use wildcard initially)
- [ ] Agent memory interaction with Agent Teams teammates (future consideration, not blocking)

## Sub-Task Structure (3-File Rule Compliant)

| Sub-Task                      | Files (max 3)                                             | Dependencies     | Test Requirement                                  |
| ----------------------------- | --------------------------------------------------------- | ---------------- | ------------------------------------------------- |
| ST-1: Migrate tech-rules path | SKILL.md, consumers, memory-architecture.md               | None             | Verify no files in .claude/rules/ from tech-rules |
| ST-2: Fix hook documentation  | hooks-system.md, hook-scripts.md, how-to-create-a-hook.md | ST-1             | Docs reflect 7 events / 13 scripts                |
| ST-3: Enhance hook scripts    | teammate-idle.sh, task-completed.sh, hooks.json           | ST-2             | Scripts output valid JSON within 5s               |
| ST-4: Refine Agent Teams      | dev.md, hooks CLAUDE.md, state tracking                   | ST-2             | /tpd:dev works with and without feature flag      |
| ST-5: Update memory docs      | memory-architecture.md, plugin-architecture.md, CLAUDE.md | ST-1, ST-3, ST-4 | Docs match implementation                         |
