---
name: gemini-cli
description: |
  Gemini wrapper skill for documentation generation, style analysis, and API extraction.
  [Trigger] Agent or skill needs Gemini model for doc-gen/style/api tasks.
  [Output] Model response via codeagent-wrapper + ${run_dir}/gemini-${role}.log
  [Skip] When task can be handled by Claude inline without external model.
  [Ask] Which role to use (doc-generator, style-analyzer, api-extractor) if not specified.
  [Resource Usage] Use `scripts/invoke-gemini.ts` with `references/roles/` prompt templates.
allowed-tools:
  - Bash
  - Read
  - Write
arguments:
  - name: role
    type: string
    required: true
    description: doc-generator, style-analyzer, or api-extractor
  - name: prompt
    type: string
    required: true
    description: Task-specific prompt to merge with role template
  - name: run_dir
    type: string
    required: false
    description: Output workspace for artifacts
  - name: session_id
    type: string
    required: false
    description: Existing Gemini session id for multi-turn
  - name: modules
    type: string
    required: false
    description: Comma-separated module paths (for doc-generator role)
---

# gemini-cli

## Purpose

Call `scripts/invoke-gemini.ts` with role-specific prompt templates for context-memory workflows. This skill MUST be invoked by agents — never bypass it to generate content inline.

## Script Entry

```bash
npx tsx scripts/invoke-gemini.ts --role "${ROLE}" --prompt "${PROMPT}" [--workdir "${RUN_DIR}"] [--session "${SESSION_ID}"]
```

## Resource Usage

- Role prompts: `references/roles/{role}.md`
- Execution script: `scripts/invoke-gemini.ts`

## Roles

| Role             | Purpose                                 | Output Format |
| ---------------- | --------------------------------------- | ------------- |
| `doc-generator`  | Generate CLAUDE.md content for a module | Markdown      |
| `style-analyzer` | Extract design tokens, style patterns   | JSON          |
| `api-extractor`  | Generate OpenAPI spec from route code   | YAML          |

## Workflow

### Step 1: Build Prompt

Construct the full prompt by combining the task context with role-specific template.

#### Role: doc-generator

```bash
PROMPT="
## Module
${MODULE_PATH}

## Source Files
${FILE_LIST_WITH_KEY_EXPORTS}

## Dependencies
${DEPENDENCY_LIST}

## Task
Generate a CLAUDE.md for this module. Include:
1. Module overview (purpose, responsibilities)
2. Key files and their roles (table format)
3. Public API surface (exported functions, classes, types)
4. Dependencies and integration points
5. Usage patterns and examples from existing code

## Output Format
Output Markdown directly. Use tables for file listings and API surfaces.
No preamble. Start with '# {module_name}'.
"
```

#### Role: style-analyzer

```bash
PROMPT="
## Project Files
${STYLE_RELATED_FILES}

## Task
Extract design tokens and style patterns from the project. Include:
1. Color palette (hex values, semantic names)
2. Typography scale (font families, sizes, weights)
3. Spacing system (padding, margin values)
4. Component patterns (button variants, card layouts)

## Output Format
Output JSON only:
{
  \"colors\": [{\"name\": \"primary\", \"value\": \"#xxx\", \"usage\": \"...\"}],
  \"typography\": [{\"name\": \"heading-1\", \"family\": \"...\", \"size\": \"...\", \"weight\": \"...\"}],
  \"spacing\": [{\"name\": \"sm\", \"value\": \"...\"}],
  \"components\": [{\"name\": \"button-primary\", \"pattern\": \"...\"}]
}
"
```

#### Role: api-extractor

```bash
PROMPT="
## Route Files
${ROUTE_FILES_CONTENT}

## Framework
${FRAMEWORK_NAME}

## Task
Generate OpenAPI 3.0 spec from the route definitions. Include:
1. All endpoints with methods, paths, parameters
2. Request/response schemas from type definitions
3. Authentication requirements
4. Error response formats

## Output Format
Output YAML only. Start with 'openapi: 3.0.0'.
"
```

### Step 2: Call Gemini

```bash
npx tsx scripts/invoke-gemini.ts \
  --role "${ROLE}" \
  --prompt "$PROMPT" \
  --workdir "${RUN_DIR}" \
  --session "${SESSION_ID}"
```

### Step 3: Capture and Persist Output

1. Capture stdout from the script execution.
2. Write output to `${run_dir}/gemini-${role}-${module}.md` (or `.json`/`.yaml` per role).
3. Write execution log to `${run_dir}/gemini-${role}.log` if `run_dir` provided.
4. Retain session id for follow-up calls.

## Constraints

| Required                               | Forbidden                                 |
| -------------------------------------- | ----------------------------------------- |
| MUST call invoke-gemini.ts script      | Generate content inline without calling   |
| MUST use role-specific prompt template | Send generic/empty prompts to Gemini      |
| MUST persist output to run_dir files   | Discard Gemini output                     |
| MUST retain session id for multi-turn  | Start new session when continuing context |
| MUST report errors with stderr content | Silently ignore script failures           |

## Verification

- Script exits with status 0.
- Output file exists at expected path in run_dir.
- Output matches expected format for the role (Markdown/JSON/YAML).
- Session id is captured for follow-up calls when available.
