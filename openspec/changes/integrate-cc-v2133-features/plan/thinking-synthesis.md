---
generated_at: "2026-02-06T16:35:00Z"
synthesizer_version: "1.0"
boundaries_integrated:
  [
    "hooks-orchestration",
    "agent-definitions",
    "workflow-commands",
    "memory-system",
  ]
models_used: ["codex", "gemini"]
depth: ultra
---

# Constraint Synthesis Report

## Synthesis Overview

- **Participating Boundaries**: hooks-orchestration, agent-definitions, workflow-commands, memory-system
- **Thinking Depth**: ultra
- **Synthesis Method**: Cross-boundary deduplication + multi-model consensus analysis
- **Data Sources**: 4 explore-\*.json + codex-thought.md + gemini-thought.md

## Constraint Set

### Hard Constraints

**HC-1: .claude/rules/ Namespace Collision (BLOCKING)**

- Source: memory-system + codex + gemini (all converge)
- tech-rules-generator writes `{stack}.md` + `index.json` to `.claude/rules/`
- Auto Memory also writes path-scoped rules to `.claude/rules/*.md`
- Two independent writers to same directory = data corruption risk
- **Must resolve BEFORE any Auto Memory integration**

**HC-2: Skills Cannot Use Memory Frontmatter**

- Source: agent-definitions + codex HC-2
- `memory: user|project|local` is agent-only in Claude Code platform
- 4 plugins (brainstorm, context-memory, refactor, hooks) are skills-only
- These plugins CANNOT benefit from Agent Memory without architectural change
- Platform limitation, not design choice

**HC-3: Agent Teams Requires Experimental Flag + Fallback**

- Source: workflow-commands + codex HC-3 + gemini consensus
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` must be explicitly set
- Research Preview -- API may change without notice
- ALL Agent Teams integrations MUST fallback to Task subagent mode when unset
- Zero behavior change for users who don't opt in

**HC-4: Hook 5-Second Timeout Ceiling**

- Source: hooks-orchestration C-5 + codex HC-1
- Platform-enforced, cannot be overridden
- All TeammateIdle/TaskCompleted logic MUST complete within 5s
- No synchronous network calls or heavy I/O allowed
- Workaround: async background processes (pattern from smart-notify.sh)

**HC-5: MEMORY.md 200-Line Truncation**

- Source: agent-definitions + codex HC-5
- Only first 200 lines auto-injected into agent system prompt
- Content beyond line 200 silently dropped
- Must use linked topic files for extensive memory

**HC-6: Cross-Model Mailbox Prohibition in /tpd:dev**

- Source: workflow-commands CONSTRAINT-WC-02 + codex HC-6
- Existing Agent Teams skeleton (lines 351-387) explicitly forbids cross-model messaging
- codex-implementer cannot message gemini-implementer
- This constraint MUST be preserved

**HC-7: Backward Compatibility Gate**

- Source: codex HC-8 + gemini consensus
- All 7 plugins MUST function identically when v2.1.33 features are NOT enabled
- No new required dependencies on experimental features
- Existing workflows must pass without modification

**HC-8: CLAUDE.md Ownership Must Be Singular**

- Source: memory-system + gemini consensus #4
- Either context-memory owns CLAUDE.md generation, or Auto Memory does
- Concurrent writes produce inconsistent project instructions
- Must define clear ownership boundary

### Soft Constraints

**SC-1: Agent Teams Only for /tpd:dev**

- Source: workflow-commands analysis (all 9 commands classified)
- Only /tpd:dev has iterative cycle (prototype → audit → fix) benefiting from Agent Teams
- Fork-join patterns (/thinking, /commit, /ui-design) are better served by Task subagents
- Sequential/skill-only (/init, /brainstorm, /refactor, /memory) have zero Agent Teams applicability

**SC-2: Do Not Convert Skills-Only Plugins to Agents**

- Source: agent-definitions + gemini consensus #2
- 4 skill-only plugins lack agents by design
- Converting solely for memory frontmatter adds unjustified maintenance cost
- Only convert if compelling per-plugin case exists

**SC-3: Maintain Existing Memory Scope Assignments**

- Source: agent-definitions (scope_correctness_assessment: all_correct)
- 15 agents: `project` scope (investigation, implementation, generation)
- 8 agents: `user` scope (constraint, audit, validation, design patterns)
- 0 agents: `local` scope
- Current assignments follow consistent, correct convention

**SC-4: Auto Memory Should Defer to context-memory Where Overlap Exists**

- Source: codex SC-3 + memory-system analysis
- context-memory provides curated, structured memory management
- Auto Memory provides automatic, unstructured learning
- Curated output should take precedence where both cover same concern

**SC-5: Documentation Correction Is a Prerequisite**

- Source: hooks-orchestration C-1 + codex SC-4 + gemini consensus #5
- Docs claim 5 lifecycle points / 11 scripts; reality is 7 events / 13 scripts
- Documentation must be reconciled BEFORE adding new hook behaviors
- Files to update: hooks-system.md, hook-scripts.md, how-to-create-a-hook.md, CLAUDE.md

**SC-6: Hook Enhancement Logging-First**

- Source: hooks-orchestration + codex trade-off analysis
- Until CU-1 (return semantics) is resolved, hooks should enhance logging+metrics
- Orchestration logic (auto-assignment) is optional/future pending platform confirmation

## Dependencies & Risks

### Dependencies

| ID  | Dependency                                                 | Source              | Criticality                       |
| --- | ---------------------------------------------------------- | ------------------- | --------------------------------- |
| D-1 | Claude Code v2.1.33+ hook event system                     | hooks-orchestration | Required                          |
| D-2 | jq for JSON parsing in hook scripts                        | hooks-orchestration | Required                          |
| D-3 | Agent Teams env var for TeammateIdle/TaskCompleted to fire | workflow-commands   | Required for Agent Teams features |
| D-4 | MCP core_memory for session-compactor and workflow-memory  | memory-system       | Optional (local fallback exists)  |
| D-5 | smart-notify.sh for notification dispatch patterns         | hooks-orchestration | Reuse target                      |
| D-6 | llmdoc/ documentation system                               | hooks-orchestration | Must update                       |
| D-7 | Existing three-layer memory architecture (Hot/Warm/Cold)   | memory-system       | Must align                        |

### Risks

| ID  | Severity     | Risk                                                           | Source                            | Mitigation                                                   |
| --- | ------------ | -------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| R-1 | **CRITICAL** | .claude/rules/ dual-write data corruption                      | memory-system, codex, gemini      | Namespace separation: tech-rules uses subdirectory or prefix |
| R-2 | **HIGH**     | Hook return semantics unknown - may build dead code            | hooks-orchestration, codex CU-1   | Empirical test before design; default to logging-only        |
| R-3 | **HIGH**     | Agent Teams Research Preview instability                       | workflow-commands, codex          | Feature flag + fallback path mandatory                       |
| R-4 | **MEDIUM**   | Hook timeout (5s) exceeded by enhanced logic                   | hooks-orchestration, codex PERF-1 | Async background processes (smart-notify.sh pattern)         |
| R-5 | **MEDIUM**   | CLAUDE.md content drift between Auto Memory and context-memory | memory-system                     | Define singular ownership per output path                    |
| R-6 | **MEDIUM**   | Documentation drift worsens (7/13 vs 5/11)                     | hooks-orchestration               | Fix docs BEFORE adding new hook behaviors                    |
| R-7 | **MEDIUM**   | Cross-model isolation breach via Agent Teams messaging         | workflow-commands                 | Preserve cross-model mailbox prohibition                     |
| R-8 | **LOW**      | Memory file proliferation (23 agents × scope dirs)             | agent-definitions, codex SCALE-1  | 200-line cap + topic file linking                            |
| R-9 | **LOW**      | Log file growth without rotation (JSONL append-only)           | hooks-orchestration               | Add retention policy (7-day, max count)                      |

## Success Criteria (Hints)

### Verifiable Outcomes

1. Zero `.claude/rules/` filename collisions between tech-rules-generator and Auto Memory (concurrent execution test)
2. All hook scripts execute correct documented input schemas (schema validation at entry)
3. TeammateIdle/TaskCompleted hooks produce structured logs within 5s wall-clock time
4. /tpd:dev Agent Teams mode produces equivalent or better output vs Task subagent mode (A/B comparison)
5. All 23 agent memory scope assignments validated as intentional (audit checklist)
6. All 7 plugins pass existing workflows with v2.1.33 env vars both set and unset
7. Documentation accurately reflects 7 lifecycle events, 13+ scripts, and actual input schemas
8. No agent MEMORY.md exceeds 200 lines (topic file linking used where needed)
9. Hook scripts follow established convention (set -euo pipefail, color-coded stderr, JSON stdout)
10. Agent Teams adoption is opt-in per workflow, not global switch

### Task Splitting Rule Application

The integration touches >3 files per concern area. Sub-tasks MUST be split:

| Sub-Task                                  | Max Files | Focus                                                                    |
| ----------------------------------------- | --------- | ------------------------------------------------------------------------ |
| ST-1: .claude/rules/ collision resolution | 3         | tech-rules-generator path change + index update + memory-architecture.md |
| ST-2: Hook documentation reconciliation   | 3         | hooks-system.md + hook-scripts.md + how-to-create-a-hook.md              |
| ST-3: Hook script enhancement             | 3         | teammate-idle.sh + task-completed.sh + hooks.json                        |
| ST-4: /tpd:dev Agent Teams refinement     | 3         | dev.md Agent Teams section + hooks CLAUDE.md + state tracking            |
| ST-5: Memory architecture documentation   | 3         | memory-architecture.md + plugin-architecture.md + CLAUDE.md              |

## Open Questions

### Priority 1 (Blocking)

1. **OQ-BLOCK-1**: Can TeammateIdle/TaskCompleted hooks return actionable responses (assign tasks, trigger workflows), or are they observation-only? This determines the entire hook enhancement strategy. _(Source: hooks-orchestration OQ-2, codex CU-1, gemini consensus #7)_

2. **OQ-BLOCK-2**: What is the exact JSON payload schema that Claude Code v2.1.33 sends to TeammateIdle and TaskCompleted hooks? The documented fields and implemented fields currently differ. _(Source: hooks-orchestration OQ-1, codex CU-3)_

3. **OQ-BLOCK-3**: Does Auto Memory write to `.claude/rules/*.md` automatically? If so, what naming convention does it use? This determines the collision mitigation strategy. _(Source: memory-system OQ-1, codex CU-2)_

### Priority 2 (Design Decisions)

4. **OQ-DESIGN-1**: Should tech-rules-generator output be relocated from `.claude/rules/` to `.claude/memory/rules/` to avoid path collision? _(Source: memory-system OQ-3)_

5. **OQ-DESIGN-2**: Should context-memory retain ownership of CLAUDE.md generation, with Auto Memory restricted to MEMORY.md only? _(Source: memory-system, gemini consensus #4)_

6. **OQ-DESIGN-3**: What does the 'matcher' field match against for TeammateIdle/TaskCompleted events? For PreToolUse it matches tool_name. For orchestration events, does it match teammate_name, task_id, agent_type? _(Source: hooks-orchestration OQ-3)_

### Priority 3 (Future Considerations)

7. **OQ-FUTURE-1**: Should brainstorm, context-memory, or refactor plugins eventually introduce agent .md files for memory persistence? Or is skills-only architecture intentional and permanent? _(Source: agent-definitions OQ-1)_

8. **OQ-FUTURE-2**: Should orchestration hooks integrate with smart-notify.sh for multi-channel notifications on team events? _(Source: hooks-orchestration OQ-5)_

9. **OQ-FUTURE-3**: How does Agent memory interact with Agent Teams? Do teammates inherit or share memory? _(Source: agent-definitions OQ-7)_

## Multi-Model Supplements

### Codex Supplement

**Unique contributions**:

- Sub-problem resolution order: SP1 (memory collision) → SP2 (hooks) → SP3 (agent memory, parallel) → SP4 (Agent Teams) → SP5 (docs)
- Security risk: Auto Memory may persist sensitive data (API keys) into .claude/rules/
- Performance risk: 23 agents × MEMORY.md reads = linear disk I/O scaling on startup
- Trade-off matrix: 4 decision points with Option A/B analysis

### Gemini Supplement

**Unique contributions**:

- 5-stream parallel analysis (problem essence, existing constraints, user perspective, long-term, risk boundaries)
- UX constraints: command parity, memory transparency, Agent Teams feedback visibility, error clarity
- Strategic insight: context-memory's role shifts from "memory creator" to "memory curator/organizer" if Auto Memory handles persistence
- 4 divergent points between streams requiring resolution (scope review, Auto Memory depth, hook ambition, skills-only memory)
- 5 critical failure modes with mitigation constraints

## Boundary Contributions

| Boundary            | Key Findings                                                                                                                              | Key Constraints                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| hooks-orchestration | 7 events / 13 scripts (not 5/11). Skeleton scripts are 19-line logging-only. smart-notify.sh is reuse target (189 lines, 5 channels).     | 5s timeout, unknown return semantics, documentation drift, no input validation                                                 |
| agent-definitions   | 23 agents across 3 plugins, ALL have memory frontmatter. 15 project / 8 user / 0 local. 4 plugins have zero agents (skills-only).         | Skills cannot use memory frontmatter. All scope assignments already correct. No changes needed to existing agents.             |
| workflow-commands   | 9 commands across 6 plugins. Only /tpd:dev benefits from Agent Teams (iterative cycle). All others are fork-join or sequential.           | Cross-model mailbox prohibition. File-based communication paradigm. Must support both Task and Agent Teams modes.              |
| memory-system       | 16+ subcommands, three-layer architecture (Hot/Warm/Cold). tech-rules-generator collision with .claude/rules/. Session compactor overlap. | Path collision is CRITICAL. CLAUDE.md dual management risk. Skills can't use memory frontmatter. REFACTOR-PLAN.md in progress. |
