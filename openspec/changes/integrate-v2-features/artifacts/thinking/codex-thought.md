---
generated_at: 2026-02-06T01:30:00Z
model: claude-opus-4-6 (codex-cli unavailable, fallback to Claude ultra thinking)
level: medium
session_id: constraint-analysis-integrate-v2-features
---

# Codex Constraint Analysis

## Original Question

Integrate Claude Code v2.1.32-33 new features (Agent Teams, Agent Memory, TeammateIdle/TaskCompleted hooks, Task(agent_type) restrictions) into ccg-workflows (7 plugins, 23 agents, 50+ skills, 12 hooks).

## Level 1: Problem Decomposition

### Core Problem

Four independent Claude Code platform features must be integrated into an existing multi-plugin workflow system without breaking backward compatibility, violating architectural invariants, or degrading performance.

### Sub-Problems

| ID   | Sub-Problem                                          | Depends On             | Resolution Order                 |
| ---- | ---------------------------------------------------- | ---------------------- | -------------------------------- |
| SP-1 | UI-Design frontmatter migration (9 agents lack YAML) | Nothing                | **First** (prerequisite)         |
| SP-2 | Agent memory frontmatter addition (23 agents)        | SP-1                   | Second                           |
| SP-3 | Task(agent_type) restriction addition (5 commands)   | SP-1                   | Second (parallel with SP-2)      |
| SP-4 | Hook events (TeammateIdle/TaskCompleted)             | Nothing                | Second (parallel with SP-2/SP-3) |
| SP-5 | Agent Teams orchestration (tpd:dev, ui-design)       | SP-1, SP-2, SP-3, SP-4 | **Last**                         |
| SP-6 | Memory system coexistence strategy                   | SP-2                   | Third (after SP-2)               |

### Critical Path

```
SP-1 (ui-design frontmatter) ──┬──> SP-2 (memory field) ──> SP-6 (coexistence)
                                ├──> SP-3 (task restrictions)
                                └──────────────────────────────> SP-5 (Agent Teams)
SP-4 (hook events) ─────────────────────────────────────────> SP-5 (Agent Teams)
```

## Level 2: Constraint Mapping

### Hard Constraints

**HC-1: UI-Design Frontmatter Prerequisite**
All 9 ui-design agents lack YAML frontmatter. The `memory` and `Task(agent_type)` features require YAML frontmatter. UI-design frontmatter migration MUST complete before any v2 feature can apply to ui-design agents.

**HC-2: Backward Compatibility with Pre-v2.1.32 CLI**
Adding `memory` frontmatter field MUST NOT break execution on Claude Code versions that do not recognize it. Requires verification that unknown frontmatter fields are silently ignored (not errored). If they are NOT ignored, a version gate is needed.

**HC-3: "NEVER Background" Constraint in thinking.md**
`thinking.md` line 157 explicitly states: "NEVER RUN boundary-explorer background, NEVER USE get task output, JUST RUN AND WAIT." Agent Teams' async-first model directly conflicts with this. Any Agent Teams integration in thinking phase MUST preserve synchronous execution semantics.

**HC-4: Dual-Model Independence Principle**
The system intentionally runs Codex and Gemini as independent perspectives for diversity. Agent Teams inter-agent messaging MUST NOT allow codex-_ and gemini-_ teammates to share partial results, or the diversity principle is violated.

**HC-5: Filesystem-Only Inter-Agent Communication**
All current agent communication flows through `${run_dir}/` filesystem artifacts. Agent Teams introduces mailbox-based direct messaging. Both channels MUST NOT be used for the same data (no dual-channel confusion). Filesystem remains the source of truth for artifacts.

**HC-6: hooks.json Single Registration Point**
Hooks MUST only be declared in `hooks/hooks.json`, NEVER in `plugin.json`. Duplicate declaration causes detection errors (tracked as recurring regressions #29, #52, #103).

**HC-7: Agent Name Global Uniqueness**
Native agent memory uses agent name as directory key (`~/.claude/agent-memory/<name>/`). All 23 agent names MUST be globally unique across all plugins. Current names are unique but no enforcement mechanism exists.

**HC-8: 200-Line MEMORY.md System Prompt Limit**
Native agent memory includes MEMORY.md content in system prompt, capped at 200 lines. Agents that accumulate significant learnings (context-analyzer, boundary-explorer) MUST have a compaction/rotation strategy or risk silent information loss.

**HC-9: Write Scope Isolation**
Agents write ONLY to `${run_dir}/`. Adding native memory (writes to `.claude/agent-memory/`) expands the write scope. This is a platform-managed expansion (not agent-initiated) but must be understood when auditing side effects.

**HC-10: Task(agent_type) Applies to Commands, Not Agents**
All 23 agents are leaf agents that do NOT spawn sub-agents via Task(). The restriction syntax belongs in command-level `allowed-tools` frontmatter (thinking.md, plan.md, dev.md, commit.md, ui-design.md), not in agent frontmatter.

**HC-11: Hook Event Schema Unknown**
Input JSON schemas for TeammateIdle and TaskCompleted events are undocumented. Hook scripts MUST use defensive parsing (`jq '// empty'` fallback pattern) for all fields until schemas are confirmed.

**HC-12: Experimental Feature Flag**
Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. All Agent Teams integration points MUST have conditional fallback to current Task() patterns when the flag is unset.

### Soft Constraints

**SC-1: Incremental Per-Command Migration**
Each of the 7 commands should be independently migratable to Agent Teams. Avoid "big bang" migration that requires all commands to change simultaneously.

**SC-2: Commit Workflow Atomic Fast-Path**
commit workflow is designed as atomic (Phases 1-5 without stopping). Agent Teams overhead SHOULD NOT degrade this sub-second workflow. Recommendation: skip Agent Teams for commit entirely.

**SC-3: Memory Scope Consistency**
The 8 user-scope and 15 project-scope agents identified in boundary exploration SHOULD follow the recommended scope assignments. Misassignment (user vs project) causes data leakage across projects or loss of cross-project learnings.

**SC-4: Existing Hook Script Conventions**
New TeammateIdle/TaskCompleted scripts SHOULD follow the bash+jq pattern used by all 12 existing scripts: stdin JSON input, stderr logging with colored prefixes, stdout JSON output, `set -euo pipefail`.

**SC-5: New Hook Script Directory**
A new `scripts/orchestration/` subdirectory SHOULD be created for agent-lifecycle hooks. No existing category (security, optimization, quality, logging, permission, evaluation, notification) semantically fits.

**SC-6: Memory System Clear Ownership**
Native agent memory and existing context-memory skills SHOULD have clearly documented non-overlapping responsibilities: native = auto-maintained per-agent learnings; workflow-memory = explicit structured workflow state; session-compactor = recovery snapshots.

**SC-7: Minimal Change for Low-Benefit Plugins**
brainstorm (zero Task() calls, skill-only) and refactor (zero Task() calls, sequential) SHOULD NOT be migrated to Agent Teams. The effort-to-benefit ratio is prohibitive.

**SC-8: Tools Format Normalization**
TPD agents use YAML array format for tools; commit agents use comma-separated strings. Task(agent_type) syntax addition SHOULD normalize to one format, preferring YAML array for extensibility.

### Trade-Off Points

**T-1: Agent Teams Sync vs Async for tpd:dev**
tpd:dev's iterative cycle (prototype -> audit -> fix) is the best Agent Teams candidate. However, the audit-fix loop currently uses explicit Hard Stops (AskUserQuestion). Agent Teams could automate this loop but removes user confirmation. Trade-off: automation speed vs user control.

**T-2: Native Memory vs MCP core_memory**
Native agent memory is simpler (native Read/Write, always available). MCP core_memory offers cross-agent sharing and server-side persistence. Trade-off: simplicity vs feature completeness. Both should coexist for now; eventual consolidation is a separate concern.

**T-3: ui-design Migration Depth**
ui-design uses `general-purpose` subagent_type for all 9 agents. Full Agent Teams adoption requires migration to typed agents first. Trade-off: migrate minimally (add frontmatter only, skip Agent Teams) vs full migration (typed agents + Agent Teams). Recommend: frontmatter first, Agent Teams deferred.

## Level 3: Risk Analysis

### Critical Risks

| ID  | Risk                                                           | Severity | Probability | Impact                                                                                       |
| --- | -------------------------------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------------- |
| R-1 | UI-design frontmatter migration breaks existing agent behavior | HIGH     | MEDIUM      | 9 agents malfunction if tools/model fields mapped incorrectly from informal markdown to YAML |
| R-2 | Agent Teams breaks backward compat when env flag unset         | HIGH     | LOW         | All Task()-based workflows fail if conditional fallback not implemented                      |
| R-3 | Dual-model diversity loss via Agent Teams inter-messaging      | HIGH     | MEDIUM      | Core architectural principle violated; constraint/audit quality degrades                     |

### Medium Risks

| ID  | Risk                                                          | Severity | Probability | Impact                                                                                                                   |
| --- | ------------------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| R-4 | MEMORY.md overflow for high-frequency agents                  | MEDIUM   | HIGH        | Silent information loss for agents exceeding 200-line limit                                                              |
| R-5 | Dual persistence confusion (native memory vs workflow-memory) | MEDIUM   | HIGH        | Developers/agents unclear which system to use, fragmented state                                                          |
| R-6 | Hook event schema changes in future Claude Code versions      | MEDIUM   | MEDIUM      | Scripts break on schema evolution since Agent Teams is experimental                                                      |
| R-7 | Memory scope misassignment (user vs project)                  | MEDIUM   | LOW         | Data leaks across projects (user-scope on project-specific agent) or learning loss (project-scope on transferable agent) |
| R-8 | State machine conflict with Agent Teams task tracking         | MEDIUM   | MEDIUM      | TPD state.json and Agent Teams internal task state diverge, causing checkpoint failures                                  |

### Low Risks

| ID   | Risk                                               | Severity | Probability | Impact                                                                             |
| ---- | -------------------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------- |
| R-9  | Agent name collision in future agent additions     | LOW      | LOW         | Memory corruption if two agents share a name                                       |
| R-10 | Performance regression in commit atomic workflow   | LOW      | LOW         | Agent Teams overhead adds latency to sub-second workflow                           |
| R-11 | REFACTOR-PLAN.md conflict in context-memory plugin | LOW      | MEDIUM      | Concurrent change vectors (native memory + MCP refactoring) create merge conflicts |

### Security Considerations

- **Memory Storage Path Security**: `.claude/agent-memory/<name>/MEMORY.md` is readable by any process with filesystem access. User-scoped agents store at `~/.claude/agent-memory/` -- ensure no sensitive project data is persisted at user scope.
- **Hook Script Input Validation**: TeammateIdle/TaskCompleted hook inputs are from Claude Code platform, not user-controlled. Low injection risk but defensive jq parsing is still warranted.
- **Agent Teams Mailbox Isolation**: If Agent Teams messages bypass filesystem, they also bypass existing security hooks (PreToolUse, PostToolUse). Evaluate whether agent-to-agent messages need security filtering.

## Level 4: Dependency Analysis

### Feature Interdependencies

```
Agent Memory ←─── independent (no dependency on other features)
     │
     └──> requires: frontmatter on all agents (SP-1 for ui-design)

Task(agent_type) ←─── independent
     │
     └──> requires: frontmatter on all agents (SP-1 for ui-design)
     └──> applies to: commands (thinking.md, plan.md, dev.md, commit.md, ui-design.md)

Hook Events ←─── independent
     │
     └──> required by: Agent Teams (TeammateIdle/TaskCompleted fire during team execution)

Agent Teams ←─── depends on all three above
     │
     ├──> requires: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
     ├──> benefits from: Task(agent_type) restrictions (typed teammates)
     ├──> triggers: TeammateIdle/TaskCompleted hooks
     └──> benefits from: Agent Memory (teammates persist learnings)
```

### Implementation Ordering Constraints

**Phase 0 (Prerequisite): UI-Design Frontmatter Migration**

- Blocks: SP-2, SP-3 for ui-design agents
- Effort: 9 files, mechanical transformation
- Risk: Moderate (informal -> formal mapping must be exact)

**Phase 1 (Foundation, parallelizable):**

- SP-2: Add `memory` field to all 23 agents (14 with existing frontmatter + 9 from Phase 0)
- SP-3: Add `Task(agent_type)` restrictions to 5 command files
- SP-4: Add TeammateIdle/TaskCompleted to hooks.json + 2 new scripts
- These three are independent and can proceed in parallel

**Phase 2 (Integration):**

- SP-6: Document memory system coexistence strategy
- Depends on: SP-2 complete (need to understand which agents have what scope)

**Phase 3 (Advanced, optional per-command):**

- SP-5: Agent Teams integration for tpd:dev (highest benefit)
- Depends on: Phase 0, Phase 1, Phase 2 all complete
- Requires: Agent Teams env flag set

**Phase 4 (Deferred):**

- SP-5 for ui-design (requires typed agent migration first)
- SP-5 for tpd:thinking, tpd:plan (low benefit, optional)
- NOT recommended: brainstorm, refactor, commit

### Prerequisites That Block Other Work

| Blocker                                           | Blocked Items                            |
| ------------------------------------------------- | ---------------------------------------- |
| UI-Design YAML frontmatter (SP-1)                 | All v2 features for ui-design's 9 agents |
| Claude Code v2.1.32+ runtime                      | `memory` frontmatter activation          |
| Claude Code v2.1.33+ runtime                      | `Task(agent_type)` syntax support        |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`          | All Agent Teams integration              |
| TeammateIdle/TaskCompleted hook schemas (unknown) | Deterministic hook script implementation |
| ui-design typed agent migration                   | Agent Teams for ui-design                |

## Level 5: Success Criteria Hints

### Verifiable Outcomes

1. All 23 agent `.md` files have valid YAML frontmatter with `memory` field and documented scope rationale
2. 5 command files have `Task(agent_type)` restrictions matching the exact agent lists per command
3. `hooks.json` contains `TeammateIdle` and `TaskCompleted` top-level keys with at least one script each
4. All existing workflows (`/tpd:thinking`, `/tpd:plan`, `/tpd:dev`, `/commit`, `/ui-design`, `/brainstorm`, `/refactor`) execute identically to pre-integration baseline
5. When `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is unset, no behavioral change occurs
6. tpd:dev with Agent Teams enabled completes audit-fix cycles with fewer orchestrator round-trips

### Acceptance Conditions

- Zero regression: all 12 existing hook scripts pass their current test patterns
- Zero regression: all 7 command workflows complete end-to-end
- Agent names verified unique across all 23 agents (automated check)
- Memory scope assignments match the 8-user/15-project split from boundary analysis
- UI-design frontmatter migration preserves exact tool declarations (diff comparison)

### Regression Indicators

- Hook duplicate detection errors (hooks declared in both hooks.json and plugin.json)
- Agent behavior change after frontmatter addition (wrong model/tools field mapping)
- State machine checkpoint failures when Agent Teams is enabled (state.json desync)
- Memory path collisions (two agents writing to same `.claude/agent-memory/` directory)
- Commit workflow latency increase > 500ms (Agent Teams overhead)

## Confidence Assessment

- **Overall Confidence**: **Medium-High**
- **High Confidence Areas**:
  - Constraint mapping for memory, hooks, and Task(agent_type) -- well-bounded, small changes
  - Implementation ordering -- clear dependency chain from boundary exploration data
  - Risk identification -- 4 boundary explorations provide comprehensive coverage
- **Medium Confidence Areas**:
  - Agent Teams integration specifics -- experimental feature with incomplete documentation
  - Hook event schemas -- input JSON structure is UNKNOWN, defensive coding required
  - Dual-model diversity preservation under Agent Teams -- needs runtime validation
- **Low Confidence Areas**:
  - Whether Claude Code pre-v2.1.32 silently ignores unknown frontmatter fields (untested)
  - Agent Teams performance overhead characteristics (no benchmarks available)
  - Long-term coexistence of native agent memory and context-memory plugin (architectural tension unresolved)
- **Uncertainty Points**:
  - TeammateIdle/TaskCompleted exact input JSON schemas
  - Agent Teams' handling of synchronous "JUST RUN AND WAIT" patterns
  - Cross-plugin Task(agent_type) restriction scope
  - Whether Agent Teams mailbox messages bypass security hooks
  - MEMORY.md 200-line limit behavior (truncation? error? newest-first?)
