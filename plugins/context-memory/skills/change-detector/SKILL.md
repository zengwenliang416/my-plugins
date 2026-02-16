---
name: change-detector
description: |
  Detect changed files via git diff, map to modules, and propagate impact.
  [Trigger] Incremental doc update or related-generator needs affected module list.
  [Output] ${run_dir}/changed-modules.json with changed + impacted modules.
  [Skip] When doing full regeneration (use module-discovery instead).
  [Ask] Which base_ref to diff against if not HEAD~1.
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Glob
arguments:
  - name: run_dir
    type: string
    required: true
    description: Output directory for changed-modules.json
  - name: base_ref
    type: string
    required: false
    description: "Git ref to diff against (default: HEAD~1)"
  - name: modules_json
    type: string
    required: false
    description: Path to existing modules.json for module mapping
---

# change-detector

## Purpose

Analyze git changes to identify affected modules and propagate impact to dependent modules.

## Steps

### Phase 1: Git Diff

1. Run `git diff --name-only ${base_ref:-HEAD~1}..HEAD` to get changed file list.
2. If no changes detected, also check `git diff --name-only --cached` for staged changes.
3. Filter out non-source files (images, lock files, generated files).

### Phase 2: Module Mapping

4. Map each changed file to its parent module:
   - If `modules_json` provided, use it for mapping.
   - Otherwise, infer module from directory structure (first 2 levels of path).
5. Classify change type per module:
   - `api`: Changes to exported interfaces, public functions
   - `internal`: Changes to private implementation
   - `config`: Changes to configuration files
   - `test`: Changes to test files only

### Phase 3: Impact Propagation

6. For each directly changed module with `api` changes:
   - Use `Grep` to find files that import from the changed module.
   - Map importing files to their parent modules.
   - Add as `impacted` with reason.
7. De-duplicate: if a module is both directly changed and impacted, keep as `changed`.

### Phase 4: Output

8. Write `${run_dir}/changed-modules.json`:

```json
{
  "base_ref": "HEAD~1",
  "head_ref": "HEAD",
  "changed": [
    {
      "path": "src/auth",
      "files_changed": 3,
      "change_type": "api",
      "reason": "direct"
    }
  ],
  "impacted": [
    {
      "path": "src/pages/login",
      "files_changed": 0,
      "change_type": "none",
      "reason": "imports src/auth"
    }
  ],
  "summary": {
    "total_changed": 1,
    "total_impacted": 1,
    "change_types": { "api": 1 }
  }
}
```

## Error Handling

- If not in a git repository, write error JSON and exit: `{"error": "not a git repo"}`.
- If `base_ref` is invalid, fall back to `HEAD~1`, then to comparing against empty tree.

## Verification

- `changed-modules.json` exists and is valid JSON.
- Every `changed` entry has `path`, `files_changed`, `change_type`, `reason`.
- Impact propagation only includes modules with actual import dependencies.
