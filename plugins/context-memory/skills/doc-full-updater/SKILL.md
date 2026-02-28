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

## Critical Constraint: External Model Required

**You MUST call `gemini` and `codex` CLI directly via Bash for ALL CLAUDE.md content generation and auditing.** Do NOT generate or update content inline or spawn generic agents — your role is to prepare prompts, call external model CLIs, and merge their outputs.

### Direct CLI Invocation (Mandatory)

**Gemini + Codex in parallel (preferred):**

```bash
# Run both in parallel Bash calls
gemini -p "$(cat ${run_dir}/prompts/${module_name}.md)" --approval-mode plan -o text
codex exec "$(cat ${run_dir}/prompts/${module_name}.md)" -s read-only
```

**Codex for auditing:**

```bash
codex exec "$(cat ${run_dir}/prompts/audit.md)" -s read-only
```

Fallback chain (strict order):

1. Both `gemini` + `codex` CLI in parallel — preferred
2. Single CLI — if one fails
3. Claude inline — **ONLY if BOTH CLI calls fail**, and you MUST log the failure reason

### Role Prompt (prepend to every prompt)

**For Gemini (doc-generator):**

> You generate comprehensive CLAUDE.md documentation for code modules. Start with `# {module_name}`. Use tables for file listings and API surfaces. Include file path references (`path:line`). Keep descriptions concise. Do not invent APIs or features not in the source code.

**For Codex (doc-generator):**

> You generate CLAUDE.md documentation focusing on implementation details and code structure. Start with `# {module_name}`. Use tables. Include file path references. Emphasize code patterns, error handling, data flow, test coverage, and build config. Do not invent information.

**For Codex (auditor):**

> You audit CLAUDE.md documentation for quality and completeness. Check: every exported symbol documented, every file listed, dependencies accurate, no invented information. Output JSON with findings array.

### FORBIDDEN Anti-Patterns

| ❌ Forbidden                                            | ✅ Required Instead                                     |
| ------------------------------------------------------- | ------------------------------------------------------- |
| Spawning `general-purpose` agents to update CLAUDE.md   | Call `gemini`/`codex` CLI directly via Bash              |
| Batching modules into generic agents for inline gen     | Process per module through direct CLI calls              |
| Generating CLAUDE.md content without external model call | ALWAYS call `gemini` or `codex` CLI first               |
| Using `Skill()` nesting to invoke gemini-cli/codex-cli  | Use `Bash("gemini -p ...")` directly                    |

## Architecture

```
module-discovery → modules.json
    ↓
For each layer (3→2→1):
    ├─ Bash: gemini -p "..." ─┐ PARALLEL
    └─ Bash: codex exec "..." ─┘
    → Claude merges best output
    → Write CLAUDE.md
    ↓
Bash: codex exec "<audit prompt>" → quality review
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
     d. Write prompt to `${run_dir}/prompts/${module_name}.md` via Write tool.
     e. Call both CLIs in parallel Bash calls:
        - `Bash("gemini -p \"$(cat ${run_dir}/prompts/${module_name}.md)\" --approval-mode plan -o text")`
        - `Bash("codex exec \"$(cat ${run_dir}/prompts/${module_name}.md)\" -s read-only")`
     e. Merge outputs: take the more complete version, supplement with unique details from the other.
     f. Write merged content to `${run_dir}/merged-docs-{module_name}.md`.

### Phase 3: Writing

5. If not `dry_run`, write each `{module}/CLAUDE.md` from merged content.
6. If `dry_run`, write preview to `${run_dir}/preview/` instead.

### Phase 4: Quality Audit

7. Write audit prompt to `${run_dir}/prompts/audit.md` and call `Bash("codex exec \"$(cat ${run_dir}/prompts/audit.md)\" -s read-only")` to review all generated CLAUDE.md files.
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
