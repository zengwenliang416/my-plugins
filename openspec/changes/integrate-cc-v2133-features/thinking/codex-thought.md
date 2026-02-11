---
generated_at: "2026-02-06T16:20:00Z"
model: codex
level: high
session_id: codex-constraint-v2133-001
---

# Codex Constraint Analysis

## Original Question

Integrate Claude Code v2.1.33 features (Agent Teams, Auto Memory, Agent Memory Frontmatter, TeammateIdle/TaskCompleted hooks) into all 7 ccg-workflows plugins (tpd, commit, hooks, ui-design, brainstorm, context-memory, refactor).

## Level 1: Problem Decomposition

### Core Problem

5 new platform features must be integrated into 7 plugins with heterogeneous architectures (3 agent-based, 4 skill-only) while preserving backward compatibility and avoiding collision with existing memory/hook systems.

### Sub-Problems

| ID  | Sub-Problem                                        | Dependency       | Blocking?        |
| --- | -------------------------------------------------- | ---------------- | ---------------- |
| SP1 | Auto Memory vs context-memory collision resolution | None             | Yes - blocks SP2 |
| SP2 | Hook enhancement (TeammateIdle/TaskCompleted)      | SP1 resolved     | Yes - blocks SP3 |
| SP3 | Agent Memory scope validation (23 agents)          | SP1 resolved     | No               |
| SP4 | Agent Teams adoption for eligible workflows        | SP2 completed    | No               |
| SP5 | Documentation alignment (drift fix)                | SP1-SP4 designed | No               |

### Resolution Order

```
SP1 (memory collision) --> SP2 (hooks) --> SP3 (agent memory) --> SP4 (Agent Teams) --> SP5 (docs)
                                      \-> SP3 can parallel with SP2
```

**Rationale**: Memory collision (SP1) is foundational because both Auto Memory and hook scripts may write to `.claude/rules/`. Hooks (SP2) must be understood before Agent Teams (SP4) since TeammateIdle/TaskCompleted drive team orchestration. Agent memory (SP3) is independent of hooks and can proceed in parallel.

## Constraints Discovered

### Hard Constraints

**HC-1: Hook 5-Second Timeout Ceiling**

- Claude Code enforces a 5s timeout on all hook scripts
- Platform-level constraint, cannot be overridden by plugin code
- ALL TeammateIdle/TaskCompleted logic MUST complete within 5s
- Implication: no network calls, no heavy file I/O, no waiting for external processes

**HC-2: Skills Cannot Use Memory Frontmatter**

- Memory frontmatter (`memory: user|project|local`) is agent-only
- 4 plugins (brainstorm, context-memory, refactor, hooks) use skills exclusively
- These plugins CANNOT benefit from Agent Memory without skill-to-agent refactoring
- This is a Claude Code platform limitation, not a design choice

**HC-3: Agent Teams Requires Experimental Flag**

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` must be explicitly set
- Feature is Research Preview - may change or be removed without notice
- MUST NOT be a hard dependency for any core workflow path
- All Agent Teams integrations MUST have a fallback to Task subagent mode

**HC-4: Memory Scope Exclusivity Per Agent**

- Each agent YAML declares exactly ONE memory scope: `user`, `project`, or `local`
- Cannot mix scopes within a single agent definition
- Cross-scope memory sharing requires explicit file path references

**HC-5: MEMORY.md 200-Line Truncation**

- Only first 200 lines of MEMORY.md are auto-injected into agent system prompt
- Content beyond line 200 is silently dropped with no warning
- Agents with extensive memory needs MUST use linked topic files referenced from within the 200-line budget

**HC-6: Cross-Model Mailbox Prohibition**

- /tpd:dev Agent Teams skeleton (lines 351-387) explicitly forbids cross-model mailbox communication
- This constraint MUST be preserved in any Agent Teams enhancement
- Agents within a team must use same model provider

**HC-7: .claude/rules/ Namespace Must Not Collide**

- tech-rules-generator (context-memory plugin) writes to `.claude/rules/`
- Auto Memory also writes to `.claude/rules/`
- File naming conventions MUST guarantee zero collision between these two writers
- Overwriting or merging files from different sources will cause unpredictable agent behavior

**HC-8: Backward Compatibility Gate**

- All 7 plugins MUST function identically when v2.1.33 features are NOT enabled
- No new required dependencies on experimental features
- Existing test suites must pass without modification

### Soft Constraints

**SC-1: Agent Teams Only for Iterative Workflows**

- Fork-join patterns (thinking, commit, ui-design) are better served by Task subagents
- Only iterative cycles with feedback loops (prototype -> audit -> fix) benefit from Agent Teams
- Currently only /tpd:dev qualifies

**SC-2: Maintain Existing Memory Scope Assignments**

- 15 agents use `project` scope, 8 use `user` scope, 0 use `local`
- These assignments reflect deliberate design choices
- Changes should be justified per-agent, not applied uniformly

**SC-3: Auto Memory Should Defer to context-memory Where Overlap Exists**

- context-memory plugin provides curated, structured memory management
- Auto Memory provides automatic, unstructured learning
- Where both cover the same concern, curated output should take precedence

**SC-4: Documentation as Correction Target**

- Docs claim 5 lifecycle points / 11 scripts; reality is 7 events / 13 scripts
- Documentation should be updated to match implementation, not the reverse
- Input schema documentation must be validated against actual hook input JSON

**SC-5: Minimize Skill-to-Agent Conversions**

- Converting skill-only plugins to use agents adds maintenance burden
- Only convert if the memory persistence benefit clearly outweighs the complexity cost
- 4 skill-only plugins should remain skills unless a compelling per-plugin case exists

## Risk Points

### Security Risks

| ID    | Severity | Risk                                                                                       | Evidence                                                                               |
| ----- | -------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| SEC-1 | Medium   | Auto Memory may persist sensitive data (API keys, credentials) into `.claude/rules/` files | Auto Memory learns automatically from session content; no documented content filtering |
| SEC-2 | Medium   | `.claude/rules/` collision could cause one system to silently overwrite another's rules    | Both tech-rules-generator and Auto Memory target the same directory                    |
| SEC-3 | Low      | Agent Teams shared task list may expose information across agent boundaries                | Mitigated by read-only sandbox, but task descriptions may leak context                 |

### Performance Risks

| ID     | Severity | Risk                                                                                | Evidence                                                                         |
| ------ | -------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| PERF-1 | High     | Enhanced hook logic may exceed 5s timeout and silently fail                         | Current skeletons are 19 lines / logging-only; any meaningful logic adds latency |
| PERF-2 | Medium   | 23 agents with memory frontmatter = 23 MEMORY.md reads on startup                   | Disk I/O scales linearly with agent count per plugin invocation                  |
| PERF-3 | Medium   | Dual persistence (session compactor + Auto Memory) creates unbounded storage growth | No cleanup/rotation mechanism documented for either system                       |
| PERF-4 | Low      | Agent Teams coordination overhead vs direct Task subagent dispatch                  | Shared task list synchronization adds coordination latency                       |

### Scalability Risks

| ID      | Severity | Risk                                                                                      | Evidence                                                                |
| ------- | -------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| SCALE-1 | Medium   | Memory file proliferation: 23 agents x multiple scope dirs = dozens of memory directories | 200-line limit forces topic file splitting, creating many small files   |
| SCALE-2 | Medium   | Hook script count already drifted (13 actual vs 11 documented)                            | Adding new event types without governance compounds documentation drift |
| SCALE-3 | Low      | Agent Teams ROI is narrow: only 1 of 7+ workflows qualifies                               | Infrastructure investment for Agent Teams support has limited reuse     |

## Critical Unknowns Requiring Resolution

**CU-1: Hook Return Value Semantics (BLOCKING)**

- Unknown whether TeammateIdle/TaskCompleted hooks can return actionable responses or are observation-only (fire-and-forget)
- If observation-only: hooks can log/metric but cannot influence workflow
- If actionable: hooks can return task assignments, trigger dependent tasks
- This fundamentally determines the hook enhancement strategy
- **Resolution**: Empirical test against Claude Code v2.1.33 hook runtime

**CU-2: Auto Memory File Naming Convention**

- Exact filename patterns Auto Memory uses in `.claude/rules/` are undocumented
- Cannot guarantee no collision with tech-rules-generator without knowing the naming scheme
- **Resolution**: Enable Auto Memory in isolated environment, observe generated filenames

**CU-3: Input Schema for New Hook Events**

- Documented input schema differs from actual implementation for existing hooks
- New event schemas (TeammateIdle, TaskCompleted) may also have undocumented fields
- **Resolution**: Capture actual JSON input from live hook invocations

## Trade-Off Points

| Trade-Off                   | Option A                                          | Option B                                  | Decision Criteria                                              |
| --------------------------- | ------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| Skill-only plugins & memory | Keep as skills (no memory frontmatter)            | Convert to agents (gain memory)           | Per-plugin: does the plugin benefit from cross-session memory? |
| Auto Memory coexistence     | Disable Auto Memory where context-memory operates | Let both run with namespace separation    | Can namespace separation be guaranteed? (depends on CU-2)      |
| Agent Teams scope           | Only /tpd:dev                                     | Expand to other workflows over time       | Stability of Research Preview feature; ROI per workflow        |
| Hook complexity             | Keep hooks minimal (logging + metrics)            | Add orchestration logic (task assignment) | Depends on CU-1 (return value semantics)                       |

## Success Criteria Hints

### Verifiable Outcomes

1. All 13+ hook scripts execute with correct, documented input schemas (schema tests pass)
2. TeammateIdle/TaskCompleted hooks perform meaningful work (not logging-only) within 5s wall-clock time
3. Zero `.claude/rules/` filename collisions between tech-rules-generator and Auto Memory (verified by concurrent execution test)
4. /tpd:dev Agent Teams mode produces equivalent or better output vs current Task subagent mode (A/B comparison)
5. All 23 agent memory scope assignments validated as intentional (audit checklist)
6. All 7 plugins pass existing test suites with v2.1.33 env vars both set and unset

### Acceptance Conditions

- Zero regression in existing plugin functionality
- Documentation accurately reflects actual hook events count, script count, and input schemas
- No MEMORY.md exceeds 200 lines (topic file linking used where needed)
- Agent Teams feature gated behind environment variable check with graceful fallback
- Auto Memory and context-memory produce non-overlapping output in `.claude/rules/`

## Confidence Assessment

- **Overall Confidence**: Medium-High
- **Grounding**: Analysis built on concrete exploration data (23 agents counted, 13 scripts verified, specific path collisions identified, line-level code references)
- **Uncertainty Points**:
  1. **Hook return value semantics** (High uncertainty) - Blocking unknown; determines entire hook enhancement strategy
  2. **Auto Memory file naming** (Medium uncertainty) - Collision risk is theoretical until empirically verified
  3. **Agent Teams stability** (Medium uncertainty) - Research Preview status means breaking changes are expected
  4. **Skill-to-agent conversion cost** (Low uncertainty) - Architectures are known; cost-benefit is a design decision
