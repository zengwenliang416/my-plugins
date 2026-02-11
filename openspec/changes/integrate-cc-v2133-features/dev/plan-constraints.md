# Constraint Set

## Hard Constraints (from Thinking Phase + Plan Phase)

| ID    | Constraint                                                                                                  | Source                      | Verified |
| ----- | ----------------------------------------------------------------------------------------------------------- | --------------------------- | -------- |
| HC-1  | `.claude/rules/` exclusively owned by Auto Memory. tech-rules-generator migrates to `.claude/memory/rules/` | thinking HC-1 + OQ-BLOCK-3  | Yes      |
| HC-2  | Skills cannot use memory frontmatter. 4 skills-only plugins excluded                                        | thinking HC-2               | Yes      |
| HC-3  | Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` with fallback                                 | thinking HC-3               | Yes      |
| HC-4  | Hook scripts 5s timeout ceiling. No synchronous network calls                                               | thinking HC-4               | Yes      |
| HC-5  | Agent MEMORY.md capped at 200 lines. Use linked topic files                                                 | thinking HC-5               | Yes      |
| HC-6  | Cross-model mailbox prohibited in Agent Teams                                                               | thinking HC-6               | Yes      |
| HC-7  | All 7 plugins must work identically without v2.1.33 features                                                | thinking HC-7               | Yes      |
| HC-8  | CLAUDE.md = context-memory, MEMORY.md = Auto Memory                                                         | thinking HC-8 + OQ-DESIGN-2 | Yes      |
| HC-9  | Hook scripts MUST fail-open: exit 0 + return `{}` on any error                                              | plan AMB-1                  | New      |
| HC-10 | Agent Teams iteration limit fixed at 2                                                                      | plan AMB-2                  | New      |
| HC-11 | Log rotation: internal, 10k line threshold, tail 5k                                                         | plan AMB-3                  | New      |

## Soft Constraints

| ID   | Constraint                                                        | Source        |
| ---- | ----------------------------------------------------------------- | ------------- |
| SC-1 | Agent Teams targets /tpd:dev only                                 | thinking SC-1 |
| SC-2 | No conversion of skills-only plugins to agents                    | thinking SC-2 |
| SC-3 | Existing memory scope assignments correct, no changes             | thinking SC-3 |
| SC-4 | Auto Memory defers to context-memory where overlap exists         | thinking SC-4 |
| SC-5 | Documentation correction is prerequisite (fix before enhance)     | thinking SC-5 |
| SC-6 | Hook enhancement logging-first, orchestration optional            | thinking SC-6 |
| SC-7 | Orchestration event matcher uses `*` wildcard, no filtering in v1 | plan AMB-4    |
| SC-8 | Agent Teams API syntax documented as TBD pending official docs    | plan AMB-5    |

## Architecture Decisions (from Step 3)

| Decision                  | Chosen                          | Rejected                | Rationale                                         |
| ------------------------- | ------------------------------- | ----------------------- | ------------------------------------------------- |
| Hook script architecture  | Monolithic per-script           | Shared lib              | Only 2 hooks; shared lib is premature abstraction |
| Tech-rules migration      | Path update only                | Path + migration script | Skill is stateless; no migration logic needed     |
| Agent Teams state         | State machine (7 states)        | Inline env var check    | Experimental feature needs recovery + metrics     |
| Backward compat detection | Event existence as feature gate | Per-feature env vars    | No env var proliferation                          |
| Execution ordering        | 5 waves (Gemini)                | 4 phases (Codex)        | SC-5 requires finer doc-first ordering            |
