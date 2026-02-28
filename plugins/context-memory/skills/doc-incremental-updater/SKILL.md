---
name: doc-incremental-updater
description: |
  Incrementally update CLAUDE.md for modules affected by recent git changes.
  [Trigger] After committing changes that affect module APIs or structure.
  [Output] Updated CLAUDE.md files for changed modules + ${run_dir}/incremental-summary.md
  [Skip] When no git changes detected or changes are test-only.
  [Ask] Which base_ref to diff against if not HEAD~1.
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - Glob
  - Grep
arguments:
  - name: run_dir
    type: string
    required: true
    description: Output directory for update artifacts
  - name: base_ref
    type: string
    required: false
    description: "Git ref to diff against (default: HEAD~1)"
  - name: dry_run
    type: boolean
    required: false
    description: Preview changes without writing CLAUDE.md files
---

# doc-incremental-updater

## Purpose

Update only the CLAUDE.md files affected by recent code changes. Uses change-detector to identify affected modules, then runs targeted multi-model updates.

## Critical Constraint: External Model Required

**You MUST use `Skill("context-memory:codex-cli", ...)` and/or `Skill("context-memory:gemini-cli", ...)` for CLAUDE.md content generation.** Do NOT generate CLAUDE.md content inline (except for `config` change type which permits inline updates).

Fallback chain (strict order):

1. Both `codex-cli` + `gemini-cli` in parallel — for `api` changes
2. `codex-cli` only — for `internal` changes (faster)
3. Claude inline — **ONLY for `config` changes**, or if BOTH external models fail (log failure reason)

## Architecture

```
change-detector → changed-modules.json
    ↓
For each changed/impacted module:
    ├─ Skill:codex-cli(doc-generator) ─┐ PARALLEL
    └─ Skill:gemini-cli(doc-generator) ─┘
    → Claude merges incremental diff
    → Write updated CLAUDE.md
```

## Steps

### Phase 1: Change Detection

1. Call `Skill("context-memory:change-detector", {run_dir, base_ref})`.
2. Read `${run_dir}/changed-modules.json`.
3. If no changes detected, report "nothing to update" and exit.

### Phase 2: Targeted Updates

4. For each module in `changed` + `impacted`:
   a. Read existing `{module}/CLAUDE.md`.
   b. Read changed files within the module (git diff content).
   c. Build incremental update prompt:
   - Current CLAUDE.md content
   - Specific changes made (diff summary)
   - Change type (api, internal, config, test)
     d. For `api` changes: call both `Skill("context-memory:codex-cli", {role: "doc-generator", ...})` and `Skill("context-memory:gemini-cli", {role: "doc-generator", ...})`.
     e. For `internal` changes: call `Skill("context-memory:codex-cli", {role: "doc-generator", ...})` only (faster).
     f. For `config` changes: use Claude inline (simple updates).
     g. For `test` changes: skip CLAUDE.md update (tests don't affect docs).

### Phase 3: Merge and Write

5. Merge model outputs with existing CLAUDE.md:
   - Preserve existing structure and sections.
   - Update only sections affected by changes.
   - Add new sections if new functionality introduced.
6. If `dry_run`, write to `${run_dir}/preview/` instead.
7. Otherwise, write updated CLAUDE.md files.

### Phase 4: Summary

8. Write `${run_dir}/incremental-summary.md`:
   - Modules updated
   - Changes per module
   - Sections modified

## Verification

- Every changed module (excluding test-only) has an updated or reviewed CLAUDE.md.
- Existing CLAUDE.md structure is preserved (no sections deleted).
- Incremental summary exists with accurate change counts.
