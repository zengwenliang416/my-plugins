# Subtask 6 Plan

## Objective
Reduce the number of TPD agents under `plugins/tpd/agents` by merging overlapping responsibilities while keeping Team-first workflow semantics.

## Inputs
- Existing agents under `plugins/tpd/agents/**`
- Command orchestrations in `plugins/tpd/commands/{thinking,plan,dev}.md`
- Current message protocol and artifact contracts

## Outputs
- A simplified agent set with fewer files
- Updated command `subagent_type` usage aligned with merged agents
- No dangling references to removed agents in TPD commands

## Execution Steps
1. Map all current agent call sites and constraints.
2. Define merge mapping with minimal behavior change.
3. Implement merged agents and remove replaced files.
4. Update commands to call merged agents with explicit mode/model/focus args.
5. Validate references and style checks.

## Risks
- Breaking command-agent compatibility if subagent_type names are not updated consistently.
- Losing specialized behavior during over-merging.

## Verification
- `rg` confirms no stale references to removed agents in `plugins/tpd/commands`.
- Team communication and artifact expectations remain documented.
- Formatting constraints (no decorative table/emoji) remain satisfied.
