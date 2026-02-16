---
name: doc-planner
description: |
  Plan documentation scope, group modules, and recommend generation strategy.
  [Trigger] Before running doc-full-generator or doc-full-updater to understand scope.
  [Output] ${run_dir}/doc-plan.json with modules, actions, priorities, and processing order.
  [Skip] When user already knows exactly which modules to document.
  [Ask] Desired scope (full, changed, or specific module path).
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Output directory for plan artifacts
  - name: scope
    type: string
    required: false
    description: "full, changed, or module:<path> (default: full)"
---

# doc-planner

## Purpose

Analyze the project and create a documentation plan: which modules need CLAUDE.md, what content each should contain, and the recommended generation order.

## Steps

### Phase 1: Project Analysis

1. Call `Skill("context-memory:module-discovery", {run_dir})` to get `modules.json`.
2. Scan for existing CLAUDE.md files using `Glob("**/CLAUDE.md")`.
3. Compare: identify modules missing CLAUDE.md, modules with stale CLAUDE.md.

### Phase 2: Staleness Detection

4. For each existing CLAUDE.md:
   - Get CLAUDE.md last-modified time.
   - Get most recent source file modification time in the module.
   - If source is newer than CLAUDE.md, mark as `stale`.
   - If source has significant changes (>5 files changed), mark as `needs-regeneration`.

### Phase 3: Scope Filtering

5. Apply scope filter:
   - `full`: All modules.
   - `changed`: Only modules with stale or missing CLAUDE.md.
   - `module:<path>`: Single specific module.

### Phase 4: Plan Generation

6. Write `${run_dir}/doc-plan.json`:

```json
{
  "scope": "full",
  "modules": [
    {
      "path": "src/auth",
      "status": "missing",
      "action": "generate",
      "strategy": "multi-model",
      "priority": "high",
      "layer": 3
    },
    {
      "path": "src/pages",
      "status": "stale",
      "action": "update",
      "strategy": "incremental",
      "priority": "medium",
      "layer": 1
    }
  ],
  "processing_order": ["src/utils", "src/auth", "src/services", "src/pages"],
  "estimated_modules": 12,
  "recommended_command": "claude-update full"
}
```

### Phase 5: User Summary

7. Present plan summary:
   - Total modules to process
   - Missing vs stale vs up-to-date counts
   - Recommended action (`claude-generate full` vs `claude-update related`)
   - Estimated processing order (layer 3 → 2 → 1)

## Verification

- `doc-plan.json` exists with valid module entries.
- Processing order respects layer dependencies (3 before 2 before 1).
- Each module has a clear `action` and `strategy`.
