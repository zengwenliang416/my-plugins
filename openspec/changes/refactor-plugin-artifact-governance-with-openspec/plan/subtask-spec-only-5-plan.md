# Subtask Plan: spec-only-5 (remove legacy nested layer)

## Objective

Remove the remaining legacy nested-layer management in the current OpenSpec change package and converge to pure `spec/change` structure.

## Inputs

- `openspec/changes/refactor-plugin-artifact-governance-with-openspec/`
- Repository AGENTS path rule and validation scripts

## Outputs

- `plan/` directory under the change as the only planning record location
- updated references in `tasks.md` and change docs
- removed obsolete nested directory under the change

## Execution Steps

1. Inventory all references to legacy nested plan paths.
2. Create target `plan/` directory and move docs to the new location.
3. Patch references in `tasks.md` and related docs to new `plan/` path.
4. Update `AGENTS.md` subtask plan path rule to match spec-only policy.
5. Remove now-empty legacy nested subtree.
6. Re-run validation and grep checks.

## Risks

- historical references may break if not patched comprehensively.
- deleting directories could lose useful audit records if not moved first.

## Verification

- `openspec validate refactor-plugin-artifact-governance-with-openspec --strict --no-interactive`
- `bash scripts/validate-skills.sh`
- `find openspec/changes/refactor-plugin-artifact-governance-with-openspec -type d -name artifacts` returns no directories
- `rg -n "refactor-plugin-artifact-governance-with-openspec/plan" openspec AGENTS.md plugins llmdoc scripts` confirms migrated references
