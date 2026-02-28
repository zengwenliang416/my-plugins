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

**You MUST use `Skill("context-memory:gemini-cli", ...)` or `Skill("context-memory:codex-cli", ...)` for ALL CLAUDE.md content generation.** Do NOT generate CLAUDE.md content inline — your role is to prepare prompts and route to external models.

Fallback chain (strict order):

1. `Skill("context-memory:gemini-cli", {role: "doc-generator", ...})` — primary
2. `Skill("context-memory:codex-cli", {role: "doc-generator", ...})` — if gemini fails
3. Claude inline — **ONLY if BOTH external models fail**, and you MUST log the failure reason

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
   c. Build generation prompt including:
   - Module file structure
   - Key file contents (summarized)
   - Lower-layer CLAUDE.md files (for cross-references)
   - Template structure
     d. Call `Skill("context-memory:gemini-cli", {role: "doc-generator", prompt: <generation_prompt>, run_dir, session_id})` as primary generator.
     e. If gemini fails, fall back to `Skill("context-memory:codex-cli", {role: "doc-generator", prompt: <generation_prompt>, run_dir, session_id})`.
     f. Write result to `${run_dir}/generated-{module_name}.md`.

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
