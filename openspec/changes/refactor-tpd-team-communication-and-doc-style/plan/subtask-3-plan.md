# Subtask 3 Plan

## Objective
Refactor all TPD agents to concise format and ensure communication hooks are explicit.

## Inputs
- `plugins/tpd/agents/**/*.md`

## Outputs
- Updated agents with minimal structure and message responsibilities.

## Execution Steps
1. Simplify each agent file to purpose, inputs, outputs, execution, communication, verification.
2. Ensure execution agents can send messages and report ACK expectations.
3. Remove decorative tables and emojis.

## Risks
- Missing specialized details from original long prompts.

## Verification
- No decorative tables/emojis in agent files.
- Execution agents include `SendMessage` in tools.
