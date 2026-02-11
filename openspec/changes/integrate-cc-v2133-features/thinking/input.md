# Integration of Claude Code v2.1.33 Features into All Plugins

## Problem Description

Integrate Claude Code v2.1.32 - v2.1.33 new features into all 7 ccg-workflows plugins:

- tpd, commit, hooks, ui-design, brainstorm, context-memory, refactor

## New Features to Integrate

### 1. Agent Teams (Research Preview)

- Multi-agent collaboration with shared task lists and inter-agent messaging
- Environment variable: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Teammates communicate directly (vs subagents that only report to main agent)
- Self-coordinating via shared task list

### 2. Auto Memory

- Claude automatically records and recalls memories during work
- Hierarchical memory system (managed policy → project → rules → user → local)
- `.claude/rules/*.md` with path-scoping via frontmatter

### 3. Agent Memory Frontmatter

- `memory` field in agent YAML: `user` | `project` | `local` scope
- Persistent memory directory per agent
- First 200 lines of MEMORY.md auto-injected into agent system prompt
- Read/Write/Edit tools auto-enabled for memory management

### 4. TeammateIdle Hook Event

- Fires when a teammate agent becomes idle
- Input JSON includes: session_id, agent_id, agent_type, teammate_name
- Can trigger auto-assignment of next tasks

### 5. TaskCompleted Hook Event

- Fires when a task in agent team's task list is completed
- Input JSON includes: task_id, task_name, agent_id, team_id, timestamp
- Can trigger dependent task execution, notifications, metrics

## Target Plugins (7 total)

1. **tpd** - Thinking/Plan/Dev workflow (boundary-explorer, constraint agents)
2. **commit** - Standardized commit (change-investigator, semantic/symbol analyzers)
3. **hooks** - Core hook system (already has TeammateIdle/TaskCompleted skeleton)
4. **ui-design** - UI/UX design workflow (image-analyzer, style-recommender, etc.)
5. **brainstorm** - Multi-model ideation (topic-researcher, idea-generator, etc.)
6. **context-memory** - Project memory management (module-discovery, claude-updater, etc.)
7. **refactor** - Code refactoring (smell-detector, impact-analyzer, etc.)

## Key Questions

1. Which agents benefit most from persistent memory? (high-repetition vs one-shot)
2. Which workflows could leverage Agent Teams vs staying with Task subagents?
3. How should TeammateIdle/TaskCompleted hooks enhance workflow orchestration?
4. What memory scope (user/project/local) is appropriate for each agent type?
5. Are there backward compatibility concerns with the experimental Agent Teams feature?
