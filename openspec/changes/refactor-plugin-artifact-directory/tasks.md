# Tasks: Refactor Plugin Artifact Directory

## 1. Core Infrastructure

- [ ] 1.1 Ensure `.claude/runs/` directory convention is documented in project CLAUDE.md
- [ ] 1.2 Add `.claude/runs/` to `.gitignore` (ephemeral artifacts should not be committed)

## 2. Plugin Command Updates (Batch 1: High-frequency plugins)

- [ ] 2.1 Update `plugins/commit/commands/commit.md` — change `openspec/changes/` to `.claude/runs/`, change ID format to `commit-YYYYMMDD-HHMMSS`
- [ ] 2.2 Update `plugins/code-review/commands/review.md` — change directory + ID format to `review-YYYYMMDD-HHMMSS`
- [ ] 2.3 Update `plugins/brainstorm/commands/brainstorm.md` — change directory + ID format to `brainstorm-YYYYMMDD-HHMMSS`

## 3. Plugin Command Updates (Batch 2: Analysis plugins)

- [ ] 3.1 Update `plugins/security-audit/commands/audit.md` — change directory + ID format to `audit-YYYYMMDD-HHMMSS`
- [ ] 3.2 Update `plugins/bug-investigation/commands/investigate.md` — change directory + ID format to `investigate-YYYYMMDD-HHMMSS`
- [ ] 3.3 Update `plugins/database-design/commands/design.md` — change directory + ID format to `design-YYYYMMDD-HHMMSS`

## 4. Plugin Command Updates (Batch 3: Development plugins)

- [ ] 4.1 Update `plugins/feature-impl/commands/implement.md` — change directory + ID format to `implement-YYYYMMDD-HHMMSS`
- [ ] 4.2 Update `plugins/tdd/commands/tdd.md` — change directory + ID format to `tdd-YYYYMMDD-HHMMSS`
- [ ] 4.3 Update `plugins/refactor/commands/refactor.md` — change directory + ID format to `refactor-YYYYMMDD-HHMMSS`

## 5. Plugin Command Updates (Batch 4: Team and utility plugins)

- [ ] 5.1 Update `plugins/refactor-team/commands/refactor.md` — change directory + ID format to `refactor-team-YYYYMMDD-HHMMSS`
- [ ] 5.2 Update `plugins/plan-execute/commands/{plan,execute,csv}.md` — change directory + ID format to `plan-exec-YYYYMMDD-HHMMSS`
- [ ] 5.3 Update `plugins/ui-design/commands/ui-design.md` — change directory + ID format to `ui-design-YYYYMMDD-HHMMSS`
- [ ] 5.4 Update `plugins/context-memory/commands/memory.md` — change directory + ID format to `memory-YYYYMMDD-HHMMSS`

## 6. Plugin CLAUDE.md Updates

- [ ] 6.1 Update any plugin CLAUDE.md files that reference `openspec/changes/` for run artifacts

## 7. Validation

- [ ] 7.1 Verify `openspec list` only shows real change proposals
- [ ] 7.2 Run `openspec validate --strict --no-interactive` on all existing changes
- [ ] 7.3 Test one plugin (e.g., `/code-review:review`) to confirm artifacts go to `.claude/runs/`
