# Subtask 3 Plan

## Objective
Replace old UI-design agents with consolidated core agents.

## Inputs
- Existing `plugins/ui-design/agents/**`

## Outputs
- New `analysis-core`, `design-core`, `generation-core`, `validation-core` files

## Execution Steps
1. Remove redundant agent files.
2. Add consolidated files with mode/perspective routing.
3. Keep communication and progress reporting requirements.

## Risks
- Losing role-specific constraints.

## Verification
- New agents document all required outputs.
