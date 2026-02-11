# Subtask Plan: 5.1 (legacy run artifacts cleanup procedure)

## Meta

- Subtask ID: 5.1
- Targets:
  - `openspec/changes/refactor-plugin-artifact-governance-with-openspec/plan/plugin-subtasks.md`
  - `scripts/cleanup-legacy-runs.sh` (new optional helper script)
- Goal: Define and implement one-time cleanup procedure for historical `.claude/*/runs/*` artifacts.
- Date: 2026-02-11

## Objective

Provide an executable cleanup runbook that supports:
1. dry-run inventory (paths, counts, sizes);
2. execute mode cleanup scoped only to legacy `.claude/*/runs` directories inside project;
3. deterministic output usable for cleanup audit reporting.

## Inputs

- Existing migration protocol doc (`plugin-subtasks.md`)
- Current filesystem legacy directories under project `.claude/*/runs`
- Hard-cutover policy (no runtime compatibility)

## Outputs

- Updated cleanup procedure section in `plugin-subtasks.md`
- New `scripts/cleanup-legacy-runs.sh` with dry-run/execute modes

## Execution Steps

1. Add a dedicated “Lifecycle Cleanup Procedure” section to `plugin-subtasks.md` with command examples.
2. Create `scripts/cleanup-legacy-runs.sh`:
   - default dry-run inventory
   - `--execute` for deletion
   - machine-readable summary lines for report generation
3. Run dry-run to verify scope and safety.
4. (One-time) run execute mode to remove legacy directories within allowed scope only.
5. Run dry-run again to confirm cleanup completion.

## Risks

- Destructive operation risk if target scope is too broad.
- Need strict path guard to avoid touching non-project directories.

## Verification

- Dry-run lists only project-local `.claude/*/runs` paths.
- Execute mode removes only listed directories.
- Post-cleanup dry-run reports zero remaining targets.

## Done Criteria

- 5.1 acceptance met: cleanup procedure is documented and script-backed with dry-run + execute behavior.
- Scope is explicitly constrained to project `.claude/*/runs` directories.
