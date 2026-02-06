# Memory Architecture

## Three-Layer Memory System

ccg-workflows uses a three-layer memory architecture to avoid conflicts between native agent memory and plugin-level memory systems.

| Layer | System                    | Storage                               | Lifecycle                 | Path                                                               |
| ----- | ------------------------- | ------------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| Hot   | Native agent `memory`     | Agent-learned patterns and heuristics | Persistent (200-line cap) | `~/.claude/agent-memory/<name>/` or `.claude/agent-memory/<name>/` |
| Warm  | `workflow-memory` skill   | Workflow phase state and handoffs     | Session-level, 7d expiry  | `.claude/memory/workflows/`                                        |
| Cold  | `session-compactor` skill | Session recovery snapshots            | Time-limited              | `.claude/memory/sessions/` via MCP                                 |

## Layer Responsibilities

### Hot Layer: Native Agent Memory

Configured via `memory` field in agent YAML frontmatter:

- **`memory: user`** — Cross-project reusable knowledge (8 agents)
  - Design standards, security patterns, UX heuristics
  - Stored in `~/.claude/agent-memory/<name>/`
- **`memory: project`** — Project-specific knowledge (15 agents)
  - Codebase structure, commit conventions, module boundaries
  - Stored in `.claude/agent-memory/<name>/`

Native agent memory is automatic — agents learn and recall without explicit commands.

### Warm Layer: Workflow Memory

Managed via `/memory workflow` command (context-memory plugin):

- Persists workflow phase state between sessions
- Enables `/tpd:plan --run-id=xxx` resume capability
- 7-day expiry prevents stale state accumulation

### Cold Layer: Session Compaction

Managed via `/memory compact` command:

- Compresses full session context into recovery snapshots
- Stored via MCP core memory for cross-session retrieval
- Used for long-running multi-day workflows

## Scope Distribution

| Scope   | Count | Agents                                                                                                                                                                                                                                                                                                                                 |
| ------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| user    | 8     | codex-constraint, gemini-constraint, codex-auditor, gemini-auditor, image-analyzer, style-recommender, ux-guideline-checker, quality-validator                                                                                                                                                                                         |
| project | 15    | All remaining agents (boundary-explorer, context-analyzer, codex-architect, gemini-architect, codex-implementer, gemini-implementer, change-investigator, semantic-analyzer, symbol-analyzer, commit-worker, requirement-analyzer, existing-code-analyzer, design-variant-generator, gemini-prototype-generator, claude-code-refactor) |

## Interaction Rules

1. Hot layer operates automatically — no user intervention needed
2. Warm layer is explicit — activated via `/memory workflow` commands
3. Cold layer is manual — user triggers `/memory compact` before session end
4. Layers do not conflict — each has distinct storage paths and lifecycles
