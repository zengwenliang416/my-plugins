---
name: doc-full-updater
description: |
  Update all CLAUDE.md files via multi-model analysis with layer-ordered processing.
  [Trigger] User requests full CLAUDE.md refresh or project structure changed significantly.
  [Output] Updated {module}/CLAUDE.md files + ${run_dir}/audit-report.md
  [Skip] When only a few modules changed (use doc-incremental-updater instead).
  [Ask] Whether to run in dry_run mode to preview changes first.
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - Glob
  - Grep
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Output directory for update artifacts
  - name: modules_json
    type: string
    required: false
    description: Path to existing modules.json (skip module-discovery if provided)
  - name: dry_run
    type: boolean
    required: false
    description: Preview changes without writing CLAUDE.md files
---

# doc-full-updater

## Purpose

Update all project CLAUDE.md files using multi-model analysis (Codex + Gemini), processing modules in layer order (3→2→1) so lower-layer docs inform higher-layer generation.

## Architecture

```
module-discovery → modules.json
    ↓
For each layer (3→2→1):
    ├─ codex-core(doc-generator) ─┐ PARALLEL
    └─ gemini-core(doc-generator) ─┘
    → Claude merges best output
    → doc-worker writes CLAUDE.md
    ↓
codex-core(auditor) → quality review
```

## Steps

### Phase 1: Module Discovery

1. If `modules_json` provided, read it. Otherwise call `Skill("context-memory:module-discovery", {run_dir})`.
2. Validate `modules.json` has layers and modules.

### Phase 2: Layer-Ordered Processing

3. Process layers in order: 3 → 2 → 1.
4. For each layer, for each module:
   a. Read existing `{module}/CLAUDE.md` if present.
   b. Use `mcp__auggie-mcp__codebase-retrieval` to get module context.
   c. Build update prompt including:
   - Current CLAUDE.md content (if exists)
   - Module file list and structure
   - Already-updated lower-layer CLAUDE.md files (for cross-references)
     d. Call both `Skill("context-memory:codex-cli", {role: "doc-generator", prompt: <update_prompt>, run_dir, session_id})` and `Skill("context-memory:gemini-cli", {role: "doc-generator", prompt: <update_prompt>, run_dir, session_id})` in parallel.
     e. Merge outputs: take the more complete version, supplement with unique details from the other.
     f. Write merged content to `${run_dir}/merged-docs-{module_name}.md`.

### Phase 3: Writing

5. If not `dry_run`, write each `{module}/CLAUDE.md` from merged content.
6. If `dry_run`, write preview to `${run_dir}/preview/` instead.

### Phase 4: Quality Audit

7. Call `Skill("context-memory:codex-cli", {role: "auditor", prompt: <audit_prompt>, run_dir, session_id})` to review all generated CLAUDE.md files.
8. Write audit report to `${run_dir}/audit-report.md`.
9. If audit finds critical issues, flag them but do not auto-fix.

### Phase 5: Summary

10. Write `${run_dir}/update-summary.md` with:
    - Modules updated (count and list)
    - Modules skipped (no changes needed)
    - Audit findings
    - Time taken

## Multi-Model Fallback

- If Gemini fails, use Codex output only.
- If Codex fails, use Gemini output only.
- If both fail, use Claude inline analysis (codebase-retrieval + Read).

## Verification

- Every module in `modules.json` has a corresponding merged output or skip reason.
- Updated CLAUDE.md files have required sections (overview, key files, conventions).
- Audit report exists and all critical issues are flagged.
