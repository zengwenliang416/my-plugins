# Subtask Plan: S2-3 (ui-design command OpenSpec run path migration)

## Meta

- Subtask ID: S2-3
- Target file: `plugins/ui-design/commands/ui-design.md`
- Goal: Migrate ui-design workflow runtime directory from `.claude/ui-design/runs/*` to OpenSpec artifact hierarchy.
- Date: 2026-02-11

## Objective

Update `/ui-design` command definition so that:
1. new-run and resume branches both resolve to OpenSpec-only runtime directory;
2. command examples/documented run directory structure no longer mention legacy `.claude` path;
3. all phase artifacts keep using `${RUN_DIR}` and behavior remains unchanged.

## Inputs

- Current `plugins/ui-design/commands/ui-design.md`
- OpenSpec hard-cutover requirements for Batch A migration
- Established convention from S2-1/S2-2:
  - `CHANGE_ID="runtime-<workflow>-workflow"`
  - `RUN_DIR="openspec/changes/${CHANGE_ID}/<workflow>/${RUN_ID}"`

## Outputs

- Updated `plugins/ui-design/commands/ui-design.md` using OpenSpec-only runtime path in init and documentation sections.

## Execution Steps

1. Replace Phase 1 run directory creation snippet with OpenSpec path for both resume/new branches.
2. Add hard-cutover policy note near init phase.
3. Update "Run Directory Structure" header path from `.claude/ui-design/runs/${RUN_ID}` to OpenSpec path.
4. Keep all `${RUN_DIR}` references untouched.
5. Verify no `.claude/ui-design/runs` string remains.

## Risks

- Existing user habits may still assume old run path; docs and follow-up tasks must align after command migration.
- Resume branch must keep deterministic path derivation to find prior artifacts.

## Verification

- `rg -n "\.claude/ui-design/runs" plugins/ui-design/commands/ui-design.md` returns no matches.
- `rg -n "CHANGE_ID|openspec/changes/.*/ui-design" plugins/ui-design/commands/ui-design.md` confirms new path wiring.

## Done Criteria

- S2-3 acceptance met: ui-design command no longer references `.claude/ui-design/runs`.
- Single-file migration complete without workflow semantic changes.
