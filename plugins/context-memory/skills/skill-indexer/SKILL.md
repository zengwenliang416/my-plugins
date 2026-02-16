---
name: skill-indexer
description: |
  Index project modules and package them as SKILL definitions for .claude/skills/.
  [Trigger] User wants to create SKILL packages from project modules for reuse.
  [Output] .claude/skills/{module}/SKILL.md + ${run_dir}/skill-index.json
  [Skip] When target modules already have up-to-date SKILL packages.
  [Ask] Which modules to index if not specified (default: all).
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
    description: Output directory for indexing artifacts
  - name: target_modules
    type: string
    required: false
    description: Comma-separated module paths to index (default: all modules)
---

# skill-indexer

## Purpose

Analyze project modules and create SKILL package definitions suitable for `.claude/skills/`. Each SKILL package captures a module's API surface, conventions, and usage patterns.

## SKILL Package Structure

```
.claude/skills/{module-name}/
├── SKILL.md        # Module overview, API surface, usage examples
└── (no other files unless genuinely needed)
```

## Steps

### Phase 1: Module Discovery

1. Call `Skill("context-memory:module-discovery", {run_dir})` to get `modules.json`.
2. If `target_modules` specified, filter to only those modules.

### Phase 2: Module Analysis

3. For each module:
   a. Use `mcp__auggie-mcp__codebase-retrieval` to understand the module's purpose and API.
   b. Extract:
   - Exported functions/classes/types
   - Key configuration options
   - Common usage patterns
   - Dependencies on other modules
     c. Read existing CLAUDE.md for the module (if exists) for additional context.

### Phase 3: SKILL Generation

4. For each analyzed module, generate a SKILL.md:

```markdown
---
name: { module-name }
description: "{one-line purpose}"
---

# {module-name}

## API Surface

| Export         | Type     | Description  |
| -------------- | -------- | ------------ |
| `functionName` | function | What it does |

## Usage Patterns

[Common usage examples from the codebase]

## Configuration

[Key config options if applicable]

## Integration Notes

[How this module connects to others]
```

### Phase 4: Writing

5. Write SKILL packages to `.claude/skills/{module-name}/SKILL.md`.
6. Write index to `${run_dir}/skill-index.json`:

```json
{
  "skills": [
    { "name": "auth", "path": ".claude/skills/auth/SKILL.md", "exports": 12 }
  ],
  "total": 5
}
```

## Verification

- Each indexed module has a SKILL.md with API surface table.
- Skill index JSON is valid with accurate module count.
- No empty SKILL.md files (each has substantive content).
