# Subtask Plan: spec-only-6 (legacy path textual residue cleanup)

## Objective

Clean remaining stale textual references to legacy OpenSpec nested path layout, and align repository docs/records to pure spec/change layout.

## Inputs

- Current repository after nested directory removal.
- OpenSpec change package `refactor-plugin-artifact-governance-with-openspec`.
- Existing guards (`scripts/validate-skills.sh`) that intentionally detect forbidden runtime paths in command files.

## Outputs

- Updated files where stale nested OpenSpec change paths still exist.
- Updated wording where examples still describe legacy nested directories.
- Validation evidence proving no active runtime/documentation dependence on legacy nested directories.

## Execution Steps

1. Scan all files for legacy nested path patterns.
2. Classify matches:
   - must-fix (stale positive paths/docs)
   - keep-as-policy (forbidden-path checks, negative assertions)
3. Apply batch replacements for must-fix matches.
4. Re-scan and patch edge cases.
5. Run validation commands and record outcomes.

## Risks

- Over-replacing could alter intentional guard logic.
- Historical records may intentionally keep old wording for audit context.

## Verification

- `openspec validate refactor-plugin-artifact-governance-with-openspec --strict --no-interactive`
- `bash scripts/validate-skills.sh`
- `rg -n "openspec/changes/.*/artifacts" openspec plugins llmdoc AGENTS.md` returns only policy/guard records
- `find openspec/changes -type d -name artifacts` returns no directories
