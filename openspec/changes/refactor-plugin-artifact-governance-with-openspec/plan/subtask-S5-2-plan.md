# Subtask Plan: S5-2 (security-audit command OpenSpec run path migration)

## Meta

- Subtask ID: S5-2
- Target file: `plugins/security-audit/commands/audit.md`
- Goal: Migrate security-audit runtime path to OpenSpec and align documented run structure.
- Date: 2026-02-11

## Objective

Update `/security-audit` command so that:
1. Phase 1 initialization uses OpenSpec-only runtime path;
2. run directory structure section no longer mentions `.claude/security-audit/runs`;
3. all `${RUN_DIR}` references remain behavior-compatible.

## Inputs

- Current `plugins/security-audit/commands/audit.md`
- Batch D requirement 3.10
- Existing naming convention for runtime `CHANGE_ID`

## Outputs

- Updated `plugins/security-audit/commands/audit.md` with OpenSpec-only path in both setup and documentation snippets.

## Execution Steps

1. Update Phase 1 snippet:
   - add `CHANGE_ID="runtime-security-audit-workflow"`
   - set `RUN_DIR="openspec/changes/${CHANGE_ID}/security-audit/${TIMESTAMP}"`
2. Add hard-cutover note near initialization.
3. Replace run directory structure header path with OpenSpec path.
4. Keep all downstream `${RUN_DIR}` references unchanged.
5. Verify removal of `.claude/security-audit/runs`.

## Risks

- Documentation snippet must match runtime initialization to avoid operator confusion.
- Timestamp-based run ids should stay unchanged for consistency.

## Verification

- `rg -n "\.claude/security-audit/runs" plugins/security-audit/commands/audit.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/security-audit" plugins/security-audit/commands/audit.md` confirms migration.

## Done Criteria

- S5-2 acceptance met: security-audit command has no `.claude/security-audit/runs` references.
- Single-file migration complete without behavior drift.
