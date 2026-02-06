---
generated_at: "2026-02-06T00:15:00Z"
synthesizer_version: "1.0"
boundaries_integrated:
  [
    "agent-definitions",
    "hook-system",
    "workflow-orchestration",
    "memory-system",
  ]
models_used: ["codex", "gemini"]
depth: deep
---

# Constraint Synthesis Report

## Synthesis Overview

- **Participating Boundaries**: agent-definitions, hook-system, workflow-orchestration, memory-system
- **Thinking Depth**: deep
- **Synthesis Method**: 4-boundary exploration + dual-model (Codex/Gemini) constraint analysis
- **Scope**: 4 features × 7 plugins (23 agents, 50+ skills, 12 hooks)

## Constraint Set

### Hard Constraints

| ID    | Constraint                                                                                                                                                                      | Source                                | Impact                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------- |
| HC-1  | **UI-Design frontmatter migration is Phase 0 prerequisite**. 9 agents lack YAML frontmatter; `memory` and `Task(agent_type)` require it.                                        | agent-definitions, codex, gemini      | Blocks all v2 features for ui-design  |
| HC-2  | **Backward compatibility: unknown frontmatter fields must be silently ignored**. If pre-v2.1.32 CLI errors on `memory` field, a version gate is needed.                         | agent-definitions, codex              | Blocks rollout to mixed-version teams |
| HC-3  | **thinking.md "NEVER background" is inviolable**. Explicit line 157: "NEVER RUN background, JUST RUN AND WAIT." Agent Teams async model is incompatible.                        | workflow-orchestration, codex, gemini | Excludes thinking from Agent Teams    |
| HC-4  | **Dual-model diversity must be preserved**. Codex/Gemini intentionally produce independent perspectives. Agent Teams mailbox MUST NOT enable cross-model result sharing.        | workflow-orchestration, codex, gemini | Agent Teams design constraint         |
| HC-5  | **Filesystem `run_dir` remains sole source of truth for artifacts**. Agent Teams mailbox supplements orchestration only, never replaces artifact handoff.                       | workflow-orchestration, gemini (CC-1) | Architectural invariant               |
| HC-6  | **hooks.json is the single registration point**. NEVER declare hooks in plugin.json (causes duplicate detection errors per issues #29, #52, #103).                              | hook-system                           | Hook registration constraint          |
| HC-7  | **Agent names must be globally unique across all plugins**. Native memory uses agent name as directory key (`~/.claude/agent-memory/<name>/`).                                  | agent-definitions, codex              | Data integrity                        |
| HC-8  | **200-line MEMORY.md system prompt limit**. Agents exceeding this lose information silently. Compaction strategy required before deployment.                                    | memory-system, codex                  | Memory design constraint              |
| HC-9  | **Task(agent_type) applies at command level, not agent level**. All 23 agents are leaf agents; restrictions go in command `allowed-tools`, not agent `tools`.                   | agent-definitions, codex (HC-10)      | Architecture constraint               |
| HC-10 | **Hook event schemas for TeammateIdle/TaskCompleted are UNKNOWN**. Scripts must use defensive `jq '// empty'` parsing until schemas confirmed.                                  | hook-system, gemini (C2.5)            | Hard blocker for deterministic hooks  |
| HC-11 | **Agent Teams requires experimental flag**. All integration points need conditional fallback to current Task() patterns when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is unset. | workflow-orchestration, codex (HC-12) | Zero-change default behavior          |
| HC-12 | **50+ existing skills backward compatibility is non-negotiable**. No skill or hook may change behavior due to v2 integration.                                                   | gemini (CC-4), all boundaries         | Regression prevention                 |

### Soft Constraints

| ID    | Constraint                                                                              | Source                                | Rationale                                                |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| SC-1  | Per-command incremental migration; avoid big-bang.                                      | workflow-orchestration, gemini (UX-3) | Users adopt plugins selectively                          |
| SC-2  | Skip Agent Teams for commit (atomic fast-path; overhead unwanted).                      | workflow-orchestration                | Sub-second workflow; no inter-agent communication needed |
| SC-3  | Skip Agent Teams for brainstorm/refactor (zero Task() calls; disproportionate effort).  | workflow-orchestration                | No integration surface without fundamental redesign      |
| SC-4  | New hook scripts follow bash+jq convention (stdin JSON, stderr logging, stdout output). | hook-system                           | Consistency with 12 existing scripts                     |
| SC-5  | New `scripts/orchestration/` directory for agent-lifecycle hooks.                       | hook-system                           | No existing category fits                                |
| SC-6  | Memory scope: 8 agents → user, 15 agents → project, 0 → local.                          | agent-definitions                     | Scope assignments from boundary analysis                 |
| SC-7  | Normalize tools format to YAML array (TPD uses array, commit uses comma-string).        | agent-definitions                     | Extensibility for Task() syntax                          |
| SC-8  | Each v2 feature needs explicit per-agent applicability criteria; no blanket adoption.   | gemini (CC-7)                         | Prevent complexity ceiling                               |
| SC-9  | Users must never configure two memory systems for basic workflows.                      | gemini (UX-1)                         | Cognitive overhead kills adoption                        |
| SC-10 | Agent Teams artifacts in run_dir must match current output format.                      | gemini (UX-2)                         | User debugging relies on artifact inspection             |

## Dependencies & Risks

### Dependencies (Deduplicated)

| ID    | Dependency                                                         | Blocks                                                      |
| ----- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| DEP-1 | Claude Code v2.1.32+ runtime                                       | `memory` frontmatter activation                             |
| DEP-2 | Claude Code v2.1.33+ runtime                                       | `Task(agent_type)` syntax, TeammateIdle/TaskCompleted hooks |
| DEP-3 | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` env var                   | All Agent Teams integration                                 |
| DEP-4 | UI-Design YAML frontmatter migration (SP-1)                        | All v2 features for 9 ui-design agents                      |
| DEP-5 | TeammateIdle/TaskCompleted input schema documentation              | Deterministic hook script implementation                    |
| DEP-6 | UI-Design typed agent migration (general-purpose → typed)          | Agent Teams for ui-design                                   |
| DEP-7 | Architecture doc updates (plugin-architecture.md, hooks-system.md) | Developer onboarding                                        |

### Critical Path

```
SP-1 (ui-design frontmatter) ──┬──> SP-2 (memory field) ──> SP-6 (coexistence docs)
                                ├──> SP-3 (task restrictions)
                                └──────────────────────────────> SP-5 (Agent Teams)
SP-4 (hook events) ─────────────────────────────────────────> SP-5 (Agent Teams)
```

### Risks (Deduplicated, Ranked)

| Rank | ID   | Risk                                                                              | Severity | Probability | Mitigation                                                                         |
| ---- | ---- | --------------------------------------------------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------- |
| 1    | R-1  | UI-Design frontmatter migration breaks agent behavior (wrong tools/model mapping) | HIGH     | MEDIUM      | Diff-compare informal vs YAML tool declarations; test each agent individually      |
| 2    | R-2  | Dual-model diversity loss via Agent Teams inter-messaging                         | HIGH     | MEDIUM      | Enforce no cross-model mailbox; codex/gemini teammates never share partial results |
| 3    | R-3  | Agent Teams breaks backward compat when env flag unset                            | HIGH     | LOW         | Conditional branching in all 5 command files; test both paths                      |
| 4    | R-4  | MEMORY.md 200-line overflow for high-frequency agents                             | MEDIUM   | HIGH        | Implement rotation/compaction instruction in agent system prompt                   |
| 5    | R-5  | Dual persistence confusion (native memory vs workflow-memory)                     | MEDIUM   | HIGH        | Document clear ownership: native=agent learnings, workflow-memory=structured state |
| 6    | R-6  | Hook event schema changes in future Claude Code versions                          | MEDIUM   | MEDIUM      | Defensive jq parsing; version-pin hook contracts                                   |
| 7    | R-7  | State machine (state.json) conflict with Agent Teams task tracking                | MEDIUM   | MEDIUM      | state.json remains authoritative; Agent Teams task list is supplemental            |
| 8    | R-8  | Memory scope misassignment (user vs project)                                      | MEDIUM   | LOW         | Follow the 8-user/15-project split; document rationale per agent                   |
| 9    | R-9  | Performance regression in commit atomic workflow                                  | LOW      | LOW         | Skip Agent Teams for commit entirely                                               |
| 10   | R-10 | REFACTOR-PLAN.md conflict in context-memory plugin                                | LOW      | MEDIUM      | Sequence native memory integration after MCP refactoring                           |

## Success Criteria (Hints)

1. All 23 agent `.md` files have valid YAML frontmatter with `memory` field and documented scope rationale
2. 5 command files have `Task(agent_type)` restrictions matching exact agent lists per command
3. `hooks.json` contains `TeammateIdle` and `TaskCompleted` top-level keys with at least one script each
4. All 7 command workflows execute identically to pre-integration baseline
5. When `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is unset, zero behavioral change
6. tpd:dev with Agent Teams shows reduced audit-fix orchestrator round-trips
7. Agent names verified unique across all 23 agents
8. UI-Design frontmatter migration preserves exact tool declarations (diff-verified)
9. Memory system has clear documented ownership boundaries (native vs workflow-memory vs session-compactor)
10. No modification to plugin.json for hooks (hooks.json only)

## Open Questions

| Priority | ID   | Question                                                                                                                            | Source                    |
| -------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **P0**   | OQ-1 | Does Claude Code pre-v2.1.32 silently ignore unknown frontmatter fields (e.g., `memory`)? If it errors, version gating is required. | agent-definitions Q1      |
| **P0**   | OQ-2 | What is the exact input JSON schema for TeammateIdle events? (teammate_name, agent_type, idle_duration, session context?)           | hook-system OQ-1          |
| **P0**   | OQ-3 | What is the exact input JSON schema for TaskCompleted events? (task_id, agent_name, result, duration?)                              | hook-system OQ-2          |
| **P1**   | OQ-4 | Does Agent Teams support typed `subagent_type` (like `tpd:investigation:boundary-explorer`) or only general-purpose teammates?      | workflow-orchestration Q1 |
| **P1**   | OQ-5 | How does Agent Teams handle synchronous execution patterns? thinking.md requires "JUST RUN AND WAIT."                               | workflow-orchestration Q3 |
| **P1**   | OQ-6 | Can TeammateIdle hooks output actionable responses (reassign work) or are they observational only?                                  | hook-system OQ-4          |
| **P2**   | OQ-7 | How does the 200-line MEMORY.md limit behave on overflow? Truncation? Error? Newest-first?                                          | codex uncertainty         |
| **P2**   | OQ-8 | Do Agent Teams mailbox messages bypass security hooks (PreToolUse/PostToolUse)?                                                     | codex security            |
| **P2**   | OQ-9 | Can Task(agent_type) restrictions reference agents from OTHER plugins (cross-plugin)?                                               | agent-definitions Q4      |

## Multi-Model Supplements

### Codex Supplement (Backend/Technical Perspective)

- Identified 12 hard constraints + 8 soft constraints with clear dependency chain
- Critical path analysis: SP-1 → SP-2/SP-3/SP-4 (parallel) → SP-6 → SP-5
- 4-phase implementation ordering with ui-design frontmatter as Phase 0 prerequisite
- Security considerations: memory storage path security, hook input validation, mailbox isolation
- **Key insight**: Task(agent_type) has near-zero immediate utility since all 23 agents are leaf agents

### Gemini Supplement (UX/Maintainability/Innovation Perspective)

- 3-stream analysis (UX, Maintainability, Innovation) producing 7 consensus constraints + 4 divergent points
- **Key divergence**: memory system presentation — UX wants unified interface, maintainability wants parallel systems, innovation wants eventual native-only
- **Key insight**: brainstorm/refactor have zero Task() calls but could be net-new Agent Teams capability (no backward compat concerns since there's nothing to break)
- Innovation opportunity: native agent memory enables genuine cross-session learning (workflow-memory only persists within session)
- Complexity ceiling risk: 23 agents × 4 features = 92 potential integration points; must apply explicit per-agent criteria

## Boundary Contributions

| Boundary               | Key Findings                                                                                     | Key Constraints                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| agent-definitions      | 23 agents (14 with YAML, 9 without); all are leaf agents; 8 user-scope / 15 project-scope        | HC-1 (frontmatter prerequisite), HC-7 (name uniqueness), HC-9 (Task at command level)  |
| hook-system            | 5 current events; tool-centric paradigm; TeammateIdle/TaskCompleted are agent-centric            | HC-6 (hooks.json only), HC-10 (schema unknown), SC-4/SC-5 (conventions)                |
| workflow-orchestration | 3 orchestration patterns; tpd:dev = best Agent Teams candidate; brainstorm/refactor = no benefit | HC-3 (never background), HC-4 (dual-model diversity), HC-5 (filesystem primary)        |
| memory-system          | context-memory has 0 agents; complementary systems; 200-line limit risk                          | HC-8 (MEMORY.md limit), SC-9 (single user interface), R-5 (dual persistence confusion) |

## Implementation Phase Summary

| Phase        | Work Items                                             | Parallelizable             | Blocked By             |
| ------------ | ------------------------------------------------------ | -------------------------- | ---------------------- |
| **Phase 0**  | UI-Design YAML frontmatter migration (9 files)         | No                         | Nothing                |
| **Phase 1a** | Add `memory` field to all 23 agents                    | Yes (parallel with 1b, 1c) | Phase 0                |
| **Phase 1b** | Add Task(agent_type) restrictions to 5 commands        | Yes (parallel with 1a, 1c) | Phase 0                |
| **Phase 1c** | Add TeammateIdle/TaskCompleted to hooks.json + scripts | Yes (parallel with 1a, 1b) | Nothing                |
| **Phase 2**  | Document memory system coexistence strategy            | No                         | Phase 1a               |
| **Phase 3**  | Agent Teams for tpd:dev (conditional, behind flag)     | No                         | Phase 0, 1a, 1b, 1c, 2 |
| **Phase 4**  | Deferred: Agent Teams for ui-design, tpd:thinking/plan | No                         | Phase 3 validation     |
| **SKIP**     | Agent Teams for brainstorm, refactor, commit           | N/A                        | Low/zero benefit       |
