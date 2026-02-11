# Subtask Plan: S1-3 (tpd dev consume plan/thinking via manifest)

## Meta

- Subtask ID: S1-3
- Target file: `plugins/tpd/commands/dev.md`
- Goal: Remove plan/thinking copy chains and convert dev prerequisites to manifest-resolved references.
- Date: 2026-02-11

## Objective

Refactor `/tpd:dev` command spec so that:
1. dev phase resolves plan/thinking artifacts via `artifact-manifest.json` instead of copying into `DEV_DIR`;
2. no `cp` from `PLAN_DIR` or `THINKING_DIR` remains;
3. execution steps reference resolved artifact variables (`PLAN_CONSTRAINTS_MD`, etc.);
4. previous phase integration/data flow is updated to no-copy model.

## Inputs

- Existing `plugins/tpd/commands/dev.md`
- S1-1 (`thinking.md`) manifest contract
- S1-2 (`plan.md`) manifest-driven integration pattern
- OpenSpec requirements:
  - `.../specs/artifact-governance/spec.md`
  - `.../specs/workflow-lifecycle/spec.md`

## Outputs

- Updated `plugins/tpd/commands/dev.md` with:
  - `PLAN_MANIFEST` / `THINKING_MANIFEST` resolution block;
  - plan/thinking artifact variable mapping;
  - no copy chain references in steps and data flow.

## Execution Steps

1. Rewrite Step 1 integration:
   - introduce `PLAN_META_DIR`, `PLAN_MANIFEST`, `THINKING_META_DIR`, `THINKING_MANIFEST`;
   - resolve required plan artifacts from manifest;
   - resolve optional thinking artifacts from manifest;
   - replace task snapshot copy with direct task file reference.
2. Update Step 2/4 references from `plan-*` and `thinking-*` copied files to resolved variables.
3. Update completion and iteration wording (remove copied tasks.md language).
4. Rewrite "Previous Phase Integration" tables + data flow to manifest-based references.
5. Ensure no `cp "${PLAN_DIR}/..."` and no `cp "${THINKING_DIR}/..."` remain.

## Risks

- Dev command currently assumes copied filenames; replacing references must be consistent across all steps.
- If plan manifest field naming drifts, future execution may require harmonization in S1-4 rules.

## Verification

- `rg -n "cp \"\$\{PLAN_DIR\}|cp \"\$\{THINKING_DIR\}" plugins/tpd/commands/dev.md` returns no matches.
- `rg -n "plan-(architecture|constraints|pbt|risks|context)|thinking-(synthesis|clarifications)" plugins/tpd/commands/dev.md` returns no copied-file dependencies.
- `rg -n "PLAN_MANIFEST|THINKING_MANIFEST|PLAN_CONSTRAINTS_MD|THINKING_CLARIFICATIONS_MD" plugins/tpd/commands/dev.md` confirms manifest-variable usage.

## Done Criteria

- S1-3 acceptance met: dev phase prerequisites come from manifest lookup, and plan/thinking copy chain is removed.
- Changes remain limited to `plugins/tpd/commands/dev.md`.
