---
name: gemini-cli
description: |
  [Trigger] When TPD workflow needs frontend/UX analysis, architecture, implementation guidance, or auditing.
  [Output] Structured analysis per role — constraints JSON, architecture plan, implementation guidance, or audit report.
  [Skip] For backend logic, API, or system architecture (use codex-cli instead).
  [Ask] No user input needed; invoked by other skills or commands.
  [Resource Usage] Use references/, assets/, and scripts/ (`scripts/invoke-gemini.ts`).
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
    description: "Prompt passed to Gemini"
  - name: run_dir
    type: string
    required: false
    description: "Output workspace for artifacts"
---

# Gemini CLI - TPD Frontend Expert

Frontend analysis expert via `scripts/invoke-gemini.ts`. Supports 4 roles across the TPD lifecycle: constraint analysis, architecture design, implementation guidance, and quality audit.

## Script Entry

```bash
npx tsx scripts/invoke-gemini.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"]
```

## Resource Usage

- Role prompts: `references/roles/{role}.md`
- Execution script: `scripts/invoke-gemini.ts`

## Roles

| Role               | Purpose                            | CLI Flag                    |
| ------------------ | ---------------------------------- | --------------------------- |
| constraint-analyst | UX/frontend constraint analysis    | `--role constraint-analyst` |
| architect          | Frontend architecture design       | `--role architect`          |
| implementer        | Component implementation guide     | `--role implementer`        |
| auditor            | UX quality and accessibility audit | `--role auditor`            |

## Workflow

### Step 1: Build Prompt

Select the appropriate template based on role.

### Step 2: Call Gemini

```bash
npx tsx scripts/invoke-gemini.ts \
  --role "$ROLE" \
  --prompt "$PROMPT" \
  --workdir "$WORKDIR"
```

### Step 3: Return Output

The CLI output is streamed to stdout via the Bash tool result. The **calling agent** (gemini-core) is responsible for persisting the output to `${run_dir}/gemini-{role}.md` using its Write tool. This skill MUST NOT swallow or discard the CLI output.

---

## Prompt Templates

### Role: constraint-analyst

```bash
PROMPT="
## Task
Analyze frontend and UX constraints for the following requirement.

## Requirement
${REQUIREMENT}

## Analysis Dimensions
1. UX boundaries and design system constraints
2. Frontend architecture and dependency limits
3. Browser/device compatibility constraints
4. Performance budget constraints
5. Accessibility requirements (WCAG level)
6. Delivery risk and feasibility signals

## Output Format
JSON object:
{
  \"hard_constraints\": [{\"id\": \"C-1\", \"category\": \"...\", \"description\": \"...\", \"impact\": \"high/medium/low\"}],
  \"assumptions\": [{\"id\": \"A-1\", \"description\": \"...\", \"risk_if_wrong\": \"...\"}],
  \"trade_offs\": [{\"option_a\": \"...\", \"option_b\": \"...\", \"recommendation\": \"...\"}]
}
"
```

### Role: architect

```bash
PROMPT="
## Task
Design frontend architecture for the following requirement.

## Requirement
${REQUIREMENT}

## Constraints
${CONSTRAINTS_FROM_THINKING_PHASE}

## Design Dimensions
1. Component model and hierarchy
2. State management strategy
3. Interaction flow and routing
4. Visual consistency with design system
5. Accessibility approach
6. Implementation sequencing

## Output Format
Markdown with sections:
- **Component Model**: tree diagram of components
- **State Flow**: data flow description
- **Implementation Phases**: ordered phase list with deliverables
- **Risk Notes**: potential issues and mitigations
"
```

### Role: implementer

```bash
PROMPT="
## Task
Generate frontend implementation guidance for the current phase.

## Phase Scope
${PHASE_SCOPE}

## Architecture Reference
${ARCHITECTURE_SUMMARY}

## Mode
${MODE}  # analyze or prototype

## Output Format (analyze mode)
Markdown with:
- File-by-file change list with rationale
- Component interface definitions
- State update patterns
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
Audit the implementation deliverables for quality and usability.

## Changes Summary
${CHANGES_SUMMARY}

## Audit Dimensions
1. UX defects and interaction issues
2. Accessibility gaps (ARIA, keyboard navigation, contrast)
3. Visual consistency with design system
4. Regression risks
5. Component maintainability
6. Missing validations or edge cases

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
| MUST call invoke-gemini.ts script           | Generate analysis inline without calling |
| MUST use role-specific prompt template      | Send generic/empty prompts to Gemini     |
| MUST return CLI output via stdout to caller | Discard or swallow Gemini output         |
| MUST validate role before invocation        | Use roles not in the table above         |
| Prototype output MUST be reviewed by Claude | Apply prototype patches without review   |

## Collaboration

1. **Thinking phase**: constraint-analyst provides boundary analysis
2. **Plan phase**: architect designs frontend architecture
3. **Dev phase**: implementer generates guidance/prototypes, auditor reviews
4. Codex handles backend counterpart for each phase
