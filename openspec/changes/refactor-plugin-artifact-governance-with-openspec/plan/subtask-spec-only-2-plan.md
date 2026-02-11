# Subtask Plan: spec-only-2 (TPD path pivot to change-root phase dirs)

## Meta

- Subtask ID: spec-only-2
- Target files:
  - `plugins/tpd/commands/thinking.md`
  - `plugins/tpd/commands/plan.md`
  - `plugins/tpd/commands/dev.md`
  - `plugins/tpd/.trae/rules/workflow-rules.md`
- Goal: remove legacy nested runtime path dependency while keeping TPD phase isolation.
- Date: 2026-02-11

## Objective

Refactor TPD command docs to spec/change-only structure:
1. no `openspec/changes/${PROPOSAL_ID}/...` paths;
2. phase dirs move under `openspec/changes/${PROPOSAL_ID}/{thinking|plan|dev}`;
3. manifest/lineage rules remain valid with updated locations.

## Inputs

- Current TPD command docs and workflow rules
- User decision: spec/change only, drop independent artifact hierarchy

## Outputs

- Updated TPD command and rule docs with direct phase paths.

## Execution Steps

1. Replace legacy nested thinking path with direct `.../thinking`.
2. Replace legacy nested `.../plan|thinking|dev` paths in plan/dev commands.
3. Update workflow rules text to new phase directories.
4. Verify no legacy nested path remains in TPD command/rules files.

## Risks

- TPD relies heavily on manifest path continuity; path edits must be consistent across all three phases.

## Verification

- `rg -n "openspec/changes/.*/(thinking|plan|dev)" plugins/tpd/commands/*.md plugins/tpd/.trae/rules/workflow-rules.md`
- `rg -n "openspec/changes/.*/artifacts" plugins/tpd/commands/*.md plugins/tpd/.trae/rules/workflow-rules.md` returns no matches

## Done Criteria

- TPD docs are consistent with spec/change-only path policy while preserving phase separation.
