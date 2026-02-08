# Handoff: Integrate Claude Code v2.1.33 Features

## Proposal

- **Title**: Integrate Claude Code v2.1.33 Features into All Plugins
- **ID**: `integrate-cc-v2133-features`
- **Thinking Depth**: ultra
- **Confidence**: Medium-High (8.0/10)

## Constraints

### Hard Constraints

1. **HC-1**: `.claude/rules/` is exclusively owned by Auto Memory. tech-rules-generator MUST migrate output to `.claude/memory/rules/`.
2. **HC-2**: Skills cannot use `memory` frontmatter — 4 plugins (brainstorm, context-memory, refactor, hooks) are skills-only and excluded from agent memory features.
3. **HC-3**: Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. All integrations MUST fallback to Task subagent mode when unset.
4. **HC-4**: Hook scripts have 5-second timeout ceiling. Use async background processes for heavy work.
5. **HC-5**: Agent MEMORY.md capped at 200 lines for system prompt injection. Use linked topic files for overflow.
6. **HC-6**: Cross-model mailbox prohibited in /tpd:dev Agent Teams — codex cannot message gemini agents.
7. **HC-7**: Backward compatibility is non-negotiable — all 7 plugins must work identically without v2.1.33 features enabled.
8. **HC-8**: CLAUDE.md ownership is singular — context-memory owns CLAUDE.md generation, Auto Memory owns agent MEMORY.md.

### Soft Constraints

1. **SC-1**: Agent Teams targets /tpd:dev only. Fork-join workflows (/thinking, /commit, /ui-design) stay on Task subagents.
2. **SC-2**: Do not convert skills-only plugins to agents solely for memory frontmatter.
3. **SC-3**: Existing memory scope assignments (15 project, 8 user) are correct — no changes needed.
4. **SC-4**: Auto Memory defers to context-memory where overlap exists (curated > automatic).
5. **SC-5**: Fix documentation drift (7 events/13 scripts vs documented 5/11) BEFORE hook enhancement.
6. **SC-6**: Hook enhancement starts with logging+metrics; orchestration directives assume actionable returns with graceful degradation.

## Non-Goals

1. Converting brainstorm/context-memory/refactor/hooks from skills-only to agent-based architecture
2. Enabling Agent Teams for fork-join workflows (/tpd:thinking, /commit, /ui-design)
3. Changing any existing agent memory scope assignments (all 23 are already correct)
4. Adding `memory: local` scope to any agent (no use case identified)
5. Modifying public command signatures or user-facing API
6. Making Agent Teams a hard dependency for any workflow

## Success Criteria

1. Zero `.claude/rules/` filename collisions between tech-rules-generator and Auto Memory
2. tech-rules-generator writes to `.claude/memory/rules/` instead of `.claude/rules/`
3. Hook documentation reflects actual 7 lifecycle events and 13+ scripts
4. TeammateIdle/TaskCompleted hooks produce structured logs + orchestration directives within 5s
5. /tpd:dev Agent Teams mode works end-to-end with feature flag, falls back cleanly without it
6. All 7 plugins produce identical results with v2.1.33 env vars both set and unset
7. memory-architecture.md updated to address Auto Memory integration in three-layer model

## Acceptance Criteria

1. `ls .claude/rules/` contains NO files from tech-rules-generator (only Auto Memory content)
2. `ls .claude/memory/rules/` contains tech-rules-generator output (`{stack}.md` + `index.json`)
3. `wc -l` on llmdoc/architecture/hooks-system.md shows "7 lifecycle" and "13 scripts" references
4. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=0 /tpd:dev` completes without errors
5. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 /tpd:dev` enters Agent Teams mode with prototype→audit→fix cycle
6. Hook scripts include `set -euo pipefail` and schema validation at entry point
7. No agent MEMORY.md file exceeds 200 lines

## Open Questions (Remaining)

1. What is the exact JSON payload schema that Claude Code v2.1.33 sends to TeammateIdle/TaskCompleted hooks? (Needs empirical verification)
2. What does the 'matcher' field match against for orchestration events? (teammate_name, task_id, or agent_type?)
3. How does Agent memory interact with Agent Teams teammates? (Inherit or independent?)

## Risks

| Risk                                          | Severity | Mitigation                                             |
| --------------------------------------------- | -------- | ------------------------------------------------------ |
| Hook return semantics may be observation-only | HIGH     | Design actionable with graceful degradation to logging |
| Agent Teams Research Preview instability      | HIGH     | Feature flag + mandatory fallback path                 |
| Hook timeout exceeded by enhanced logic       | MEDIUM   | Async background processes (smart-notify.sh pattern)   |
| CLAUDE.md content drift                       | MEDIUM   | Singular ownership: context-memory only                |
| Documentation drift compounds                 | MEDIUM   | Fix docs as prerequisite sub-task                      |

## Execution Order

```
ST-1: Migrate tech-rules-generator output path
  ↓
ST-2: Reconcile hook documentation (7/13)
  ↓
ST-3: Enhance hook scripts (teammate-idle.sh, task-completed.sh)
  ↓ (can parallel with ST-4)
ST-4: Refine /tpd:dev Agent Teams section
  ↓
ST-5: Update memory architecture documentation
```

## Artifacts

```
openspec/changes/integrate-cc-v2133-features/artifacts/thinking/
├── input.md
├── complexity-analysis.md
├── boundaries.json
├── explore-hooks-orchestration.json
├── explore-agent-definitions.json
├── explore-workflow-commands.json
├── explore-memory-system.json
├── codex-thought.md
├── gemini-thought.md
├── synthesis.md
├── clarifications.md
├── conclusion.md
├── handoff.md
├── handoff.json
└── state.json
```
