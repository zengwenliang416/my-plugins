---
name: doc-full-generator
description: |
  Generate CLAUDE.md for all modules using 3-layer architecture and multi-model analysis.
  [Trigger] New project without CLAUDE.md or major restructuring requiring fresh docs.
  [Output] {module}/CLAUDE.md for every module + ${run_dir}/generation-summary.md
  [Skip] When most modules already have CLAUDE.md (use doc-full-updater instead).
  [Ask] Template style (minimal, standard, detailed) if not specified.
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
    description: Output directory for generation artifacts
  - name: modules_json
    type: string
    required: false
    description: Path to existing modules.json (skip module-discovery if provided)
  - name: template
    type: string
    required: false
    description: "CLAUDE.md template style: minimal, standard, detailed (default: standard)"
---

# doc-full-generator

## Purpose

Generate CLAUDE.md files for all project modules from scratch. Uses the 3-layer architecture pattern (leaf→middle→top) with multi-model analysis.

## Critical Constraint: External Model Required

**You MUST call `gemini` or `codex` CLI directly via Bash for ALL CLAUDE.md content generation.** Do NOT generate content inline or spawn generic agents — your role is to prepare prompts and call external model CLIs.

### Direct CLI Invocation (Mandatory)

For each module, write the full prompt to a file, then call the CLI:

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

**For Gemini:**

> You generate comprehensive CLAUDE.md documentation for code modules. Start with `# {module_name}`. Use tables for file listings and API surfaces. Include file path references (`path:line`). Keep descriptions concise — one sentence per item. Do not invent APIs or features not in the source code. Every exported symbol and every file must be documented.

**For Codex:**

> You generate CLAUDE.md documentation focusing on implementation details and code structure. Start with `# {module_name}`. Use tables. Include file path references. Emphasize code patterns, error handling, data flow, test coverage, and build config. Do not invent information.

### FORBIDDEN Anti-Patterns

| ❌ Forbidden                                            | ✅ Required Instead                                     |
| ------------------------------------------------------- | ------------------------------------------------------- |
| Spawning `general-purpose` agents to generate CLAUDE.md | Call `gemini`/`codex` CLI directly via Bash              |
| Batching modules into generic agents for inline gen     | Process per module through direct CLI calls              |
| Generating CLAUDE.md content without external model call | ALWAYS call `gemini` or `codex` CLI first               |
| Using `Skill()` nesting to invoke gemini-cli/codex-cli  | Use `Bash("gemini -p ...")` directly                    |

## CLAUDE.md Template (standard)

Each generated CLAUDE.md should contain:

```markdown
# {Module Name}

## Overview

[What this module does, in 1-2 sentences]

## Key Files

| File      | Purpose        |
| --------- | -------------- |
| `file.ts` | [What it does] |

## Conventions

- [Naming patterns, import conventions, etc.]

## Dependencies

- [What this module depends on and why]

## Testing

- [Test patterns, how to run tests]
```

## Steps

### Phase 1: Module Discovery

1. If `modules_json` provided, read it. Otherwise call `Skill("context-memory:module-discovery", {run_dir})`.

### Phase 2: Layer-Ordered Generation

2. Process layers in order: 3 → 2 → 1.
3. For each module in current layer:
   a. Use `mcp__auggie-mcp__codebase-retrieval` to understand module contents.
   b. Read key files (entry points, exports, config).
   c. Build generation prompt including role prompt (see above) + module file structure + key file contents (summarized) + lower-layer CLAUDE.md files (for cross-references) + template structure.
   d. Write prompt to `${run_dir}/prompts/${module_name}.md` via Write tool.
   e. Call Gemini CLI directly: `Bash("gemini -p \"$(cat ${run_dir}/prompts/${module_name}.md)\" --approval-mode plan -o text")`.
   f. If gemini fails (non-zero exit), call Codex CLI: `Bash("codex exec \"$(cat ${run_dir}/prompts/${module_name}.md)\" -s read-only")`.
   g. If both fail, generate inline (last resort) and log failure reason.
   h. Write result to `${run_dir}/generated-{module_name}.md`.
   **Parallelism:** Multiple modules in the same layer MAY be processed in parallel Bash calls.

### Phase 3: Cross-Reference Pass

4. After all modules generated, scan for cross-module references.
5. Update "Dependencies" sections to include accurate links.

### Phase 4: Writing

6. Write each `{module}/CLAUDE.md` from generated content.
7. Write `${run_dir}/generation-summary.md` with stats.

## Verification

- Every module in `modules.json` has a corresponding CLAUDE.md.
- Each CLAUDE.md has all template sections (Overview, Key Files, Conventions).
- Cross-references point to existing modules.
