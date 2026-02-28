---
name: doc-related-generator
description: |
  Generate CLAUDE.md for changed modules and their dependents only.
  [Trigger] After changes when affected modules lack CLAUDE.md.
  [Output] {module}/CLAUDE.md for changed modules + ${run_dir}/related-generation-summary.md
  [Skip] When all changed modules already have up-to-date CLAUDE.md.
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
    description: Output directory for generation artifacts
  - name: base_ref
    type: string
    required: false
    description: "Git ref to diff against (default: HEAD~1)"
---

# doc-related-generator

## Purpose

Generate CLAUDE.md files only for modules affected by recent changes and their dependents. Faster alternative to doc-full-generator when most modules already have documentation.

## Critical Constraint: External Model Required

**You MUST call `gemini` or `codex` CLI directly via Bash for ALL CLAUDE.md content generation.** Do NOT generate content inline or spawn generic agents — your role is to prepare prompts and call external model CLIs.

### Direct CLI Invocation (Mandatory)

**Gemini (primary):**

```bash
gemini -p "$(cat ${run_dir}/prompts/${module_name}.md)" --approval-mode plan -o text
```

**Codex (fallback):**

```bash
codex exec "$(cat ${run_dir}/prompts/${module_name}.md)" -s read-only
```

Fallback chain (strict order):

1. `gemini` CLI via Bash — primary
2. `codex` CLI via Bash — if gemini fails (non-zero exit)
3. Claude inline — **ONLY if BOTH CLI calls fail**, and you MUST log the failure reason

### Role Prompt (prepend to every prompt)

> You generate comprehensive CLAUDE.md documentation for code modules. Start with `# {module_name}`. Use tables for file listings and API surfaces. Include file path references (`path:line`). Keep descriptions concise. Do not invent APIs or features not in the source code.

### FORBIDDEN Anti-Patterns

| ❌ Forbidden                                            | ✅ Required Instead                                     |
| ------------------------------------------------------- | ------------------------------------------------------- |
| Spawning `general-purpose` agents to generate CLAUDE.md | Call `gemini`/`codex` CLI directly via Bash              |
| Batching modules into generic agents for inline gen     | Process per module through direct CLI calls              |
| Generating CLAUDE.md content without external model call | ALWAYS call `gemini` or `codex` CLI first               |
| Using `Skill()` nesting to invoke gemini-cli/codex-cli  | Use `Bash("gemini -p ...")` directly                    |

## Steps

### Phase 1: Change Detection

1. Call `Skill("context-memory:change-detector", {run_dir, base_ref})`.
2. Read `${run_dir}/changed-modules.json`.
3. If no changes, report "no modules to generate for" and exit.

### Phase 2: Filter and Prioritize

4. From changed + impacted modules, filter to those missing CLAUDE.md or with stale docs.
5. Sort by layer (3→2→1) for generation order.
6. If a changed module already has up-to-date CLAUDE.md, skip generation (recommend incremental update instead).

### Phase 3: Targeted Generation

7. For each module needing generation:
   a. Use `mcp__auggie-mcp__codebase-retrieval` for module context.
   b. Read module files and structure.
   c. Write prompt to `${run_dir}/prompts/${module_name}.md` via Write tool.
   d. Call Gemini CLI: `Bash("gemini -p \"$(cat ${run_dir}/prompts/${module_name}.md)\" --approval-mode plan -o text")`.
   e. If gemini fails, call Codex CLI: `Bash("codex exec \"$(cat ${run_dir}/prompts/${module_name}.md)\" -s read-only")`.
   d. Write to `${run_dir}/generated-{module_name}.md`.

### Phase 4: Writing

8. Write CLAUDE.md files for generated modules.
9. Write `${run_dir}/related-generation-summary.md`:
   - Modules generated
   - Modules skipped (already up-to-date)
   - Modules recommended for incremental update

## Verification

- Every changed module without CLAUDE.md has one generated.
- Stale modules are flagged for update or regenerated.
- Summary accurately reflects what was generated vs skipped.
