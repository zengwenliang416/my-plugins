# Subtask Plan: 4.1 (legacy path guard in validate-skills script)

## Meta

- Subtask ID: 4.1
- Target file: `scripts/validate-skills.sh`
- Goal: Add CI guard that fails when plugin command files contain legacy runtime paths.
- Date: 2026-02-11

## Objective

Enhance validation tooling so CI/local validation reports errors when any `plugins/*/commands/*.md` contains:
1. legacy `.claude/*/runs` path references;
2. absolute `/Users/.../.claude/...` path references.

## Inputs

- Current `scripts/validate-skills.sh`
- Task requirement 4.1 and final grep criteria (7.2)

## Outputs

- Updated `scripts/validate-skills.sh` with command path guard function integrated into main validation flow.

## Execution Steps

1. Add helper function to scan command markdown files for forbidden path patterns.
2. Use `rg` if available, fallback to `grep` for portability.
3. On matches, emit `log_error` and print offending file:line entries.
4. Invoke guard before summary so non-zero errors fail script.
5. Run script and/or targeted grep to verify guard behavior and avoid false positives.

## Risks

- Overly broad regex could flag unrelated strings; patterns should target runtime legacy forms only.
- Script must remain compatible on environments without `rg`.

## Verification

- `bash scripts/validate-skills.sh` succeeds when no forbidden paths exist.
- Injected or existing forbidden paths would trigger `log_error` and non-zero exit.
- `rg -n "\.claude/.*/runs|/Users/.*/\.claude/" plugins/*/commands/*.md` remains empty.

## Done Criteria

- 4.1 acceptance met: validate script now enforces legacy runtime path guard for plugin commands.
- Guard is active in default execution flow.
