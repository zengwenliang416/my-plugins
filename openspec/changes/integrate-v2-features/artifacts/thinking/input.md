# Problem Description

## Goal

Integrate Claude Code v2.1.32-33 new features into the existing ccg-workflows plugins system.

## Target Features

1. **Agent Teams** (experimental) - Multi-agent collaboration with direct communication, shared task lists, and mailbox system. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
2. **Agent `memory` frontmatter field** - Persistent memory for agents with scopes: `user`, `project`, `local`. Stores in `~/.claude/agent-memory/<agent-name>/` or `.claude/agent-memory/<agent-name>/`.
3. **TeammateIdle / TaskCompleted hook events** - New hook lifecycle events for multi-agent workflow orchestration.
4. **Task(agent_type) restriction syntax** - Restrict which sub-agents can be spawned via agent `tools` frontmatter.

## Target Plugins (7 total)

- **tpd** (16 skills, 10 agents) - Primary candidate for Agent Teams + Memory
- **brainstorm** (11 skills) - Candidate for Agent Teams
- **ui-design** (9 agents) - Candidate for Agent Teams
- **commit** (8 skills, 4 agents) - Candidate for Agent Memory
- **refactor** (9 skills) - Candidate for Agent Memory
- **hooks** (12 scripts) - Candidate for new hook events
- **context-memory** (22 skills) - Integration with native agent memory

## Constraints from Prior Analysis

- P0: Add `memory` frontmatter to all agents (small effort)
- P1: TPD thinking phase → Agent Teams (medium effort, rewrite thinking.md orchestration)
- P1: hooks plugin → TeammateIdle/TaskCompleted events (small effort)
- P2: TPD agents → Task() restrictions (small effort)
- P3: Brainstorm/UI-Design → Agent Teams (large effort, redesign parallel phases)

## Key Questions

1. How to maintain backward compatibility with existing workflow orchestration?
2. Should Agent Teams replace or coexist with current subagent patterns?
3. How does native agent memory interact with existing workflow-memory skill?
4. What's the migration path for each plugin?
