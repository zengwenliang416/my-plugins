# Ambiguity Resolution Audit

## Pre-Resolved (from Thinking Phase)

| ID          | Question                      | Decision                                    | Source            |
| ----------- | ----------------------------- | ------------------------------------------- | ----------------- |
| OQ-BLOCK-1  | Hook return semantics         | Assume actionable, degrade gracefully       | clarifications.md |
| OQ-BLOCK-3  | .claude/rules/ path collision | Migrate tech-rules to .claude/memory/rules/ | clarifications.md |
| OQ-DESIGN-2 | CLAUDE.md ownership           | Layered coexistence                         | clarifications.md |

## New Ambiguities (Resolved with Defaults)

### AMB-1: Hook Error Handling Contract

**Source**: Codex + Gemini consensus
**Ambiguity**: Exit code semantics and retry behavior for hook scripts undefined.
**Resolution**: **Fail-open strategy** (default).

- All hooks MUST `exit 0` on any error (validation failure, jq parse error, missing fields)
- On error: log to stderr, return `{}` (pass-through), never block workflow
- No retry mechanism (platform does not support hook retries)
- Rationale: hooks are observability/enhancement, not workflow gates

### AMB-2: Agent Teams Iteration Limit

**Source**: Codex analysis
**Ambiguity**: Is "max 2 iterations" a fixed constant or configurable?
**Resolution**: **Fixed at 2** (hard constraint).

- Iteration increments when audit fails and triggers re-prototype
- After 2 iterations, fallback to manual review (FALLBACK state)
- Not configurable in v1 to avoid complexity
- Rationale: Research Preview, minimize blast radius

### AMB-3: Log Rotation Policy

**Source**: Codex + Gemini consensus
**Ambiguity**: JSONL log rotation details unspecified.
**Resolution**: **Internal rotation, 7-day retention**.

- Each hook script checks log size at start of execution
- If log exceeds 10,000 lines: `tail -n 5000` to keep most recent half
- No external rotation tool dependency (self-contained scripts)
- Rotation failure: fail-open (continue without rotation)
- Rationale: keep hooks self-contained, minimize dependencies

### AMB-4: Orchestration Event Matcher Semantics

**Source**: Codex analysis
**Ambiguity**: What does `matcher: "*"` match against for TeammateIdle/TaskCompleted?
**Resolution**: **Wildcard matches all events** (default).

- `"*"` is event-level match-all, consistent with Notification event behavior
- No field-level filtering in v1
- Future: may add agent-name or task-type filtering if needed
- Rationale: no use case for filtering yet; keep simple

### AMB-5: Agent Teams API Syntax

**Source**: Gemini analysis
**Ambiguity**: `team()` API call syntax unknown.
**Resolution**: **Document as TBD in dev.md**.

- Agent Teams is Research Preview; API may change
- Skeleton uses pseudo-code pattern, refined when official docs available
- Fallback to Task subagents always available
- Rationale: cannot lock in unstable API

### AMB-6: Tech-Rules Consumer Update

**Source**: Gemini analysis
**Ambiguity**: Which consumers read from `.claude/rules/` and need path update?
**Resolution**: **Verify and update all consumers in ST-1**.

- Primary consumer: context-loader skill (if it reads tech-rules output)
- Secondary: any skill/command referencing `.claude/rules/{stack}.md`
- Part of ST-1 scope (already defined in thinking phase sub-tasks)
- Rationale: migration must include consumer update

## Summary

- **Pre-resolved**: 3 (from thinking phase, no re-asking)
- **New ambiguities**: 6 (all resolved with reasonable defaults)
- **Blocking ambiguities**: 0
- **User decisions needed**: 0 (all resolved with engineering defaults)
