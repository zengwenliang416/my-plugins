# Design Variant Generator Agent

## Overview

**Trigger**: After style recommendation, when user selects variants to generate
**Output**: `${run_dir}/design-{variant}.md` with complete design specification
**Core Capability**: Design spec generation + detail completion + parallel execution support

## Required Tools

- `mcp__gemini__gemini` - Design specification generation (MANDATORY)
- `mcp__auggie-mcp__codebase-retrieval` - Analyze existing component structure
- `mcp__sequential-thinking__sequentialthinking` - Planning strategy
- `LSP` - Component symbol and props analysis
- `Read` / `Write` - File operations

## Parallel Execution Support

This agent is **parallel-safe**:

- Each instance operates on independent output file (design-A.md / design-B.md / design-C.md)
- No shared state, no write conflicts

**Parallel invocation example**:

```
Task(design-variant-generator, variant_id="A") &
Task(design-variant-generator, variant_id="B") &
Task(design-variant-generator, variant_id="C")
wait_all()
```

## Execution Flow

### Step 0: Planning (sequential-thinking)

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan design spec generation: 1) Parse recommendation 2) Analyze existing components 3) Define layout 4) Generate component specs 5) Complete responsive strategy",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: Read Input Files

```
Read: ${run_dir}/requirements.md
Read: ${run_dir}/style-recommendations.md
```

Extract for `variant_id`: style name, color scheme, font config, usage suggestions

### Step 1.5: Load Shared Design Resources

```bash
SKILL_ROOT="${CLAUDE_PLUGIN_ROOT}/plugins/ui-design/skills"
Read: ${SKILL_ROOT}/_shared/styles/${style_name}.yaml
Read: ${SKILL_ROOT}/_shared/colors/${color_scheme}.yaml
Read: ${SKILL_ROOT}/_shared/typography/${typography_name}.yaml
```

### Step 2: Analyze Existing Component Structure (auggie-mcp + LSP)

**If optimizing existing project (has_existing_code: true), MUST execute**:

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Find all UI component structures, Props interfaces, and style implementations."
})
```

**If component files found, MUST call LSP**:

```
LSP(operation="documentSymbol", filePath="src/components/Button.tsx", line=1, character=1)
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=15)
```

Output: `component_props`, `existing_variants`, `style_implementation`, `constraints`

### Step 2.5: Gemini Design Specification Generation (MANDATORY)

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "${prompt}"
```

The prompt should include:

- Selected scheme details (style, color, typography)
- Core functions from requirements
- Existing component structure (if any)
- Request for detailed specifications

### Step 3: Generate Detailed Design Specification

**Core sections**:

| Section                | Content                                           |
| ---------------------- | ------------------------------------------------- |
| Layout Structure       | Header, Hero, Main, Sidebar, Footer               |
| Component Catalog      | Button, Card, Input, Select, Modal, Toast, etc.   |
| Detailed Styles        | Border radius, Spacing, Shadow, Animation         |
| Color Mapping          | Primary, Secondary, Accent, Success/Warning/Error |
| Typography Specs       | H1-H6, Body, Small, Caption                       |
| Responsive Breakpoints | Mobile, Tablet, Desktop                           |

### Step 4: Handle Fix Suggestions (if any)

If `fixes` parameter passed (from UX check failure):

```python
for fix in fix_items:
    if fix.type == "color_contrast":
        adjust_color(fix.token, fix.suggested_value)
    elif fix.type == "font_size":
        adjust_font_size(fix.element, fix.suggested_size)
    elif fix.type == "spacing":
        adjust_spacing(fix.value, round_to_4px(fix.value))
```

### Step 5: Generate Design Document

**Output**: `${run_dir}/design-{variant_id}.md`

Document structure:

- YAML frontmatter (variant_id, style, color, typography)
- Design Philosophy
- Layout System (grid, breakpoints)
- Color System (with contrast ratios)
- Typography System (with scale)
- Spacing System (4px base unit)
- Component Specifications (with Tailwind examples)
- Interaction States
- Animation Definitions
- Accessibility Considerations

### Step 6: Gate Check

- [ ] Design philosophy is clear
- [ ] Layout structure is complete
- [ ] At least 5 component specifications
- [ ] Color system complete (with contrast)
- [ ] Typography specification complete
- [ ] Responsive strategy is clear
- [ ] Tailwind config is usable

## Return Value

```json
{
  "status": "success",
  "variant_id": "A",
  "output_file": "${run_dir}/design-A.md",
  "is_retry": false,
  "summary": {
    "style": "Glassmorphism 2.0",
    "color": "Vercel Dark",
    "typography": "Plus Jakarta Sans",
    "component_count": 8,
    "contrast_compliant": true
  }
}
```

## Constraints

- **MUST** call auggie-mcp for optimize scenarios (has_existing_code: true)
- **MUST** call LSP if component files found
- **MUST** call Gemini for design spec generation
- variant_id must be parameter to ensure parallel safety
- Design spec must include complete color system with contrast validation
