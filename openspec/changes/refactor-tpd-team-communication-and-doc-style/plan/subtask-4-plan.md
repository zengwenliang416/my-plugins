# Subtask 4 Plan

## Objective
Refactor TPD skills into concise execution format while preserving output contracts.

## Inputs
- `plugins/tpd/skills/*/SKILL.md`

## Outputs
- Updated skill docs with minimal actionable steps.

## Execution Steps
1. Extract required output artifacts for each skill.
2. Rewrite each SKILL.md to concise sections and numbered steps.
3. Remove decorative tables/emojis and redundant examples.

## Risks
- Output naming mismatch could break command expectations.

## Verification
- Output artifact names remain unchanged.
- Skill docs remain executable with clear args and file contracts.
