---
name: context-loader
description: |
  Load project context for a task using semantic retrieval and module scanning.
  [Trigger] Starting a new task that needs project knowledge (modules, conventions, history).
  [Output] context.json or .claude/memory/sessions/{timestamp}.json with relevant context.
  [Skip] When fresh session context already exists (< 1 hour old).
  [Ask] Desired depth level (minimal, standard, deep) if not specified.
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: task
    type: string
    required: true
    description: Task description to load context for
  - name: run_dir
    type: string
    required: false
    description: Output directory (defaults to .claude/memory/sessions/)
  - name: depth
    type: string
    required: false
    description: "Context depth: minimal, standard, deep (default: standard)"
---

# context-loader

## Purpose

Load relevant project context for a given task. Combines semantic retrieval, module scanning, and existing documentation to build a comprehensive context snapshot.

## Progressive Loading Levels

| Level | Depth      | What's Loaded                                          | Use Case                                  |
| ----- | ---------- | ------------------------------------------------------ | ----------------------------------------- |
| 1     | `minimal`  | CLAUDE.md files + task-relevant codebase retrieval     | Quick context for small tasks             |
| 2     | `standard` | Level 1 + module structure + recent git history        | Default for most tasks                    |
| 3     | `deep`     | Level 2 + dependency graph + style memory + tech rules | Complex refactoring or architecture tasks |

## Steps

### Phase 1: Existing Context Check

1. Check for existing session at `.claude/memory/sessions/` matching the task description.
2. If fresh session exists (< 1 hour old), load and return it (skip re-scan).
3. Read project-level `CLAUDE.md` if it exists.

### Phase 2: Semantic Retrieval

4. Use `mcp__auggie-mcp__codebase-retrieval` with the task description as query.
5. Collect relevant code snippets, file paths, and module references.

### Phase 3: Module Context (standard+)

6. If `depth` >= `standard`:
   - Read existing `modules.json` from recent runs, or scan top-level directories.
   - Identify modules most relevant to the task based on semantic retrieval results.
   - Read `CLAUDE.md` for each relevant module.

### Phase 4: Extended Context (deep)

7. If `depth` == `deep`:
   - Read `.claude/memory/rules/` for tech stack rules.
   - Read `.claude/memory/styles/` for style patterns.
   - Read recent git log (last 20 commits) for change patterns.
   - Map dependency graph for relevant modules.

### Phase 5: Output

8. Write context snapshot to `${run_dir}/context.json` or `.claude/memory/sessions/{timestamp}.json`:

```json
{
  "task": "implement user authentication",
  "depth": "standard",
  "timestamp": "ISO-8601",
  "project_claude_md": "summary of project CLAUDE.md",
  "relevant_modules": [
    { "path": "src/auth", "relevance": "high", "claude_md": "..." }
  ],
  "code_snippets": [
    {
      "file": "src/auth/middleware.ts",
      "lines": "10-25",
      "relevance": "direct"
    }
  ],
  "tech_rules": [],
  "preferences": {}
}
```

## Auto-Save Behavior

- On successful load, save user's task description and context preferences.
- Next time a similar task is requested, suggest loading the saved context.

## Verification

- Context JSON is valid and contains at least `task` and `relevant_modules`.
- Semantic retrieval returned results (warn if empty).
- Module CLAUDE.md files loaded for `standard` and `deep` depths.
