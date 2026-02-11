# Subtask Plan: S1-4 (tpd workflow-rules hard-cutover alignment)

## Meta

- Subtask ID: S1-4
- Target file: `plugins/tpd/.trae/rules/workflow-rules.md`
- Goal: Align TPD workflow rules with manifest/lineage integration and hard-cutover policy.
- Date: 2026-02-11

## Objective

Update TPD global workflow rules so they no longer require cross-phase artifact copying and instead enforce:
1. manifest/lineage-based phase continuity;
2. no runtime read/write from legacy `.claude/*/runs/*` paths;
3. fail-fast behavior when required manifest artifacts are missing.

## Inputs

- Current `plugins/tpd/.trae/rules/workflow-rules.md`
- Updated command contracts:
  - `plugins/tpd/commands/thinking.md`
  - `plugins/tpd/commands/plan.md`
  - `plugins/tpd/commands/dev.md`
- OpenSpec hard-cutover requirements in current change specs.

## Outputs

- Updated `plugins/tpd/.trae/rules/workflow-rules.md` with:
  - manifest/lineage continuity policy;
  - revised data flow model;
  - explicit prohibition of legacy runtime path usage.

## Execution Steps

1. Replace “复制相关产物并加前缀” with manifest-resolved references.
2. Update data flow section to include `artifact-manifest.json` as phase handoff source.
3. Add hard-cutover runtime policy section:
   - forbid `.claude/*/runs/*` runtime read/write;
   - missing required manifest/artifact must fail-fast.
4. Keep existing task splitting and write-scope constraints; adjust wording for consistency.

## Risks

- Rule text must remain concise but enforceable across both Claude/Trae contexts.
- If command contracts evolve, this rule file must be kept synchronized.

## Verification

- `rg -n "复制相关产物|thinking-synthesis\.md|plan-constraints\.md" plugins/tpd/.trae/rules/workflow-rules.md` should not indicate copy-based requirement.
- `rg -n "artifact-manifest\.json|lineage|\.claude/.*/runs|fail-fast" plugins/tpd/.trae/rules/workflow-rules.md` should show new policy markers.

## Done Criteria

- S1-4 acceptance met: rules explicitly disallow legacy runtime path and require manifest-based continuity.
- Only `plugins/tpd/.trae/rules/workflow-rules.md` is modified for this subtask.
