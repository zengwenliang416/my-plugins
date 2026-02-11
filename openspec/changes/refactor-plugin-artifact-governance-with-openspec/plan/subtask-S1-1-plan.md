# Subtask Plan: S1-1 (tpd thinking manifest/lineage)

## Meta

- Subtask ID: S1-1
- Target file: `plugins/tpd/commands/thinking.md`
- Goal: Add manifest/lineage-driven artifact contract to thinking phase and make checkpoints include manifest updates.
- Date: 2026-02-11

## Objective

Refactor `/tpd:thinking` command spec so that:
1. thinking phase produces `artifact-manifest.json` and `lineage.json`;
2. step checkpoints include manifest update expectations;
3. final handoff artifact list includes new governance artifacts;
4. guidance aligns with hard-cutover OpenSpec policy.

## Inputs

- Existing thinking command workflow and step checkpoints in `plugins/tpd/commands/thinking.md`.
- OpenSpec change requirements:
  - `.../specs/artifact-governance/spec.md`
  - `.../specs/workflow-lifecycle/spec.md`
- User policy: “每个子任务先完整计划再执行”。

## Outputs

- Updated `plugins/tpd/commands/thinking.md` with:
  - initialization creating/initializing manifest/lineage;
  - per-step state update text including manifest updates;
  - final artifact list containing manifest/lineage.

## Execution Steps

1. Update Step 0 initialization section:
   - Add creation of `META_DIR` and manifest/lineage bootstrapping.
   - Extend checkpoint verification to include manifest existence.
2. Update Step 1~6 checkpoint lines:
   - Add explicit “update `artifact-manifest.json`” requirement.
3. Update final summary artifact tree:
   - Add `meta/artifact-manifest.json` and `meta/lineage.json`.
4. Add a concise “handoff contract” note for `/tpd:plan` consumption by manifest reference.

## Risks

- Over-specifying file layout may conflict with later S1-2/S1-3 edits.
- Command markdown is declarative; wording must stay actionable and consistent with existing style.

## Verification

- Static checks:
  - `rg -n "artifact-manifest.json|lineage.json|META_DIR" plugins/tpd/commands/thinking.md`
- Semantic checks:
  - Ensure each step still has checkpoint language and now mentions manifest update.
  - Ensure no reference to `.claude/*/runs/*` is introduced.

## Done Criteria

- S1-1 acceptance met: thinking output contract clearly contains manifest generation and verification.
- Changes stay limited to `plugins/tpd/commands/thinking.md` (single-file subtask).
