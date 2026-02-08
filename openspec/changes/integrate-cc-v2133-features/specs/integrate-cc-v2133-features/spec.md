# Spec: integrate-cc-v2133-features

## Overview

Integrate Claude Code v2.1.33 platform features into the ccg-workflows plugin ecosystem through selective adoption with full backward compatibility.

## Constraints

### Hard Constraints

| ID   | Constraint                                        | Rationale                          |
| ---- | ------------------------------------------------- | ---------------------------------- |
| HC-1 | `.claude/rules/` exclusively owned by Auto Memory | Prevent dual-write data corruption |
| HC-2 | Skills cannot use memory frontmatter              | Claude Code platform limitation    |
| HC-3 | Agent Teams gated by env var with fallback        | Research Preview status            |
| HC-4 | Hook 5s timeout ceiling                           | Platform-enforced                  |
| HC-5 | MEMORY.md 200-line cap                            | Platform-enforced                  |
| HC-6 | Cross-model mailbox prohibited                    | Design constraint in /tpd:dev      |
| HC-7 | Backward compatibility required                   | Zero regression guarantee          |
| HC-8 | CLAUDE.md ownership singular (context-memory)     | Prevent content drift              |

### Soft Constraints

| ID   | Constraint                       | Rationale                              |
| ---- | -------------------------------- | -------------------------------------- |
| SC-1 | Agent Teams for /tpd:dev only    | Only workflow with iterative cycle     |
| SC-2 | No skill-to-agent conversions    | Unjustified maintenance cost           |
| SC-3 | Keep existing memory scopes      | Already correct (15 project, 8 user)   |
| SC-4 | context-memory takes precedence  | Curated > automatic                    |
| SC-5 | Fix docs before hook enhancement | Prevent compounding drift              |
| SC-6 | Hooks logging-first              | Degrade gracefully if observation-only |

## Feature Integration Matrix

| Feature            | tpd       | commit   | ui-design | hooks   | brainstorm | context-memory | refactor |
| ------------------ | --------- | -------- | --------- | ------- | ---------- | -------------- | -------- |
| Agent Memory       | Done (10) | Done (4) | Done (9)  | N/A     | N/A        | N/A            | N/A      |
| Agent Teams        | /dev only | No       | No        | No      | No         | No             | No       |
| Auto Memory        | Path fix  | -        | -         | -       | -          | Path fix       | -        |
| TeammateIdle hook  | -         | -        | -         | Enhance | -          | -              | -        |
| TaskCompleted hook | -         | -        | -         | Enhance | -          | -              | -        |

## Acceptance Criteria

1. `ls .claude/rules/` contains NO tech-rules-generator files
2. `ls .claude/memory/rules/` contains tech-rules output
3. hooks-system.md references 7 lifecycle events and 13 scripts
4. `/tpd:dev` completes without errors when Agent Teams disabled
5. `/tpd:dev` enters Agent Teams mode when enabled
6. Hook scripts include `set -euo pipefail` and schema validation
7. No agent MEMORY.md exceeds 200 lines
