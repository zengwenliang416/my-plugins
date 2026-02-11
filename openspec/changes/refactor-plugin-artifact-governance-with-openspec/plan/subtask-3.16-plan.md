# Subtask Plan: 3.16 (docflow commands path strategy validation)

## Meta

- Subtask ID: 3.16
- Target files:
  - `plugins/docflow/commands/init-doc.md`
  - `plugins/docflow/commands/what.md`
  - `plugins/docflow/commands/with-scout.md`
- Goal: Validate docflow commands for hidden legacy run path assumptions.
- Date: 2026-02-11

## Objective

Ensure docflow command set has no hidden `.claude/*/runs/*` assumptions and requires no runtime path migration.

## Inputs

- Docflow command files listed above
- Batch E requirement 3.16
- Hard-cutover policy

## Outputs

- Validation result for docflow command path strategy.
- Minimal edits only if legacy assumptions are detected.

## Execution Steps

1. Search all three files for legacy runtime path literals and absolute `.claude` paths.
2. Inspect command semantics for implicit run directory expectations.
3. If legacy assumptions exist, replace with OpenSpec conventions; otherwise keep files unchanged.
4. Record outcome in task tracking docs.

## Risks

- Hidden assumptions may appear in examples or comments, not only executable snippets.
- Over-editing could change command intent for docflow workflows.

## Verification

- `rg -n "\.claude/.*/runs|/Users/.*/\.claude/" plugins/docflow/commands/*.md`
- Confirm no runtime path dependency on legacy location.

## Done Criteria

- 3.16 acceptance met: docflow commands have no hidden legacy run path assumptions.
- Task marked complete with validation evidence.
