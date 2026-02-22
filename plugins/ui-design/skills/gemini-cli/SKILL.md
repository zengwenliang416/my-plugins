---
name: gemini-cli
description: |
  [Trigger] When UI design workflow needs reference analysis, style design, or frontend prototype generation.
  [Output] Structured analysis, design recommendations, or component code depending on role/mode.
  [Skip] For backend logic or non-visual tasks.
  [Ask] No user input needed; invoked by other skills or agents.
  [Resource Usage] Use references/, assets/, and scripts/ (`scripts/invoke-gemini-ui.ts`).
allowed-tools:
  - Bash
  - Read
  - Write
arguments:
  - name: role
    type: string
    required: true
    description: "analyzer, ui_designer, or frontend"
  - name: mode
    type: string
    required: false
    description: "reference, style, variant, or prototype (used by caller to choose prompt template)"
  - name: prompt
    type: string
    required: true
    description: "Final prompt passed to Gemini"
  - name: image
    type: string
    required: false
    description: "Image path for vision tasks (reference screenshots, design mockups)"
  - name: dimension
    type: string
    required: false
    description: "Analysis dimension: visual, color, component, or layout"
---

# Gemini CLI - UI Design Expert

UI/UX design expert via `scripts/invoke-gemini-ui.ts`. Supports image input for vision-based analysis. Three roles cover the full design lifecycle: analysis, design, and frontend implementation.

## Script Entry

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role "<role>" \
  --prompt "<prompt>" \
  [--image "<path>"] \
  [--dimension "<type>"]
```

## Resource Usage

- Role prompts: `references/roles/{role}.md`
- Execution script: `scripts/invoke-gemini-ui.ts`

## Roles

| Role        | Purpose                              | CLI Flag             |
| ----------- | ------------------------------------ | -------------------- |
| analyzer    | UI/UX analysis and reference parsing | `--role analyzer`    |
| ui_designer | Style design and variant generation  | `--role ui_designer` |
| frontend    | Frontend code prototype generation   | `--role frontend`    |

## Workflow

### Step 1: Build Prompt

Select the appropriate template based on role and mode.

### Step 2: Call Gemini

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role "$ROLE" \
  --prompt "$PROMPT" \
  --image "$IMAGE" \
  --dimension "$DIMENSION"
```

### Step 3: Capture Output

Parse the structured output and write to `${run_dir}/` artifacts.

---

## Prompt Templates

### Role: analyzer — Mode: reference (with image)

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role analyzer \
  --image "$REFERENCE_IMAGE" \
  --dimension "$DIMENSION" \
  --prompt "
## Task
Analyze the reference design screenshot from a ${DIMENSION} perspective.

## Analysis Dimension
${DIMENSION} (visual/color/component/layout)

## Output Requirements
Provide structured analysis containing:
- key_observations: list of findings
- design_patterns: identified patterns and conventions
- color_palette: extracted colors (if dimension=color)
- component_inventory: identified components (if dimension=component)
- layout_structure: grid/flex/hierarchy (if dimension=layout)
- recommendations: actionable suggestions

## Output Format
Markdown with structured sections per dimension.
"
```

### Role: analyzer — Mode: requirements

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role analyzer \
  --prompt "
## Task
Generate UI requirements from the design analysis.

## Design Analysis Summary
${DESIGN_ANALYSIS}

## Scenario
${SCENARIO} (new-design/redesign/optimize)

## Output Requirements
1. Functional requirements (user interactions)
2. Visual requirements (layout, spacing, typography)
3. Responsive requirements (breakpoints, adaptation)
4. Accessibility requirements (WCAG level)
5. Component inventory with hierarchy

## Output Format
Markdown requirements document with numbered items.
"
```

### Role: ui_designer — Mode: style

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role ui_designer \
  --prompt "
## Task
Generate style recommendation candidates based on the design analysis.

## Design Analysis
${DESIGN_ANALYSIS}

## Requirements
${REQUIREMENTS}

## Output Requirements
Generate 3 style candidates (A, B, C), each containing:
- name: style name
- concept: 1-sentence design concept
- color_scheme: primary, secondary, accent, background, text
- typography: heading font, body font, scale
- spacing: base unit, scale system
- border_radius: corner style
- shadow_style: elevation approach
- mood: overall feeling

## Output Format
Markdown with 3 distinct style sections.
"
```

### Role: ui_designer — Mode: variant

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role ui_designer \
  --prompt "
## Task
Generate a detailed design variant based on the selected style.

## Selected Style
${SELECTED_STYLE}

## Requirements
${REQUIREMENTS}

## Component List
${COMPONENT_LIST}

## Output Requirements
For each component:
- Visual specification (colors, spacing, typography)
- Interaction states (hover, active, disabled, focus)
- Responsive behavior per breakpoint
- Accessibility notes

## Output Format
Markdown design specification document.
"
```

### Role: frontend — Mode: prototype

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role frontend \
  --prompt "
## Task
Generate frontend component code from the design specification.

## Design Specification
${DESIGN_SPEC}

## Tech Stack
${TECH_STACK} (React/Vue/HTML)

## Requirements
1. Semantic HTML structure
2. Component-based architecture
3. Responsive implementation
4. Accessibility attributes (ARIA)
5. CSS following the design tokens

## Output Format
Complete component code files with:
- Component source (JSX/Vue SFC/HTML)
- Style definitions (CSS/Tailwind/Styled)
- Type definitions (if TypeScript)
"
```

---

## MUST: Collaboration Workflow

### Step 1: Gemini Analyze References

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role analyzer \
  --image "$REF_IMAGE" \
  --dimension visual \
  --prompt "$ANALYSIS_PROMPT"
```

### Step 2: Gemini Generate Style

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role ui_designer \
  --prompt "$STYLE_PROMPT"
```

### Step 3: Claude Review Design

1. Review style candidates for consistency
2. Validate against requirements
3. Check accessibility compliance

### Step 4: Gemini Generate Code

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role frontend \
  --prompt "$PROTOTYPE_PROMPT"
```

### Step 5: Claude Review & Refactor Code

1. Review prototype code quality
2. Refactor to project standards
3. Verify accessibility and responsiveness

---

## Constraints

| Required                                  | Forbidden                               |
| ----------------------------------------- | --------------------------------------- |
| MUST call invoke-gemini-ui.ts script      | Generate designs inline without calling |
| MUST use role-specific prompt template    | Send generic/empty prompts to Gemini    |
| MUST verify image path before passing     | Pass non-existent image paths           |
| Prototype code MUST be reviewed by Claude | Apply prototype code without review     |
| MUST persist output to run_dir artifacts  | Discard Gemini output                   |
| Use Task tool for background execution    | Terminate background tasks arbitrarily  |

## Collaboration

1. **analysis-core** agent invokes `analyzer` role for reference parsing
2. **design-core** agent invokes `ui_designer` role for style/variant generation
3. **generation-core** agent invokes `frontend` role for code prototyping
4. **validation-core** agent reviews outputs using local tools (no Gemini needed)
