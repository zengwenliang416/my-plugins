---
generated_at: "2026-02-06T16:20:00Z"
model: gemini
level: high
session_id: constraint-analysis-cc-v2133
parallel_streams: 5
---

# Gemini Constraint Analysis

## Original Question

Integrate Claude Code v2.1.33 features (Agent Teams, Auto Memory, Agent Memory Frontmatter, TeammateIdle/TaskCompleted hooks) into all 7 ccg-workflows plugins. Determine which features apply to which plugins, resolve conflicts with existing systems (context-memory vs Auto Memory, .claude/rules/ path collision), and ensure backward compatibility.

## Multi-Perspective Constraints

### Stream 1: Problem Essence

**Core problem**: Four new platform features must be selectively adopted across 7 plugins with heterogeneous architectures (agent-based vs skills-only, fork-join vs iterative, memory-enabled vs stateless). The surface request ("integrate into all plugins") masks the deeper constraint that most feature-plugin combinations are inapplicable or harmful.

**Surface vs deep needs**:

| Surface Need                             | Deep Need                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| Integrate Agent Teams into all plugins   | Only /tpd:dev benefits; others are fork-join or have no parallel agents  |
| Add memory frontmatter to all agents     | 23 agents already have it; 4 plugins are skills-only and CANNOT use it   |
| Enable Auto Memory everywhere            | Must coexist with context-memory without CLAUDE.md dual-write corruption |
| Enhance TeammateIdle/TaskCompleted hooks | Hook return semantics unknown; 5s timeout limits synchronous logic       |

**Problem boundaries**:

- WITHIN scope: Internal architecture decisions, memory scope review, hook enhancement, Agent Teams for /tpd:dev
- OUTSIDE scope: New plugin creation, public API changes, user-facing command signature changes
- CRITICAL BOUNDARY: Agent Teams is Research Preview -- cannot treat as production-stable feature

### Stream 2: Existing Constraints

**Technical limitations**:

1. **Skills cannot use memory frontmatter** -- 4 plugins (brainstorm, context-memory, refactor, hooks) are skills-only. Converting them to agents solely for memory is high-cost, low-value.
2. **5-second hook timeout** -- TeammateIdle/TaskCompleted scripts cannot perform complex orchestration synchronously within this window.
3. **Hook return semantics unknown** -- Cannot design actionable hook responses without confirming whether the platform consumes return values or treats hooks as fire-and-forget.
4. **Documentation drift** -- Reality is 7 events/13 scripts vs documented 5 lifecycle points/11 scripts. Any enhancement must first reconcile this gap.
5. **Input schema mismatch** -- Hook scripts may receive different JSON shapes than documented, creating integration fragility.
6. **Cross-model mailbox prohibition** -- /tpd:dev Agent Teams skeleton explicitly forbids cross-model messaging, constraining team topology.

**Architectural constraints**:

| Plugin         | Agent Count | Has Agents  | Parallel Pattern                      | Agent Teams Viable |
| -------------- | ----------- | ----------- | ------------------------------------- | ------------------ |
| tpd            | 10          | Yes         | Iterative (dev), Fork-join (thinking) | /dev only          |
| commit         | 4           | Yes         | Fork-join                             | No                 |
| ui-design      | 9           | Yes         | Fork-join                             | No                 |
| hooks          | 0           | No (skills) | N/A                                   | No                 |
| brainstorm     | 0           | No (skills) | N/A                                   | No                 |
| context-memory | 0           | No (skills) | N/A                                   | No                 |
| refactor       | 0           | No (skills) | N/A                                   | No                 |

**Memory scope distribution (current)**:

- 15 agents with `project` scope
- 8 agents with `user` scope
- 0 agents with `local` scope
- Constraint: Any scope changes must justify why current assignment is suboptimal

### Stream 3: User Perspective

**Developer experience constraints**:

1. **Zero-regression guarantee**: Existing `/tpd`, `/commit`, `/ui-design` commands must produce identical results post-integration for users who do not opt into new features.
2. **Opt-in experimental features**: Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Integration must not force this on users.
3. **Transparent memory persistence**: Users should not need to understand the internal difference between Auto Memory and context-memory. The memory experience must feel unified.
4. **Predictable memory scope behavior**: When an agent has `memory: user` scope, the user expects cross-project persistence. When `memory: project`, the user expects project-local persistence. Changing scopes silently would violate expectations.
5. **Accurate documentation**: Plugin help text and hook documentation must reflect actual behavior, not aspirational designs. The 5/11 vs 7/13 drift is a DX violation.

**UX constraints**:

1. **No added latency**: Agent Teams coordination overhead must not visibly slow workflows compared to current Task subagent approach.
2. **Graceful degradation**: If Agent Teams env var is not set, /tpd:dev must fall back to existing subagent pattern without errors.
3. **Clear error attribution**: When an Agent Teams workflow fails, errors must identify which teammate failed and why, not produce opaque team-level failures.
4. **Memory overflow prevention**: 23 agents each with persistent MEMORY.md (200-line injection) must not cause context window bloat. Constraint: total injected memory across simultaneously active agents must stay within model context limits.

### Stream 4: Long-term Considerations

**Scalability constraints**:

1. **Memory growth**: Persistent memory across 23+ agents will grow unbounded without garbage collection. Constraint: memory management strategy (pruning, archiving, size limits) must be defined before enabling persistence broadly.
2. **Plugin count growth**: Integration patterns must be documented as templates so future plugins can adopt features consistently.
3. **Agent Teams maturation**: When Agent Teams exits Research Preview, the feature-flag approach must cleanly transition to default-enabled without code restructuring.

**Maintainability requirements**:

1. **Single source of truth for hooks**: Documentation and implementation must be reconciled BEFORE adding new hook behaviors. This is a prerequisite, not a parallel task.
2. **Memory ownership clarity**: Each memory artifact (.claude/rules/\*.md, CLAUDE.md, agent MEMORY.md) must have exactly ONE owner system. No dual-write.
3. **Skills-vs-agents decision framework**: A clear rubric must exist for when to use skills vs agents, so plugin authors make consistent choices. Current state (4 plugins skills-only, 3 plugins agents) suggests organic rather than principled decisions.
4. **Hook schema versioning**: If input schemas evolve, hook scripts must handle schema version negotiation or fail safely.

**Evolution path constraints**:

1. **Auto Memory is platform-managed**: ccg-workflows cannot fully control its behavior. Integration must be defensive -- accommodate Auto Memory's writes without depending on them.
2. **Context-memory plugin may need role redefinition**: If Auto Memory handles persistence, context-memory's value shifts from "memory creator" to "memory curator/organizer". This is a strategic constraint.
3. **Three-layer architecture (Hot/Warm/Cold) coexistence**: Auto Memory operates in a different conceptual layer. Mapping it to the existing architecture is a constraint on future design coherence.

### Stream 5: Risk Boundaries

**What must be avoided**:

1. **CRITICAL -- .claude/rules/ path collision**: tech-rules-generator writes to .claude/rules/. Auto Memory also writes to .claude/rules/. Two systems writing to the same directory without coordination WILL cause data loss or corruption. This must be resolved before any Auto Memory integration.
2. **CRITICAL -- CLAUDE.md dual management**: context-memory plugin generates CLAUDE.md content. Auto Memory may auto-learn and write to CLAUDE.md. Concurrent writes will produce inconsistent project instructions.
3. **HIGH -- Converting skills to agents without justification**: Converting brainstorm/context-memory/refactor/hooks from skills to agents purely for memory frontmatter adds 4x maintenance surface with unclear benefit.
4. **HIGH -- Enabling Agent Teams in fork-join workflows**: Agent Teams adds coordination overhead. For pure fork-join patterns (/tpd:thinking, /commit, /ui-design), Task subagents are strictly more efficient.
5. **MEDIUM -- Hook enhancement without return semantics**: Building actionable hook responses (e.g., auto-reassign tasks on TeammateIdle) without confirming the platform supports return-value consumption creates dead code.

**Critical failure modes**:

| Failure Mode            | Trigger                            | Impact                                     | Mitigation Constraint                  |
| ----------------------- | ---------------------------------- | ------------------------------------------ | -------------------------------------- |
| Memory corruption       | .claude/rules/ dual-write          | Project instructions become inconsistent   | Namespace separation or ownership lock |
| Hook timeout            | Complex logic in 5s window         | Hook silently fails, workflow unaware      | Async-only patterns, fire-and-forget   |
| Agent Teams instability | Experimental feature in production | Workflow hangs or produces partial results | Feature flag + fallback path mandatory |
| Schema mismatch         | Hook receives unexpected input     | Script crashes, event lost                 | Schema validation at hook entry point  |
| Context window overflow | 23 agents each injecting 200 lines | Model performance degrades                 | Cap simultaneously active agents       |

**Safety constraints**:

1. **Backward compatibility is non-negotiable**: Every existing command must work identically without new env vars set.
2. **Feature isolation**: Experimental features (Agent Teams) must be entirely gated behind environment variables.
3. **Data integrity**: Memory writes must be idempotent. No memory system should depend on another system's write timing.
4. **Graceful degradation**: If any v2.1.33 feature is unavailable (older Claude Code version), all plugins must function at pre-integration capability level.

## Synthesized Constraints

### Consensus Constraints

All 5 analysis streams converge on these constraints:

1. **Agent Teams is /tpd:dev only** -- No other workflow has the iterative, multi-agent coordination pattern that benefits from teams. Fork-join workflows (thinking, commit, ui-design) and skills-only plugins (brainstorm, context-memory, refactor, hooks) are excluded.

2. **Skills-only plugins must NOT be converted to agents** -- The 4 skills-only plugins lack agents by design choice. Converting them solely for memory frontmatter contradicts the architectural intent and adds unjustified maintenance cost.

3. **.claude/rules/ collision must be resolved BEFORE Auto Memory work** -- This is a blocking prerequisite. Either namespace the paths (tech-rules-generator uses subdirectory, Auto Memory uses root) or establish write-ownership protocol.

4. **CLAUDE.md ownership must be singular** -- Either context-memory owns CLAUDE.md generation, or Auto Memory does. Not both. The integration must define a clear ownership boundary.

5. **Hook documentation must be corrected BEFORE hook enhancement** -- Building on inaccurate documentation compounds drift. Reconcile 7/13 reality with 5/11 docs first.

6. **Agent Teams must be feature-flagged with fallback** -- Experimental status demands: env var gating, graceful degradation to Task subagents, no forced adoption.

7. **Hook return semantics must be verified empirically** -- Cannot design actionable hook behaviors without confirming whether the platform reads return values. This is a research prerequisite.

### Divergent Points

| Constraint Area                | Stream Perspective                                                                                         | Divergence                                                                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Memory scope review**        | Stream 3 (User): Do not change existing 15-project/8-user assignments -- changing breaks user expectations | Stream 4 (Long-term): Review for optimality -- some agents may have wrong scope. **Resolution needed**: Audit each agent's scope rationale before changing any.                                                      |
| **Auto Memory adoption depth** | Stream 3 (UX): Should feel seamless and unified with existing memory                                       | Stream 5 (Risk): Conflicts with context-memory make deep adoption dangerous. **Resolution needed**: Define coexistence strategy -- complementary vs replacement.                                                     |
| **Hook enhancement ambition**  | Stream 1 (Essence): Hooks COULD enable smart task reassignment and metrics                                 | Stream 2 (Technical): 5s timeout and unknown return semantics severely limit this. **Resolution needed**: Empirical test of hook capabilities first.                                                                 |
| **Skills-only plugin memory**  | Stream 4 (Long-term): These plugins may eventually need persistent memory                                  | Stream 2/5 (Technical/Risk): Skills architecturally cannot use memory frontmatter. **Resolution needed**: Determine if platform will ever support skill-level memory, or if selective agent conversion is warranted. |

### UX-Specific Constraints

1. **Command parity**: All existing slash commands must produce identical output with and without v2.1.33 features enabled.
2. **Memory transparency**: Users should not encounter "which memory system wrote this?" confusion. Memory provenance should be traceable but not burdensome.
3. **Agent Teams feedback**: When Agent Teams is active in /tpd:dev, users need visibility into teammate status (who is working on what) without information overload.
4. **Error clarity**: New failure modes (team coordination failure, memory collision, hook timeout) must produce actionable error messages that guide resolution.
5. **Documentation accuracy**: All plugin documentation must reflect actual capability, not aspirational feature lists. This is a prerequisite UX constraint.

## Confidence Assessment

- **Overall Confidence**: Medium-High
- **Highest Confidence Stream**: Stream 2 (Existing Constraints) -- based on concrete code analysis of 23 agents, 13 hook scripts, and actual architecture patterns
- **Lowest Confidence Stream**: Stream 5 (Risk Boundaries) on hook return semantics -- requires empirical verification
- **Needs Further Exploration**:
  - Hook return value consumption: Does Claude Code read stdout/exit-code from hook scripts as actionable data?
  - Auto Memory exact write behavior: What paths does Auto Memory create/modify in .claude/rules/?
  - Agent Teams stability: What failure modes exist in the Research Preview? What is the coordination latency overhead?
  - Memory growth patterns: How fast do agent MEMORY.md files grow under typical usage? Is pruning needed at launch or can it be deferred?
