## 1. Baseline & Protocol

- [x] 1.1 Define OpenSpec artifact protocol document and manifest fields in change artifacts (`plan/plugin-subtasks.md`).
  - Files: `openspec/changes/refactor-plugin-artifact-governance-with-openspec/plan/plugin-subtasks.md`
  - [TEST] Verify protocol includes required fields (`workflow`, `run_id`, `phase`, `artifacts`, `depends_on`, `status`).

- [x] 1.2 Add/validate spec deltas for `artifact-governance` and `workflow-lifecycle`.
  - Files: `openspec/changes/refactor-plugin-artifact-governance-with-openspec/specs/artifact-governance/spec.md`, `openspec/changes/refactor-plugin-artifact-governance-with-openspec/specs/workflow-lifecycle/spec.md`
  - [TEST] `openspec validate refactor-plugin-artifact-governance-with-openspec --strict --no-interactive` passes.

## 2. TPD Pilot (No Copy, Manifest-Driven)

- [x] 2.1 Refactor thinking phase to emit manifest + lineage references.
  - Files: `plugins/tpd/commands/thinking.md`
  - [TEST] Thinking phase output contract contains `artifact-manifest.json` generation and validation checkpoint.

- [x] 2.2 Refactor plan phase to consume thinking via manifest (remove cp copy chain).
  - Files: `plugins/tpd/commands/plan.md`
  - [TEST] No `cp "${THINKING_DIR}/..."` remains; plan prerequisites validated via manifest lookup.

- [x] 2.3 Refactor dev phase to consume plan/thinking via manifest (remove cp copy chain).
  - Files: `plugins/tpd/commands/dev.md`
  - [TEST] No `cp "${PLAN_DIR}/..."` remains; dev prerequisites validated via manifest lookup.

- [x] 2.4 Align TPD rules to hard-cutover constraints.
  - Files: `plugins/tpd/.trae/rules/workflow-rules.md`
  - [TEST] Rules explicitly forbid runtime read/write from `.claude/*/runs/*`.

## 3. Plugin Command Migration (Hard Cutover)

### Batch A: Critical/High Usage

- [x] 3.1 Migrate commit run path to OpenSpec.
  - Files: `plugins/commit/commands/commit.md`
  - [TEST] No `.claude/committing/runs` path remains.

- [x] 3.2 Migrate brainstorm run path to OpenSpec.
  - Files: `plugins/brainstorm/commands/brainstorm.md`
  - [TEST] No `.claude/brainstorm/runs` path remains.

- [x] 3.3 Migrate ui-design run path to OpenSpec.
  - Files: `plugins/ui-design/commands/ui-design.md`
  - [TEST] No `.claude/ui-design/runs` path remains.

### Batch B: Hardcoded/Path Risk

- [x] 3.4 Migrate bug-investigation absolute run path to OpenSpec.
  - Files: `plugins/bug-investigation/commands/investigate.md`
  - [TEST] No absolute `/Users/.../.claude/...` path remains.

- [x] 3.5 Migrate code-review absolute run path to OpenSpec.
  - Files: `plugins/code-review/commands/review.md`
  - [TEST] No absolute `/Users/.../.claude/...` path remains.

### Batch C: Plan-Execute Family

- [x] 3.6 Migrate plan-execute plan command run path.
  - Files: `plugins/plan-execute/commands/plan.md`
  - [TEST] No `.claude/plan-execute/runs` path remains.

- [x] 3.7 Migrate plan-execute csv command run path.
  - Files: `plugins/plan-execute/commands/csv.md`
  - [TEST] No `.claude/plan-execute/runs` path remains.

- [x] 3.8 Migrate plan-execute execute command run path.
  - Files: `plugins/plan-execute/commands/execute.md`
  - [TEST] Cross-phase prerequisites reference OpenSpec path only.

### Batch D: Remaining Workflow Commands

- [x] 3.9 Migrate database-design run path.
  - Files: `plugins/database-design/commands/design.md`
  - [TEST] No `.claude/database-design/runs` path remains.

- [x] 3.10 Migrate security-audit run path.
  - Files: `plugins/security-audit/commands/audit.md`
  - [TEST] No `.claude/security-audit/runs` path remains.

- [x] 3.11 Migrate tdd run path.
  - Files: `plugins/tdd/commands/tdd.md`
  - [TEST] No `.claude/tdd/runs` path remains.

- [x] 3.12 Migrate feature-impl run path.
  - Files: `plugins/feature-impl/commands/implement.md`
  - [TEST] No `.claude/feature-impl/runs` path remains.

- [x] 3.13 Migrate refactor run path.
  - Files: `plugins/refactor/commands/refactor.md`
  - [TEST] No `.claude/refactoring/runs` path remains.

- [x] 3.14 Migrate refactor-team run path.
  - Files: `plugins/refactor-team/commands/refactor.md`
  - [TEST] No `.claude/refactor-team/runs` path remains.

### Batch E: Commands with implicit runtime references

- [x] 3.15 Validate/adjust context-memory command path strategy.
  - Files: `plugins/context-memory/commands/memory.md`
  - [TEST] Any runtime artifact location is OpenSpec-only.

- [x] 3.16 Validate/adjust docflow commands path strategy.
  - Files: `plugins/docflow/commands/init-doc.md`, `plugins/docflow/commands/what.md`, `plugins/docflow/commands/with-scout.md`
  - [TEST] No hidden `.claude/*/runs` assumptions remain.

## 4. Tooling & Guards

- [x] 4.1 Add guard script/check for legacy `.claude/*/runs` references in plugin commands.
  - Files: `scripts/validate-skills.sh` (or new script under `scripts/`)
  - [TEST] CI check fails when command file contains forbidden legacy run path.

- [x] 4.2 Update plugin sync/validation docs if path assumptions changed.
  - Files: `scripts/sync-plugins.sh`, related comments/docs
  - [TEST] Sync and validation run without path-related warnings.

## 5. Lifecycle Cleanup (No Runtime Compatibility)

- [x] 5.1 Implement one-time archive/cleanup procedure for historical `.claude/*/runs/*` artifacts.
  - Files: `openspec/changes/refactor-plugin-artifact-governance-with-openspec/plan/plugin-subtasks.md` (procedure), optional cleanup script
  - [TEST] Dry-run reports all target paths; execute mode cleans expected directories only.

- [x] 5.2 Generate cleanup audit report and attach to change artifacts.
  - Files: `openspec/changes/refactor-plugin-artifact-governance-with-openspec/plan/cleanup-report.md`
  - [TEST] Report includes before/after counts and reclaimed size.

## 6. Documentation Updates

- [x] 6.1 Update architecture docs to OpenSpec-only runtime model.
  - Files: `llmdoc/architecture/workflow-orchestration.md`, `llmdoc/architecture/plugin-system.md`
  - [TEST] No docs claim `.claude/{plugin}/runs/{timestamp}` as active runtime source.

- [x] 6.2 Update coding/reference conventions for new artifact standard.
  - Files: `llmdoc/reference/coding-conventions.md`, `llmdoc/reference/workflow-inventory.md`
  - [TEST] Runtime directory section matches hard-cutover policy.

- [x] 6.3 Clean residual runtime path examples in workflow-facing docs and agent prompts.
  - Files: `plugins/*/CLAUDE.md`, `plugins/refactor-team/agents/*/*.md`, `plugins/tpd/skills/plan-synthesizer/references/plan-standard.md`, `plugins/tpd/TPD-leadership-briefing.md`, `llmdoc/architecture/commit-workflow.md`, `llmdoc/architecture/plugin-architecture.md`, `llmdoc/guides/how-to-design-a-workflow.md`
  - [TEST] No `.claude/*/runs`, `.runtime/*`, or `openspec/changes/*/artifacts/*` examples remain in active `plugins/` and `llmdoc/` docs.

## 7. Final Validation & Handoff

- [x] 7.1 Validate OpenSpec change strictly.
  - [TEST] `openspec validate refactor-plugin-artifact-governance-with-openspec --strict --no-interactive` passes.

- [x] 7.2 Repository-wide grep checks.
  - [TEST] `rg -n "\.claude/.*/runs" plugins/*/commands/*.md` returns no results.
  - [TEST] `rg -n "/Users/.*/\.claude/" plugins/*/commands/*.md` returns no results.

- [x] 7.3 Produce migration completion summary.
  - Files: `openspec/changes/refactor-plugin-artifact-governance-with-openspec/plan/migration-summary.md`
  - [TEST] Summary includes migrated files, failed checks (if any), and next actions.

- [x] 7.4 Execute full-scope residual path scan (commands + workflow docs).
  - [TEST] `rg -n "\.claude/.*/runs|/Users/.*/\.claude/|\.runtime/|openspec/changes/.*/artifacts" plugins llmdoc` returns no results.
