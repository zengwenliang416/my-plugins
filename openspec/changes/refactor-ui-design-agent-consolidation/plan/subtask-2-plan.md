# Subtask 2 Plan

## Objective
Refactor `/ui-design` command to call consolidated agents.

## Inputs
- `plugins/ui-design/commands/ui-design.md`

## Outputs
- Updated command with concise phases and new subagent routing

## Execution Steps
1. Update agent type list and task invocations.
2. Keep hard stop points and quality gates.
3. Preserve artifact path contracts.

## Risks
- Stale references to removed agent types.

## Verification
- No removed agent names in command file.
