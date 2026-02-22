---
name: codex-cli
description: |
  [Trigger] When TPD workflow needs backend analysis, architecture, implementation guidance, or auditing.
  [Output] Structured analysis per role — constraints JSON, architecture plan, implementation guidance, or audit report.
  [Skip] For frontend UI/UX analysis or component design (use gemini-cli instead).
  [Ask] No user input needed; invoked by other skills or commands.
  [Resource Usage] Use references/, assets/, and scripts/ (`scripts/invoke-codex.ts`).
allowed-tools:
  - Bash
  - Read
  - Task
arguments:
  - name: role
    type: string
    required: true
    description: "constraint-analyst, architect, implementer, or auditor"
  - name: mode
    type: string
    required: false
    description: "analyze or prototype (required when role=implementer)"
  - name: focus
    type: string
    required: false
    description: "Optional focus area for architect or auditor roles"
  - name: prompt
    type: string
    required: true
    description: "Prompt passed to Codex"
  - name: run_dir
    type: string
    required: false
    description: "Output workspace for artifacts"
---

# Codex CLI - TPD Backend Expert

Backend analysis expert via `scripts/invoke-codex.ts`. Supports 4 roles across the TPD lifecycle: constraint analysis, architecture design, implementation guidance, and quality audit. Runs in **read-only sandbox**.

## Script Entry

```bash
npx tsx scripts/invoke-codex.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"] [--sandbox "read-only"]
```

## Resource Usage

- Role prompts: `references/roles/{role}.md`
- Execution script: `scripts/invoke-codex.ts`

## Roles

| Role               | Purpose                             | CLI Flag                    |
| ------------------ | ----------------------------------- | --------------------------- |
| constraint-analyst | Technical constraint identification | `--role constraint-analyst` |
| architect          | Backend architecture design         | `--role architect`          |
| implementer        | Backend implementation guide        | `--role implementer`        |
| auditor            | Quality and risk audit              | `--role auditor`            |

## Workflow

### Step 1: Build Prompt

Select the appropriate template based on role.

### Step 2: Call Codex

```bash
npx tsx scripts/invoke-codex.ts \
  --role "$ROLE" \
  --prompt "$PROMPT" \
  --workdir "$WORKDIR" \
  --sandbox read-only
```

### Step 3: Capture Output

Parse the structured output and write to `${run_dir}/codex-{role}.md`.

---

## Prompt Templates

### Role: constraint-analyst

```bash
PROMPT="
## Task
Identify technical constraints for the following requirement.

## Requirement
${REQUIREMENT}

## Analysis Dimensions
1. Existing architecture boundaries and module limits
2. Data model and API compatibility constraints
3. Dependency and version constraints
4. Performance and scalability limits
5. Security and compliance requirements
6. Migration and backward compatibility risks

## Output Format
JSON object:
{
  \"hard_constraints\": [{\"id\": \"C-1\", \"category\": \"...\", \"description\": \"...\", \"impact\": \"high/medium/low\"}],
  \"assumptions\": [{\"id\": \"A-1\", \"description\": \"...\", \"risk_if_wrong\": \"...\"}],
  \"unknowns\": [{\"id\": \"U-1\", \"description\": \"...\", \"resolution_path\": \"...\"}]
}
"
```

### Role: architect

```bash
PROMPT="
## Task
Design backend architecture for the following requirement.

## Requirement
${REQUIREMENT}

## Constraints
${CONSTRAINTS_FROM_THINKING_PHASE}

## Design Dimensions
1. Module boundaries and interfaces
2. Data model and storage strategy
3. API design and versioning
4. Error handling and resilience
5. Testing strategy
6. Implementation sequencing

## Output Format
Markdown with sections:
- **Module Design**: boundary diagram and interface definitions
- **Data Model**: schema or entity descriptions
- **Implementation Phases**: ordered phase list with deliverables
- **Risk Notes**: potential issues and mitigations
"
```

### Role: implementer

```bash
PROMPT="
## Task
Generate backend implementation guidance for the current phase.

## Phase Scope
${PHASE_SCOPE}

## Architecture Reference
${ARCHITECTURE_SUMMARY}

## Mode
${MODE}  # analyze or prototype

## Output Format (analyze mode)
Markdown with:
- File-by-file change list with rationale
- Interface and type definitions
- Error handling patterns
- Verification checklist

## Output Format (prototype mode)
Unified diff patches:
--- a/path/to/file
+++ b/path/to/file
@@ ... @@
"
```

### Role: auditor

```bash
PROMPT="
## Task
Audit the implementation deliverables for quality and safety.

## Changes Summary
${CHANGES_SUMMARY}

## Audit Dimensions
1. Correctness defects and logic errors
2. Regression risks and missing tests
3. Security concerns (injection, auth bypass, data leaks)
4. Error handling completeness
5. Performance and scalability concerns
6. Maintainability and code clarity

## Output Format
JSON object:
{
  \"findings\": [
    {
      \"id\": \"F-1\",
      \"severity\": \"critical/high/medium/low\",
      \"category\": \"...\",
      \"location\": {\"file\": \"...\", \"line\": 0},
      \"description\": \"...\",
      \"fix_suggestion\": \"...\"
    }
  ],
  \"summary\": {\"critical\": 0, \"high\": 0, \"medium\": 0, \"low\": 0},
  \"pass\": true
}
"
```

---

## Constraints

| Required                                    | Forbidden                                |
| ------------------------------------------- | ---------------------------------------- |
| MUST call invoke-codex.ts script            | Generate analysis inline without calling |
| MUST use role-specific prompt template      | Send generic/empty prompts to Codex      |
| MUST use `--sandbox read-only`              | Use write sandbox or `--yolo` mode       |
| MUST persist output to run_dir files        | Discard Codex output                     |
| Prototype output MUST be reviewed by Claude | Apply prototype patches without review   |

## Collaboration

1. **Thinking phase**: constraint-analyst provides technical boundary analysis
2. **Plan phase**: architect designs backend architecture
3. **Dev phase**: implementer generates guidance/prototypes, auditor reviews
4. Gemini handles frontend counterpart for each phase
