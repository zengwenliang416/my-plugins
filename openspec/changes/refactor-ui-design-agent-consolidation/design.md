## Context
`ui-design` currently orchestrates two teams and many specific agents. Most agent responsibilities are parameter variants of the same underlying tasks.

## Goals
- Reduce agent count significantly.
- Keep Team-first orchestration.
- Preserve artifact contracts and quality gates.
- Remove non-essential decorative formatting.

## Non-Goals
- No changes to shared style/token resource files.
- No changes to external wrapper scripts beyond existing invocation contract.

## Decisions
- Use 4 consolidated agents:
  1. `analysis-core`
  2. `design-core`
  3. `generation-core`
  4. `validation-core`
- Use `mode` and `perspective` arguments to route behavior.
- Keep run-dir artifact names consistent with existing output structure.

## Risks
- Parameterized agents may be less explicit than specialized files.
- Command update must avoid stale subagent references.

## Verification
- No stale references to removed agent names in `plugins/ui-design/commands`.
- `scripts/validate-skills.sh` passes.
- Style checks for decorative tables/emoji in refactored files pass.
