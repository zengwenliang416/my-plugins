# Subtask 2 Plan

## Objective
Refactor TPD commands to Team-first orchestration with communication and fallback.

## Inputs
- `plugins/tpd/commands/thinking.md`
- `plugins/tpd/commands/plan.md`
- `plugins/tpd/commands/dev.md`

## Outputs
- Updated command files with Team tools and concise steps.

## Execution Steps
1. Update frontmatter tools for team operations.
2. Rebuild each phase with TeamCreate/TaskCreate/TaskOutput/SendMessage/TeamDelete flow.
3. Preserve OpenSpec artifact contracts and fallback path.

## Risks
- Incompatibility with prior no-team execution expectations.

## Verification
- Team tool names present in frontmatter.
- Artifact paths preserved under `openspec/changes/<proposal_id>/`.
