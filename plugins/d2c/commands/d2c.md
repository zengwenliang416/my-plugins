---
description: "Generate semantic UI component code from design screenshots"
argument-hint: "<screenshot_paths...> [--stack react|vue] [--incremental] [--output <dir>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
  - Task
  - Skill
---

# /d2c — Design to Code

Generate semantic, component-based UI code from design screenshots.

## Constraints

- **Image generation MUST use the `d2c:image-generator` skill** (invoked via `Skill` tool). NEVER use MCP image tools (`mcp__banana-image__*`) directly. All image assets are generated through the skill's `generate-image.ts` script calling Gemini API.
- All gradient colors MUST be extracted as full CSS gradient syntax — never approximate as solid colors.

## Arguments

- `screenshot_paths`: One or more paths to design screenshot images (required)
- `--stack`: Target tech stack — `react` (default) or `vue`
- `--incremental`: Enable incremental mode — analyze first, then user selects components to generate
- `--output`: Output directory override (default: `openspec/changes/d2c-${slug}/`)

## Execution Flow

### Phase 0: Init

1. Parse arguments and validate screenshot paths exist
2. Derive `CHANGE_ID` = `d2c-${slug}` where `slug` is a kebab-case identifier from the design name or first screenshot filename (e.g., `d2c-login-page`, `d2c-dashboard`)
3. Set `RUN_DIR`:
   - If `--output` specified: use that path as `RUN_DIR`
   - Otherwise: `openspec/changes/${CHANGE_ID}/`
4. Create `${RUN_DIR}/` directory
5. Scaffold OpenSpec artifacts:
   - `${RUN_DIR}/proposal.md` — auto-generated change proposal:

     ```markdown
     # Change: D2C — ${slug}

     ## Why

     Generate UI component code from design screenshots.

     ## What Changes

     - New generated components under generated-code/

     ## Impact

     - Affected specs: none (new artifacts only)
     ```

   - `${RUN_DIR}/tasks.md` — phase checklist:

     ```markdown
     ## 1. Init

     - [ ] 1.1 Parse arguments and validate inputs
     - [ ] 1.2 Scaffold OpenSpec change directory

     ## 2. Design Analysis

     - [ ] 2.1 Run design-analyzer agent
     - [ ] 2.2 User confirms analysis

     ## 3. Image Assets

     - [ ] 3.1 Generate image assets (if needed)

     ## 4. UI Code Generation

     - [ ] 4.1 Load tech-stack reference
     - [ ] 4.2 Run ui-generator agent

     ## 5. Fidelity Check

     - [ ] 5.1 Review fidelity report

     ## 6. Delivery

     - [ ] 6.1 Present delivery summary
     - [ ] 6.2 User confirms acceptance
     ```

6. Write `${RUN_DIR}/input.md` with:
   - Screenshot paths
   - Selected tech stack
   - Mode (full or incremental)
   - CHANGE_ID

### Phase 1: Design Analysis [Hard Stop]

1. Spawn `design-analyzer` agent via Task tool:

   ```
   Task(subagent_type="d2c:design-analyzer")
   ```

   - Pass all screenshot images for visual analysis
   - Agent reads images and outputs `${RUN_DIR}/visual-analysis.md`

2. **⏸️ HARD STOP**: MUST call `AskUserQuestion` to present analysis summary. Do NOT proceed until user confirms.
   - Show identified component count
   - Show component tree overview
   - Show extracted color palette
   - Options: "Proceed with generation" / "Adjust analysis" / "Cancel"

3. **If incremental mode (`--incremental`)**:
   - List all identified components
   - User selects which components to generate
   - Record selection in `${RUN_DIR}/component-selection.md`

### Phase 1.5: Image Asset Generation

**Conditional** — only runs if `visual-analysis.md` contains an `## Image Assets` section.

1. Invoke `image-generator` skill:

   ```
   Skill(skill="d2c:image-generator", args="assets_file=${RUN_DIR}/visual-analysis.md output_dir=${RUN_DIR}/generated-code/assets design_screenshot=${SCREENSHOT_PATHS[0]}")
   ```

   - Generates 4K images for each identified asset (backgrounds, maps, illustrations)
   - Uses design screenshot as style reference for visual consistency

2. Verify `${RUN_DIR}/generated-code/assets/asset-manifest.json`:
   - Log succeeded/failed counts
   - Failed assets will use CSS gradient fallbacks in code generation

### Phase 2: UI Code Generation

1. Load tech-stack reference:
   - Read `plugins/d2c/skills/tech-stack-adapter/references/${STACK}.md`

2. Spawn `ui-generator` agent via Task tool:

   ```
   Task(subagent_type="d2c:ui-generator")
   ```

   - Pass: visual-analysis.md + tech stack reference + original screenshots
   - In incremental mode: pass component-selection.md
   - Agent outputs:
     - `${RUN_DIR}/generated-code/` — component files
     - `${RUN_DIR}/fidelity-report.md` — design vs code comparison

### Phase 2.5: Fidelity Check

1. Read `${RUN_DIR}/fidelity-report.md`
2. If overall assessment is LOW:
   - Present deviations to user
   - Options: "Accept as-is" / "Re-generate with adjustments" / "Cancel"
3. If overall assessment is MEDIUM or HIGH:
   - Show brief summary, proceed to delivery

### Phase 3: Delivery [Hard Stop]

**MANDATORY**: MUST call `AskUserQuestion` to present delivery summary. Do NOT skip user confirmation.

1. Present delivery summary:
   - Total components generated
   - File list with sizes
   - Tech stack used
   - Fidelity assessment
   - Any flagged deviations

2. User confirms acceptance

3. Display generated code location and next steps:
   - If standalone: "Code available at ${OUTPUT_DIR}/generated-code/"
   - If part of full pipeline: "Proceeding to P2C phase..."
