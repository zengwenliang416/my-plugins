# Subtask Plan: 3.15 (context-memory command path strategy validation)

## Meta

- Subtask ID: 3.15
- Target file: `plugins/context-memory/commands/memory.md`
- Goal: Validate whether context-memory command contains implicit legacy runtime path assumptions.
- Date: 2026-02-11

## Objective

Verify `/memory` command path strategy against hard-cutover policy, and adjust only if legacy runtime locations are present.

## Inputs

- `plugins/context-memory/commands/memory.md`
- Batch E requirement 3.15
- Hard-cutover policy: no `.claude/*/runs/*` runtime references

## Outputs

- Validation result for context-memory path strategy.
- If needed, minimal edits in `memory.md`; otherwise explicit "no change required" evidence.

## Execution Steps

1. Search `memory.md` for runtime path literals (e.g., `.claude/*/runs`, absolute `.claude` paths).
2. Inspect command semantics to confirm whether it directly defines runtime artifact directories.
3. If legacy paths exist, replace with OpenSpec path conventions; if none, keep file unchanged.
4. Record validation outcome via task/state updates.

## Risks

- False positives: this command mainly routes to sub-skills and may not own runtime paths.
- Over-editing could introduce behavior drift in command routing.

## Verification

- `rg -n "\.claude/.*/runs|/Users/.*/\.claude/" plugins/context-memory/commands/memory.md`
- Confirm no runtime artifact location in file points to legacy path.

## Done Criteria

- 3.15 acceptance met: context-memory command has no legacy runtime artifact location assumptions.
- Task marked complete with validation evidence.
