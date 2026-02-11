# Subtask Plan: 6.1 (architecture docs update to OpenSpec-only runtime model)

## Meta

- Subtask ID: 6.1
- Target files:
  - `llmdoc/architecture/workflow-orchestration.md`
  - `llmdoc/architecture/plugin-system.md`
- Goal: Remove legacy `.claude/{plugin}/runs/{timestamp}` runtime guidance from architecture docs.
- Date: 2026-02-11

## Objective

Align architecture documentation with hard-cutover runtime governance:
1. OpenSpec becomes the single runtime artifact source;
2. generic and TPD-specific path conventions are both documented clearly;
3. no architecture text claims `.claude/{plugin}/runs/{timestamp}` as active runtime source.

## Inputs

- Current architecture docs listed above
- Implemented command migration results
- OpenSpec runtime convention (`openspec/changes/.../...`)

## Outputs

- Updated architecture docs with OpenSpec-only runtime model and examples.

## Execution Steps

1. Replace legacy state/run-directory references in `workflow-orchestration.md` with OpenSpec path model.
2. Update run directory pattern section to show generic workflow + TPD proposal paths.
3. Update plugin system rationale to remove `.claude` runtime claim.
4. Verify no `.claude/{plugin}/runs/{timestamp}` remains in both files.

## Risks

- Docs must preserve conceptual clarity while changing path examples.
- Need to avoid overfitting to one plugin; keep guidance generic and accurate.

## Verification

- `rg -n "\.claude/\{plugin\}/runs|\.claude/.*/runs" llmdoc/architecture/workflow-orchestration.md llmdoc/architecture/plugin-system.md` returns no matches.
- Updated sections describe OpenSpec-only runtime source.

## Done Criteria

- 6.1 acceptance met: architecture docs fully reflect OpenSpec-only runtime model.
