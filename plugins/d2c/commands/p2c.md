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
- `--output`: Output directory (default: `./p2c-output/`)

## Execution Flow

### Phase 0: Init

1. Parse arguments and validate PRD file paths exist
2. Create run directory: `${OUTPUT_DIR}/`
3. Write `${RUN_DIR}/input.md` with:
   - PRD file paths
   - Target project path (if provided)
   - Selected tech stack

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
2. Spawn parallel `logic-generator` agents — one per page/module:
   ```
   For each page in chunks.json:
     Task(subagent_type="d2c:logic-generator", run_in_background=true)
   ```
   - Each agent receives: its chunk content + project-context.md + tech stack
   - Each agent outputs to: `${RUN_DIR}/logic-code/{module-name}/`

3. Wait for all agents to complete via `TaskOutput(block=true)`

4. Consolidate outputs:
   - Merge logic-summary.md files
   - Resolve cross-module import paths
   - Write consolidated `${RUN_DIR}/logic-summary.md`

### Phase 4: Delivery [Hard Stop]

1. Present delivery summary:
   - Modules covered
   - Files generated per module
   - API calls generated (real vs placeholder)
   - Cross-module dependencies
   - Any flagged ambiguities from PRD

2. User confirms acceptance

3. Display generated code location
