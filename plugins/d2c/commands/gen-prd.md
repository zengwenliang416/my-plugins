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
- `--output`: Output directory override (default: `openspec/changes/gen-prd-${slug}/`)

At least one source (screenshots or description) MUST be provided.

## Execution Flow

### Phase 0: Init

1. Parse arguments
2. Determine generation mode:
   - Screenshots only → `design-only` mode
   - Description only → `description-only` mode
   - Both → `merged` mode
3. Derive `CHANGE_ID` = `gen-prd-${slug}` where `slug` is a kebab-case identifier from the description topic or first screenshot filename (e.g., `gen-prd-onboarding`, `gen-prd-admin-panel`)
4. Set `RUN_DIR`:
   - If `--output` specified: use that path as `RUN_DIR`
   - Otherwise: `openspec/changes/${CHANGE_ID}/`
5. Create `${RUN_DIR}/` directory
6. Scaffold OpenSpec artifacts:
   - `${RUN_DIR}/proposal.md` — auto-generated change proposal:

     ```markdown
     # Change: Gen-PRD — ${slug}

     ## Why

     Generate structured PRD from design screenshots and/or descriptions.

     ## What Changes

     - New generated-prd.md artifact

     ## Impact

     - Affected specs: none (new artifacts only)
     ```

   - `${RUN_DIR}/tasks.md` — phase checklist:

     ```markdown
     ## 1. Init

     - [ ] 1.1 Parse arguments and validate inputs
     - [ ] 1.2 Scaffold OpenSpec change directory

     ## 2. PRD Generation

     - [ ] 2.1 Run prd-generator agent

     ## 3. User Review

     - [ ] 3.1 Present PRD summary and gaps
     - [ ] 3.2 User accepts, edits, or regenerates

     ## 4. Delivery

     - [ ] 4.1 Finalize generated-prd.md
     - [ ] 4.2 Display usage hints for /p2c or /d2c-full
     ```

7. Write `${RUN_DIR}/input.md`

### Phase 1: PRD Generation

1. Spawn `prd-generator` agent via Task tool:

   ```
   Task(subagent_type="d2c:prd-generator")
   ```

   - Pass screenshots and/or description
   - Agent outputs `${RUN_DIR}/generated-prd.md`

### Phase 2: User Review [Hard Stop]

**MANDATORY**: MUST call `AskUserQuestion` to present PRD summary. Do NOT proceed until user confirms.

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
