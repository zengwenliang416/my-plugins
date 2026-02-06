# Proposal: integrate-v2-features

> Integrate Claude Code v2.1.32-33 new features into ccg-workflows plugins

## Summary

Integrate 4 Claude Code v2.1.32-33 platform features (Agent Teams, Agent Memory, TeammateIdle/TaskCompleted Hooks, Task(agent_type) restrictions) into the ccg-workflows plugin system through a 5-phase additive plan.

## Background

ccg-workflows contains 7 plugins with 23 agents, 50+ skills, and 12 hooks. Claude Code v2.1.32-33 introduced features that can enhance multi-agent coordination, enable cross-session learning, and improve workflow orchestration. The challenge is integrating these features without breaking backward compatibility or violating architectural invariants (filesystem IPC, dual-model diversity, synchronous thinking).

## Goals

1. Enable native agent memory for cross-session learning across all 23 agents
2. Add Task(agent_type) restrictions to 5 command orchestrators for safety boundaries
3. Extend hook system with TeammateIdle/TaskCompleted agent-lifecycle events
4. Pilot Agent Teams on tpd:dev for iterative audit-fix cycle optimization

## Non-Goals

1. Do not replace workflow-memory skill with native agent memory
2. Do not convert brainstorm/refactor/commit to Agent Teams
3. Do not introduce Agent Teams to thinking phase
4. Do not modify any existing skill/hook behavior

## Constraints

### Hard Constraints

1. UI-Design 9 agents lack YAML frontmatter (Phase 0 prerequisite)
2. Unknown frontmatter fields must be silently ignored by old CLI
3. thinking.md "NEVER background" constraint excludes it from Agent Teams
4. Dual-model diversity must be preserved (no cross-model mailbox sharing)
5. Filesystem run_dir remains sole artifact source of truth
6. hooks.json is single hook registration point
7. Agent names must be globally unique
8. 200-line MEMORY.md system prompt limit
9. Task(agent_type) applies at command level (all 23 agents are leaf)
10. TeammateIdle/TaskCompleted schemas unknown (defensive parsing)
11. Agent Teams requires experimental flag with conditional fallback
12. 50+ skills backward compatibility non-negotiable

### Soft Constraints

1. Per-command incremental migration
2. Memory scope: 8 agents user, 15 agents project
3. New hook scripts follow bash+jq convention
4. New scripts/orchestration/ directory for agent-lifecycle hooks

## Approach

5-phase implementation with Phase 1 fully parallelizable:

```
Phase 0: UI-Design YAML frontmatter migration (9 files)
Phase 1a: Add memory field to 23 agents       ┐
Phase 1b: Add Task() restrictions to 5 cmds    ├── parallel
Phase 1c: Add hook events + 2 scripts          ┘
Phase 2: Memory coexistence documentation
Phase 3: Agent Teams for tpd:dev (behind flag)
Phase 4: Deferred (ui-design, tpd:thinking/plan)
```

## Dependencies

1. Claude Code v2.1.32+ runtime (memory frontmatter)
2. Claude Code v2.1.33+ runtime (Task restrictions, hook events)
3. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (Agent Teams)
4. UI-Design frontmatter migration (blocks all v2 for 9 agents)
5. TeammateIdle/TaskCompleted schema documentation (deterministic hooks)

## Risks

| Risk                                          | Severity | Mitigation                                   |
| --------------------------------------------- | -------- | -------------------------------------------- |
| UI-Design frontmatter migration breaks agents | HIGH     | Diff-compare informal vs YAML tools per file |
| Dual-model diversity loss via Agent Teams     | HIGH     | Enforce no cross-model mailbox               |
| Backward compat break without env flag        | HIGH     | Conditional branching in commands            |
| MEMORY.md 200-line overflow                   | MEDIUM   | Rotation/compaction strategy                 |
| Dual persistence confusion                    | MEDIUM   | Document clear ownership                     |

## Success Criteria

1. All 23 agents have `memory` field in YAML frontmatter
2. 5 commands have Task(agent_type) restrictions
3. hooks.json has TeammateIdle + TaskCompleted keys
4. All 7 workflows pass baseline execution test
5. Zero change when Agent Teams flag is unset

## Acceptance Criteria

1. `grep -r '^memory:' plugins/*/agents/**/*.md` = 23 matches
2. hooks.json keys include TeammateIdle, TaskCompleted
3. scripts/orchestration/ has 2+ shell scripts
4. UI-Design tools fields match pre-migration declarations
5. All workflows run without errors sans env vars
