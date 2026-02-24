# Change: Refactor Plugin Artifact Storage from openspec/changes/ to .claude/runs/

## Why

All 13 non-TPD plugins currently dump their run artifacts into `openspec/changes/`, which is designed exclusively for OpenSpec change proposals. This causes:

1. `openspec list` is polluted with non-change directories (timestamps like `20260222T141638Z`)
2. `openspec validate` fails on these directories (no `specs/`, no `proposal.md`)
3. Timestamp-based IDs (`20260222T141638Z`, `20260208-143022`) violate OpenSpec's verb-led kebab-case convention
4. No semantic distinction between actual change proposals and ephemeral plugin runs

## What Changes

- **BREAKING**: Move plugin run artifact base directory from `openspec/changes/${ID}` to `.claude/runs/${ID}` for all non-TPD plugins
- Affected plugins (13): code-review, security-audit, commit, brainstorm, tdd, database-design, feature-impl, bug-investigation, refactor, refactor-team, plan-execute, ui-design, context-memory
- TPD plugin remains in `openspec/changes/` (it creates actual OpenSpec change proposals)
- Standardize run ID format to `{plugin}-{YYYYMMDD-HHMMSS}` (e.g., `code-review-20260222-141638`)

## Impact

- Affected specs: None (new convention, no existing spec)
- Affected code: 15 command files across 13 plugins
- Compatibility: Existing artifacts under `openspec/changes/` remain untouched (no migration needed)
- `openspec list` becomes clean — only real change proposals appear
