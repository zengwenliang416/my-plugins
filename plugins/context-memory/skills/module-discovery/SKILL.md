---
name: module-discovery
description: |
  Scan project tree, classify modules into layers, and group by architectural depth.
  [Trigger] Any doc-generation or skill-indexing workflow needs module inventory.
  [Output] ${run_dir}/modules.json with layers (3→2→1), types, and file counts.
  [Skip] When modules.json already exists and is fresh (< 1 hour old).
  [Ask] Whether to exclude specific directories from scanning.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Output directory for modules.json
  - name: project_root
    type: string
    required: false
    description: Project root path (defaults to cwd)
  - name: exclude_patterns
    type: string
    required: false
    description: Comma-separated glob patterns to exclude (e.g., "node_modules,dist,build")
---

# module-discovery

## Purpose

Scan a project tree to discover modules, classify them by type and architectural layer, and output a structured `modules.json` for downstream skills.

## Layer Classification

| Layer | Description                       | Examples                         | Dependency Direction      |
| ----- | --------------------------------- | -------------------------------- | ------------------------- |
| 3     | Leaf modules, no internal deps    | utils, helpers, constants, types | None (imported by others) |
| 2     | Middle modules, depend on layer 3 | services, components, middleware | Imports from layer 3      |
| 1     | Top modules, depend on layer 2    | pages, routes, entry points, CLI | Imports from layer 2-3    |

## Module Type Detection

| Type        | Indicators                                                               |
| ----------- | ------------------------------------------------------------------------ |
| `utility`   | Pure functions, no side effects, files like `utils/`, `helpers/`, `lib/` |
| `service`   | Business logic, external calls, files like `services/`, `api/`           |
| `component` | UI components, files like `components/`, `widgets/`                      |
| `page`      | Route handlers, entry points, files like `pages/`, `routes/`, `app/`     |
| `config`    | Configuration, files like `config/`, `settings/`, `.env` templates       |
| `test`      | Test files, `__tests__/`, `*.test.*`, `*.spec.*`                         |
| `plugin`    | Plugin definitions, files matching `plugins/*/`                          |

## Steps

### Phase 1: Discovery

1. Use `mcp__auggie-mcp__codebase-retrieval` with query: "List all top-level modules, packages, and significant directories in this project".
2. Supplement with `Glob` to find `package.json`, `CLAUDE.md`, `index.*` files as module indicators.
3. Exclude patterns from `exclude_patterns` (default: `node_modules,dist,build,.git,coverage`).

### Phase 2: Classification

4. For each discovered module:
   - Detect type based on path patterns and file contents.
   - Scan import/require statements to determine dependencies on other modules.
   - Assign layer based on dependency depth (leaf=3, middle=2, top=1).

### Phase 3: Output

5. Write `${run_dir}/modules.json`:

```json
{
  "project_root": "/path/to/project",
  "layers": {
    "3": [
      {
        "path": "src/utils",
        "type": "utility",
        "files": 12,
        "exports": ["formatDate", "parseConfig"]
      }
    ],
    "2": [
      {
        "path": "src/services",
        "type": "service",
        "files": 8,
        "deps": ["src/utils"]
      }
    ],
    "1": [
      {
        "path": "src/pages",
        "type": "page",
        "files": 5,
        "deps": ["src/services", "src/utils"]
      }
    ]
  },
  "total_modules": 25,
  "total_files": 150,
  "scan_timestamp": "ISO-8601"
}
```

## Error Handling

- If codebase-retrieval returns empty, fall back to `Glob("**/{package.json,index.*,CLAUDE.md}")`.
- If no modules detected, write empty `modules.json` with `total_modules: 0` and log warning.

## Verification

- `modules.json` exists and is valid JSON.
- Every module has `path`, `type`, `files`, and layer assignment.
- Layers are consistent: no layer-3 module depends on layer-1 or layer-2.
