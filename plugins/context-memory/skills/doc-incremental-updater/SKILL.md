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

**You MUST call `gemini` and/or `codex` CLI directly via Bash for CLAUDE.md content generation.** Do NOT generate content inline or spawn generic agents (except for `config` change type which permits inline updates).

### Direct CLI Invocation (Mandatory)

**For `api` changes (both in parallel):**

```bash
gemini -p "$(cat ${run_dir}/prompts/${module_name}.md)" --approval-mode plan -o text
codex exec "$(cat ${run_dir}/prompts/${module_name}.md)" -s read-only
```

**For `internal` changes (codex only, faster):**

```bash
codex exec "$(cat ${run_dir}/prompts/${module_name}.md)" -s read-only
```

Fallback chain (strict order):

1. Both `gemini` + `codex` CLI in parallel — for `api` changes
2. `codex` CLI only — for `internal` changes (faster)
3. Claude inline — **ONLY for `config` changes**, or if BOTH CLI calls fail (log failure reason)

### Role Prompt (prepend to every prompt)

> You update CLAUDE.md documentation based on code changes. Preserve existing structure and sections. Only modify sections affected by the diff. Start with `# {module_name}`. Use tables. Include file path references. Do not invent information.

### FORBIDDEN Anti-Patterns

| ❌ Forbidden                                            | ✅ Required Instead                                     |
| ------------------------------------------------------- | ------------------------------------------------------- |
| Spawning `general-purpose` agents to update CLAUDE.md   | Call `gemini`/`codex` CLI directly via Bash              |
| Batching modules into generic agents for inline gen     | Process per module through direct CLI calls              |
| Using Claude inline for `api`/`internal` change types   | ALWAYS call external model CLIs for non-config changes   |
| Using `Skill()` nesting to invoke gemini-cli/codex-cli  | Use `Bash("gemini -p ...")` directly                    |

## Architecture

```
change-detector → changed-modules.json
    ↓
For each changed/impacted module:
    ├─ Bash: gemini -p "..." ─┐ PARALLEL (api changes)
    └─ Bash: codex exec "..." ─┘
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
     d. Write prompt to `${run_dir}/prompts/${module_name}.md` via Write tool.
     e. For `api` changes: call both CLIs in parallel Bash calls:
        - `Bash("gemini -p \"$(cat ${run_dir}/prompts/${module_name}.md)\" --approval-mode plan -o text")`
        - `Bash("codex exec \"$(cat ${run_dir}/prompts/${module_name}.md)\" -s read-only")`
     f. For `internal` changes: call Codex only:
        - `Bash("codex exec \"$(cat ${run_dir}/prompts/${module_name}.md)\" -s read-only")`
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
