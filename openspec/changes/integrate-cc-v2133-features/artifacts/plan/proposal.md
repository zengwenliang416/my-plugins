# Proposal: Integrate Claude Code v2.1.33 Features

## Summary

Selective adoption of Claude Code v2.1.33 features (Agent Teams, Auto Memory, Agent Memory Frontmatter, TeammateIdle/TaskCompleted hooks) into all 7 ccg-workflows plugins with backward compatibility.

## Motivation

Claude Code v2.1.33 introduces platform capabilities that can enhance the ccg-workflows plugin system:

- Agent Teams enables iterative multi-agent coordination (relevant for /tpd:dev)
- Auto Memory provides automatic knowledge persistence (requires path collision resolution)
- TeammateIdle/TaskCompleted hooks enable workflow orchestration awareness
- Agent Memory Frontmatter is already deployed across all 23 agents

## Scope

### In Scope

- Migrate tech-rules-generator output from `.claude/rules/` to `.claude/memory/rules/`
- Fix hook documentation drift (7 events/13 scripts vs documented 5/11)
- Enhance TeammateIdle/TaskCompleted hook scripts with structured logging and orchestration directives
- Refine /tpd:dev Agent Teams section for production readiness
- Update memory architecture documentation for Auto Memory integration

### Out of Scope

- Converting skills-only plugins to agent-based architecture
- Agent Teams for fork-join workflows
- Changing existing agent memory scope assignments
- Public command signature changes

## Impact

- **Plugins affected**: hooks (scripts + docs), context-memory (tech-rules path), tpd (dev command)
- **Documentation affected**: hooks-system.md, hook-scripts.md, how-to-create-a-hook.md, memory-architecture.md, plugin-architecture.md
- **Risk level**: Medium (experimental features gated behind feature flags)
