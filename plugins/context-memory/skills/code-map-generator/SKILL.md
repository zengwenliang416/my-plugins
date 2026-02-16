---
name: code-map-generator
description: |
  Generate code maps with Mermaid diagrams showing module relationships and data flow.
  [Trigger] Architecture review, onboarding, or understanding module coupling.
  [Output] ${run_dir}/code-map-{type}.md (Mermaid) + ${run_dir}/code-map.json
  [Skip] When recent code map exists and project structure hasn't changed.
  [Ask] Scope (full, specific module, or layer) and format (mermaid, json, both).
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
    description: Output directory for code map artifacts
  - name: scope
    type: string
    required: false
    description: "full, module:<path>, or layer:<1|2|3> (default: full)"
  - name: format
    type: string
    required: false
    description: "mermaid, json, or both (default: both)"
---

# code-map-generator

## Purpose

Generate visual code maps showing module relationships, dependency flows, and architectural layers using Mermaid diagrams.

## Diagram Types

| Type         | Content                            | Use Case                        |
| ------------ | ---------------------------------- | ------------------------------- |
| `dependency` | Module import/export relationships | Understanding coupling          |
| `data-flow`  | How data moves between modules     | API and service design          |
| `layer`      | Architectural layer visualization  | Onboarding, architecture review |

## Steps

### Phase 1: Module Discovery

1. Call `Skill("context-memory:module-discovery", {run_dir})` to get `modules.json`.
2. Apply scope filter if specified.

### Phase 2: Dependency Analysis

3. Use `Skill("context-memory:codex-cli", {role: "analyzer", prompt})` to analyze:
   - Import graphs between modules
   - Data flow patterns (which module produces vs consumes)
   - Circular dependency detection
4. Build adjacency list from analysis.

### Phase 3: Mermaid Generation

5. Generate Mermaid diagrams:

**Dependency diagram:**

```mermaid
graph TD
    subgraph Layer 1
        pages[Pages]
    end
    subgraph Layer 2
        services[Services]
        components[Components]
    end
    subgraph Layer 3
        utils[Utils]
        types[Types]
    end
    pages --> services
    pages --> components
    services --> utils
    components --> utils
    services --> types
```

**Data flow diagram:**

```mermaid
flowchart LR
    API[API Routes] --> Services
    Services --> DB[Database]
    Services --> Cache
    Services --> External[External APIs]
```

### Phase 4: Output

6. Write Mermaid files to `${run_dir}/code-map-{type}.md`.
7. Write JSON graph to `${run_dir}/code-map.json` if format includes json.
8. Write summary to `${run_dir}/code-map-summary.md`:
   - Module count per layer
   - Top connected modules (most imports/exports)
   - Circular dependencies (if any)

## Verification

- Mermaid diagrams render without syntax errors.
- Every module from modules.json appears in at least one diagram.
- Circular dependencies are flagged in summary.
