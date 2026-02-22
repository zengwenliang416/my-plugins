---
description: "Generate structured PRD from design screenshots and/or user descriptions"
argument-hint: "[screenshot_paths...] [--description <text_or_file>] [--output <dir>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
  - Task
---

# /gen-prd — Generate PRD

Generate a structured PRD from design screenshots, user descriptions, or both. The generated PRD can then be used as input for `/p2c` or `/d2c-full`.

## Arguments

- `screenshot_paths`: One or more paths to design screenshot images (optional if --description provided)
- `--description`: Natural language description of requirements — inline text or path to a file (optional if screenshots provided)
- `--output`: Output directory (default: `./gen-prd-output/`)

At least one source (screenshots or description) MUST be provided.

## Execution Flow

### Phase 0: Init

1. Parse arguments
2. Determine generation mode:
   - Screenshots only → `design-only` mode
   - Description only → `description-only` mode
   - Both → `merged` mode
3. Create run directory
4. Write `${RUN_DIR}/input.md`

### Phase 1: PRD Generation

1. Spawn `prd-generator` agent via Task tool:
   ```
   Task(subagent_type="d2c:prd-generator")
   ```
   - Pass screenshots and/or description
   - Agent outputs `${RUN_DIR}/generated-prd.md`

### Phase 2: User Review [Hard Stop]

1. Present generated PRD summary:
   - Module count
   - Requirement count per module
   - Confidence distribution (HIGH / MEDIUM / LOW)
   - Listed gaps and assumptions
2. Present suggested questions (from agent output)
3. User can:
   - **Accept**: PRD is ready for `/p2c`
   - **Edit**: User modifies the generated PRD file directly, then confirms
   - **Regenerate**: Provide additional description to fill gaps, re-run Phase 1

### Phase 3: Delivery

1. Final `${RUN_DIR}/generated-prd.md` is ready
2. Display usage hint:
   ```
   To generate logic code from this PRD:
     /p2c ${RUN_DIR}/generated-prd.md --project <your-project-path>

   Or run the full pipeline:
     /d2c-full <screenshots> --prd ${RUN_DIR}/generated-prd.md --project <your-project-path>
   ```
