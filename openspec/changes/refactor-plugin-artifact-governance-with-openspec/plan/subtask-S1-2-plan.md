# Subtask Plan: S1-2 (tpd plan consume thinking via manifest)

## Meta

- Subtask ID: S1-2
- Target file: `plugins/tpd/commands/plan.md`
- Goal: Remove thinking artifact copy chain (`cp`) and switch to manifest/lineage reference consumption.
- Date: 2026-02-11

## Objective

Refactor `/tpd:plan` command spec so that:
1. thinking integration checks `meta/artifact-manifest.json` rather than copied files;
2. no `cp "${THINKING_DIR}/..."` remains;
3. downstream steps refer to resolved thinking artifact paths (from manifest) directly;
4. bottom "Thinking Phase Integration / Data Flow" reflects no-copy contract.

## Inputs

- Existing `plugins/tpd/commands/plan.md`
- S1-1 output contract in `plugins/tpd/commands/thinking.md` (`meta/artifact-manifest.json`, `meta/lineage.json`)
- OpenSpec requirements in:
  - `.../specs/artifact-governance/spec.md`
  - `.../specs/workflow-lifecycle/spec.md`

## Outputs

- Updated `plugins/tpd/commands/plan.md`:
  - manifest-first thinking detection and resolution logic
  - no copy chain from thinking to plan
  - updated anti-pattern/core rules and handoff data flow description

## Execution Steps

1. Update core rules / anti-pattern references from copied `thinking-*` files to manifest resolution.
2. Rewrite Step 1 thinking integration block:
   - define `THINKING_META_DIR` and `THINKING_MANIFEST`
   - set `THINKING_COMPLETED` by manifest + handoff entries
   - resolve artifact paths (handoff/synthesis/boundaries/clarifications) from manifest.
3. Update Step 2/4 instructions and skill args to use resolved thinking paths.
4. Replace "Thinking Phase Integration" section's copy-based data flow with manifest/lineage-based flow.
5. Ensure no `cp "${THINKING_DIR}/..."` remains.

## Risks

- Plan command is long; replacing variable names may leave inconsistent references.
- If manifest keys are described ambiguously, downstream S1-3 may need harmonization.

## Verification

- `rg -n "cp \"\$\{THINKING_DIR\}" plugins/tpd/commands/plan.md` should return no matches.
- `rg -n "thinking-(handoff|synthesis|boundaries|clarifications)" plugins/tpd/commands/plan.md` should be eliminated or intentionally documented as legacy-free aliases.
- `rg -n "artifact-manifest.json|THINKING_MANIFEST|THINKING_META_DIR" plugins/tpd/commands/plan.md` should show new manifest usage.

## Done Criteria

- S1-2 acceptance met: no thinking copy chain and plan prerequisites use manifest lookup.
- Changes are limited to `plugins/tpd/commands/plan.md`.
