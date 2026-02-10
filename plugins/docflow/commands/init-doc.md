---
description: "Initialize llmdoc using scout + recorder collaboration"
argument-hint: ""
allowed-tools: [Task, AskUserQuestion, Read, Glob, Grep, Bash, Write, Edit]
---

# /init-doc

Initialize `llmdoc/` for a new project with a documentation-first workflow.

## Actions

0. **Step 0: Baseline scan**
   - Read project structure and key files (`README`, `package.json`, `go.mod`, `pyproject.toml`, etc.).
   - Exclude dependency/build folders (`node_modules`, `venv`, `target`, `build`).

1. **Step 1: Global investigation (scout)**
   - Launch up to 4 `scout` agents to investigate the codebase.
   - `scout` must run in foreground mode (no background polling).

2. **Step 2: Candidate concept selection**
   - Read all scout reports.
   - Synthesize candidate core concepts (for example: Authentication, Billing, API Gateway).
   - Use `AskUserQuestion` to let user choose which concepts to document first.

3. **Step 3: Foundational docs (parallel recorder)**
   - Recorder A: `overview/project-overview.md`
   - Recorder B: `reference/coding-conventions.md`
   - Recorder C: `reference/git-conventions.md`
   - All in `content-only` mode.

4. **Step 4: Concept docs (parallel recorder)**
   - For each selected concept, invoke one recorder with scoped prompt.
   - Generate a compact document set:
     - Optional 1 `overview` file
     - Required 1-2 core `architecture` files
     - Required 1-2 practical `guides` files
     - Optional 1-2 concise `reference` files
   - Keep `content-only` mode.

5. **Step 5: Cleanup**
   - Delete temporary scout reports under `llmdoc/agent/`.

6. **Step 6: Final indexing**
   - Invoke a single recorder in `full` mode to regenerate `llmdoc/index.md`.
