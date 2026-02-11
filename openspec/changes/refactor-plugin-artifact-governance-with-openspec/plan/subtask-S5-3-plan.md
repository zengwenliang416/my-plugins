# Subtask Plan: S5-3 (tdd command OpenSpec run path migration)

## Meta

- Subtask ID: S5-3
- Target file: `plugins/tdd/commands/tdd.md`
- Goal: Migrate TDD workflow runtime path to OpenSpec in setup and user-facing examples.
- Date: 2026-02-11

## Objective

Update `/tdd` command so that:
1. run directory creation uses OpenSpec-only path;
2. output text and examples no longer mention `.claude/tdd/runs/...`;
3. workflow semantics remain unchanged.

## Inputs

- Current `plugins/tdd/commands/tdd.md`
- Batch D requirement 3.11
- Established naming convention (`runtime-tdd-workflow`)

## Outputs

- Updated `plugins/tdd/commands/tdd.md` with OpenSpec path in initialization and example outputs.

## Execution Steps

1. Replace Phase 1 setup snippet with `CHANGE_ID + RUN_ID + RUN_DIR` under OpenSpec hierarchy.
2. Add hard-cutover policy note near initialization.
3. Update summary and example run directory strings to OpenSpec path.
4. Verify no `.claude/tdd/runs` remains.

## Risks

- Example strings can easily be missed, causing inconsistent guidance.
- Path placeholder style should remain readable for users.

## Verification

- `rg -n "\.claude/tdd/runs" plugins/tdd/commands/tdd.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/tdd|runtime-tdd-workflow" plugins/tdd/commands/tdd.md` confirms migration.

## Done Criteria

- S5-3 acceptance met: tdd command has no `.claude/tdd/runs` references.
- Command and examples are aligned to OpenSpec runtime model.
