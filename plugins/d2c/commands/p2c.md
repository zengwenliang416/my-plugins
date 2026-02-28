---
description: "Generate logic code from PRD documents with project context enhancement"
argument-hint: "<prd_paths...> [--project <path>] [--stack react|vue] [--output <dir>]"
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
---

# /p2c — PRD to Code

Generate executable logic code from PRD documents, enhanced with real project context to eliminate API hallucination.

## Arguments

- `prd_paths`: One or more paths to PRD files — Markdown or plain text (required)
- `--project`: Path to target project for codebase context retrieval (optional)
- `--stack`: Target tech stack — `react` (default) or `vue`
- `--output`: Output directory override (default: `openspec/changes/p2c-${slug}/`)

## Execution Flow

## Task Result Handling

Each `Task` call **blocks** until the teammate finishes and returns the result directly in the call response.

**FORBIDDEN — never do this:**

- MUST NOT call `TaskOutput` — this tool does not exist
- MUST NOT manually construct task IDs (e.g., `agent-name@worktree-id`)

**CORRECT — always use direct return:**

- The result comes from the `Task` call itself, no extra step needed

### Phase 0: Init

1. Parse arguments and validate PRD file paths exist
2. Derive `CHANGE_ID` = `p2c-${slug}` where `slug` is a kebab-case identifier from the PRD name or primary module (e.g., `p2c-user-auth`, `p2c-checkout-flow`)
3. Set `RUN_DIR`:
   - If `--output` specified: use that path as `RUN_DIR`
   - Otherwise: `openspec/changes/${CHANGE_ID}/`
4. Create `${RUN_DIR}/` directory
5. Scaffold OpenSpec artifacts:
   - `${RUN_DIR}/proposal.md` — auto-generated change proposal:

     ```markdown
     # Change: P2C — ${slug}

     ## Why

     Generate logic code from PRD documents with project context.

     ## What Changes

     - New logic code under logic-code/

     ## Impact

     - Affected specs: none (new artifacts only)
     ```

   - `${RUN_DIR}/tasks.md` — phase checklist:

     ```markdown
     ## 1. Init

     - [ ] 1.1 Parse arguments and validate inputs
     - [ ] 1.2 Scaffold OpenSpec change directory

     ## 2. PRD Analysis

     - [ ] 2.1 Run prd-analyzer agent
     - [ ] 2.2 Determine single/multi-agent mode

     ## 3. Context Retrieval

     - [ ] 3.1 Query project codebase (if --project specified)
     - [ ] 3.2 Compile project-context.md

     ## 4. Logic Generation

     - [ ] 4.1 Run logic-generator agent(s)
     - [ ] 4.2 Consolidate outputs (if multi-agent)

     ## 5. Delivery

     - [ ] 5.1 Present delivery summary
     - [ ] 5.2 User confirms acceptance
     ```

6. Write `${RUN_DIR}/input.md` with:
   - PRD file paths
   - Target project path (if provided)
   - Selected tech stack
   - CHANGE_ID

### Phase 1: PRD Analysis

1. Spawn `prd-analyzer` agent via Task tool:

   ```
   Task(subagent_type="d2c:prd-analyzer")
   ```

   - Pass all PRD files for structured parsing
   - Agent outputs:
     - `${RUN_DIR}/structured-requirements.md` — always
     - `${RUN_DIR}/chunks.json` — if complexity threshold exceeded

2. Read analysis results:
   - If `chunks.json` exists → multi-agent mode for Phase 3
   - If not → single-agent mode for Phase 3

### Phase 2: Context Retrieval

**If `--project` is specified:**

1. Use `codebase-retrieval` MCP to query the target project:
   - Search for API call patterns (fetch/axios/SDK wrappers)
   - Search for state management setup (stores, hooks, composables)
   - Search for routing configuration
   - Search for error handling patterns
   - Search for common utilities

2. Compile findings into `${RUN_DIR}/project-context.md`

**If `--project` is NOT specified:**

1. Write a minimal `${RUN_DIR}/project-context.md` noting:
   - No project context available
   - Standard framework conventions will be used
   - API calls will be marked as placeholders

### Phase 3: Logic Generation

#### Single-Agent Mode (simple PRD):

1. Spawn one `logic-generator` agent:

   ```
   Task(subagent_type="d2c:logic-generator")
   ```

   - Pass: structured-requirements.md + project-context.md + tech stack
   - Agent outputs: `${RUN_DIR}/logic-code/`

#### Multi-Agent Mode (complex PRD):

1. Read `chunks.json` for module-to-chunk mapping
2. Launch parallel `logic-generator` teammates in a single message for concurrent execution — one per page/module:

   ```
   For each page in chunks.json:
     Task(subagent_type="d2c:logic-generator", name="logic-${module-name}", prompt="run_dir=${RUN_DIR} chunk=${chunk} tech_stack=${TECH_STACK}")
   ```

   - Each Task call blocks until the teammate finishes. Results are returned directly — no TaskOutput needed.
   - Each agent receives: its chunk content + project-context.md + tech stack
   - Each agent outputs to: `${RUN_DIR}/logic-code/{module-name}/`

3. Consolidate outputs:
   - Merge logic-summary.md files
   - Resolve cross-module import paths
   - Write consolidated `${RUN_DIR}/logic-summary.md`

### Phase 4: Delivery [Hard Stop]

**MANDATORY**: MUST call `AskUserQuestion` to present delivery summary. Do NOT skip user confirmation.

1. Present delivery summary:
   - Modules covered
   - Files generated per module
   - API calls generated (real vs placeholder)
   - Cross-module dependencies
   - Any flagged ambiguities from PRD

2. User confirms acceptance

3. Display generated code location
