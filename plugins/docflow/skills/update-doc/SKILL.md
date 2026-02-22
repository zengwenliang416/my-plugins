---
name: update-doc
description: |
  [Trigger] User requests doc sync, or llmdoc needs updating after code changes.
  [Output] Updated document list for affected docs + index sync result.
  [Skip] When there are no code/requirement changes and docs are already current.
  [Ask] Change scope, target module, and whether incremental update is allowed.
context: fork
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
  - Task
---

# /update-doc

This skill updates the project's llmdoc documentation to reflect recent code changes.

## Pre-fetched Context

- **Llmdoc structure:** !`find llmdoc -name "*.md" 2>/dev/null | head -50`
- **Recent changes (3 commits):** !`git diff HEAD~3..HEAD --stat 2>/dev/null | head -30`
- **Affected files:** !`git diff HEAD~3..HEAD --name-only 2>/dev/null | head -30`
- **Llmdoc index:** !`cat llmdoc/index.md 2>/dev/null | head -50`

## Actions

1. **Step 1: Analyze Changes**
   - If `$ARGUMENTS` is provided, use it as the description of what changed.
   - Otherwise, analyze the pre-fetched git diff to understand what changed.

2. **Step 2: Identify Impacted Concepts**
   - Map changed files to llmdoc concepts:
     - Config files (`.eslintrc`, etc.) → `reference/coding-conventions.md`
     - Auth files → relevant architecture docs
     - New features → may need new docs
   - Create a list of impacted documents.

3. **Step 3: Update Documents**
   - For each impacted document, use `recorder` agent with this prompt:
     ```
     Task: Update documentation for <concept_name>.
     Changes: <relevant git diff summary>
     Mode: content-only
     Principle: Use fewest words necessary.
     ```

4. **Step 4: Synchronize Index**
   - After all updates complete, invoke a single `recorder` agent to:
     - Re-scan `/llmdoc` directory
     - Ensure `index.md` is consistent and up-to-date
     - Mode: full

5. **Step 5: Report**
   - Summarize all documents created/updated/deleted.

## Update Principles

- **Minimality**: Use fewest words necessary
- **Accuracy**: Based on actual code, not assumptions
- **No Code Blocks**: Reference with `path/file.ext:line` format
- **LLM-Friendly**: Write for machine consumption
