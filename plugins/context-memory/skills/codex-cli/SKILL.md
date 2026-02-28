---
name: codex-cli
description: |
  Codex wrapper skill for code analysis, documentation generation, and quality auditing.
  [Trigger] Agent or skill needs Codex model for analysis/generation/audit tasks.
  [Output] Model response via codeagent-wrapper + ${run_dir}/codex-${role}.log
  [Skip] Never — Codex is mandatory for analysis tasks. Report error if unavailable.
  [Ask] Which role to use (analyzer, doc-generator, auditor) if not specified.
  [Resource Usage] Use `scripts/invoke-codex.ts` with `references/roles/` prompt templates.
allowed-tools:
  - Bash
  - Read
  - Write
arguments:
  - name: role
    type: string
    required: true
    description: analyzer, doc-generator, or auditor
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
    description: Existing Codex session id for multi-turn
  - name: modules
    type: string
    required: false
    description: Comma-separated module paths (for doc-generator and analyzer roles)
---

# codex-cli

## Purpose

Call `scripts/invoke-codex.ts` with role-specific prompt templates for context-memory workflows. This skill MUST be invoked by agents — never bypass it to generate content inline.

## Script Entry

```bash
npx tsx scripts/invoke-codex.ts --role "${ROLE}" --prompt "${PROMPT}" [--workdir "${RUN_DIR}"] [--session "${SESSION_ID}"] --sandbox read-only
```

## Resource Usage

- Role prompts: `references/roles/{role}.md`
- Execution script: `scripts/invoke-codex.ts`

## Roles

| Role            | Purpose                                  | Output Format |
| --------------- | ---------------------------------------- | ------------- |
| `analyzer`      | Code structure analysis, module deps     | Markdown      |
| `doc-generator` | Generate CLAUDE.md content from code     | Markdown      |
| `auditor`       | Review docs for quality and completeness | Markdown      |

## Workflow

### Step 1: Build Prompt

Construct the full prompt by combining the task context with role-specific template.

#### Role: analyzer

```bash
PROMPT="
## Target Modules
${MODULE_PATHS}

## Task
Analyze the code structure of the specified modules. For each module:
1. Classify module type (utility, service, component, page, config)
2. List key exports (functions, classes, types, constants)
3. Map import dependencies (internal and external)
4. Identify patterns (singleton, factory, observer, etc.)

## Output Format
Output Markdown with one section per module:
### {module_path}
- **Type**: utility|service|component|page|config
- **Key Exports**: table of name, kind, description
- **Dependencies**: table of import path, usage
- **Patterns**: list of detected patterns
"
```

#### Role: doc-generator

```bash
PROMPT="
## Module
${MODULE_PATH}

## Source Code Summary
${KEY_FILES_WITH_EXPORTS}

## Dependencies
${DEPENDENCY_LIST}

## Existing Documentation
${EXISTING_CLAUDEMD_IF_ANY}

## Task
Generate CLAUDE.md content for this module focusing on code structure and implementation details. Include:
1. Module purpose and architecture
2. File inventory with responsibilities (table format)
3. Public API with signatures and return types
4. Internal patterns and conventions
5. Testing approach and test file locations
6. Common modification scenarios

## Output Format
Output Markdown directly. Use tables for structured data.
No preamble. Start with '# {module_name}'.
"
```

#### Role: auditor

```bash
PROMPT="
## Generated Documentation
${DOC_CONTENT}

## Source Module
${MODULE_PATH}

## Task
Audit the generated CLAUDE.md for quality. Check:
1. **Accuracy**: Do descriptions match actual code?
2. **Completeness**: Are all public APIs documented?
3. **Consistency**: Is format uniform across sections?
4. **Usefulness**: Would a developer find this helpful?

## Output Format
Output Markdown audit report:
## Audit: {module_name}
- **Score**: X/10
- **Issues**: numbered list of issues with severity (critical|warning|info)
- **Missing**: list of undocumented exports or files
- **Recommendations**: prioritized improvement suggestions
"
```

### Step 2: Call Codex

```bash
npx tsx scripts/invoke-codex.ts \
  --role "${ROLE}" \
  --prompt "$PROMPT" \
  --workdir "${RUN_DIR}" \
  --session "${SESSION_ID}" \
  --sandbox read-only
```

### Step 3: Capture and Persist Output

1. Capture stdout from the script execution.
2. Write output to `${run_dir}/codex-${role}-${module}.md`.
3. Write execution log to `${run_dir}/codex-${role}.log` if `run_dir` provided.
4. Retain session id for follow-up calls.

## Constraints

| Required                               | Forbidden                               |
| -------------------------------------- | --------------------------------------- |
| MUST call invoke-codex.ts script       | Generate content inline without calling |
| MUST use role-specific prompt template | Send generic/empty prompts to Codex     |
| MUST persist output to run_dir files   | Discard Codex output                    |
| MUST use --sandbox read-only           | Allow Codex to write files directly     |
| MUST report errors with stderr content | Silently ignore script failures         |

## Verification

- Script exits with status 0.
- Output file exists at expected path in run_dir.
- Output matches expected format for the role.
- Session id is captured for follow-up calls when available.
