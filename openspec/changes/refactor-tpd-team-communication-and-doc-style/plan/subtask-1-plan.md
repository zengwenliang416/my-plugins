# Subtask 1 Plan

## Objective
Define concise templates and communication protocol for TPD commands/agents/skills.

## Inputs
- Existing TPD command/agent/skill markdown files.
- Official Team tools expectations in this repository.

## Outputs
- Template rules applied to all target files.
- Message protocol section (types, ACK, timeout, fallback).

## Execution Steps
1. Identify required invariant sections for each file type.
2. Define minimal section set and remove decorative constructs.
3. Encode communication protocol in command and execution-agent prompts.

## Risks
- Over-simplification removing required constraints.

## Verification
- Each file retains explicit input/output contracts.
- Communication protocol appears in Thinking/Plan/Dev command files.
