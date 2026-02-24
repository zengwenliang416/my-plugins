---
description: "Integrated D2C + P2C pipeline — design screenshots and PRD to complete component code"
argument-hint: "<screenshot_paths...> [--prd <prd_paths...>] [--description <text_or_file>] [--project <path>] [--stack react|vue] [--output <dir>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
  - Task
  - mcp__auggie-mcp__codebase-retrieval
  - Skill
---

# /d2c-full — Integrated Design + PRD to Complete Code

Run the full D2C + P2C pipeline: generate UI component code from design screenshots, then integrate logic code into the generated components. PRD can be provided directly or generated from the design screenshots and/or user descriptions.

## Constraints

- **Image generation MUST use the `d2c:image-generator` skill** (invoked via `Skill` tool). NEVER use MCP image tools (`mcp__banana-image__*`) directly. All image assets are generated through the skill's `generate-image.ts` script calling Gemini API.
- All gradient colors MUST be extracted as full CSS gradient syntax — never approximate as solid colors.

## Arguments

- `screenshot_paths`: One or more paths to design screenshot images (required)
- `--prd`: One or more paths to existing PRD files (optional — if omitted, PRD is auto-generated)
- `--description`: Natural language requirement description to supplement or replace PRD (optional)
- `--project`: Path to target project for codebase context retrieval (optional)
- `--stack`: Target tech stack — `react` (default) or `vue`
- `--output`: Output directory override (default: `openspec/changes/d2c-full-${slug}/`)

## Execution Flow

### Phase 0: Init

1. Parse arguments and validate all file paths
2. Determine PRD source:
   - `--prd` provided → use existing PRD (parse mode)
   - `--prd` NOT provided → generate PRD from screenshots + optional description (generate mode)
   - Both `--prd` and `--description` → merge description into existing PRD
3. Derive `CHANGE_ID` = `d2c-full-${slug}` where `slug` is a kebab-case identifier from the design name or primary feature (e.g., `d2c-full-landing-page`, `d2c-full-settings`)
4. Set `RUN_DIR`:
   - If `--output` specified: use that path as `RUN_DIR`
   - Otherwise: `openspec/changes/${CHANGE_ID}/`
5. Create `${RUN_DIR}/` directory
6. Scaffold OpenSpec artifacts:
   - `${RUN_DIR}/proposal.md` — auto-generated change proposal:
     ```markdown
     # Change: D2C-Full — ${slug}

     ## Why

     Generate complete component code (UI + logic) from design screenshots and PRD.

     ## What Changes

     - New generated components under generated-code/
     - Logic integration into UI components

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

     ## 5. PRD Resolution

     - [ ] 5.1 Generate or parse PRD
     - [ ] 5.2 Structure requirements

     ## 6. Context Retrieval

     - [ ] 6.1 Query project codebase (if --project specified)

     ## 7. Logic Integration

     - [ ] 7.1 Run logic-generator agent(s)
     - [ ] 7.2 Merge logic into UI components

     ## 8. Delivery

     - [ ] 8.1 Present delivery summary
     - [ ] 8.2 User confirms acceptance
     ```
7. Write `${RUN_DIR}/input.md` with all parameters and CHANGE_ID

### Phase 1: Design Analysis [Hard Stop]

**Same as /d2c Phase 1** — spawn `design-analyzer`, present results, get user confirmation.

### Phase 1.5: Image Asset Generation

**Same as /d2c Phase 1.5** — invoke `d2c:image-generator` skill if image assets detected.

### Phase 2: UI Code Generation

**Same as /d2c Phase 2** — spawn `ui-generator`, generate component code to `${RUN_DIR}/generated-code/`.

### Phase 2.5: Fidelity Check

**Same as /d2c Phase 2.5** — review fidelity report, handle deviations.

### Phase 3: PRD Resolution

**Branch based on Phase 0 determination:**

#### Path A: PRD Generation (no `--prd` provided)

1. Spawn `prd-generator` agent:

   ```
   Task(subagent_type="d2c:prd-generator")
   ```

   - Pass: design screenshots + visual-analysis.md + optional --description
   - Agent infers interactions, states, navigation, API needs from design
   - Agent outputs: `${RUN_DIR}/generated-prd.md`

2. **[Hard Stop]** Present generated PRD summary:
   - Module count, requirement count, confidence levels
   - Gaps and assumptions
   - User can: Accept / Edit / Regenerate with more description

3. After user accepts, spawn `prd-analyzer` to structure the generated PRD:
   - Output: `${RUN_DIR}/structured-requirements.md` + optional `chunks.json`

#### Path B: PRD Parsing (--prd provided)

1. Spawn `prd-analyzer` agent:
   ```
   Task(subagent_type="d2c:prd-analyzer")
   ```

   - Pass: PRD files + visual-analysis.md + generated-code/ structure
   - Agent maps requirements to existing UI components
   - Output: `${RUN_DIR}/structured-requirements.md` + optional `chunks.json`

**Data continuity**: Both paths MUST read `${RUN_DIR}/visual-analysis.md` and `${RUN_DIR}/generated-code/` to map requirements to components.

### Phase 4: Context Retrieval

**Same as /p2c Phase 2** — use codebase-retrieval if `--project` is specified.

### Phase 5: Logic Integration

This phase **modifies the existing UI components** to add business logic.

1. Spawn `logic-generator` agent(s):

   ```
   Task(subagent_type="d2c:logic-generator")
   ```

   - Pass: generated-code/ + structured-requirements.md + project-context.md
   - Agent MODIFIES existing component files to add:
     - Event handlers on interactive elements
     - State hooks/composables
     - API call integration
     - Route navigation
     - Loading and error states
   - Agent outputs: modified `${RUN_DIR}/generated-code/` + `${RUN_DIR}/integration-summary.md`

2. For multi-agent mode (chunked PRD):
   - Assign each agent specific modules
   - Each agent modifies only its assigned components
   - Consolidate after all agents complete

### Phase 6: Delivery [Hard Stop]

1. Present comprehensive delivery summary:
   - **D2C results**: Components generated, fidelity assessment
   - **PRD source**: Generated vs provided, confidence levels
   - **P2C results**: Logic coverage, API integration status (real vs placeholder)
   - **Integration**: Components with logic vs UI-only components
   - **Gaps**: Any requirements not mapped to components

2. User confirms acceptance

3. Display final code location and remaining TODOs
