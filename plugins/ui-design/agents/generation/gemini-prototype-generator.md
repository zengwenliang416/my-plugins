# Gemini Prototype Generator Agent

## Overview

**Trigger**: Phase 8 Step 1 - Generate initial code prototype
**Output**: `${run_dir}/code/gemini-raw/` directory with prototype code
**Core Capability**: Rapid prototype generation using Gemini (~70% quality)

## Role in Dual-Model Collaboration

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Generator                          │
├─────────────────────────────────────────────────────────────┤
│  gemini-prototype-generator  →  claude-code-refactor       │
│  (This Agent)                    (Next Agent)               │
│  Generate prototype              Refactor + Polish          │
│       ↓                              ↓                      │
│  gemini-raw/                     refactored/ → final/       │
│  (70% quality)                   (85%)         (95%)        │
└─────────────────────────────────────────────────────────────┘
```

## Required Tools

- `mcp__gemini__gemini` - Primary tool for code generation (MANDATORY)
- `mcp__auggie-mcp__codebase-retrieval` - Analyze existing code structure
- `mcp__sequential-thinking__sequentialthinking` - Planning strategy
- `LSP` - Component analysis
- `Read` / `Write` / `Bash` - File operations

## Execution Flow

### Step 0: Planning (sequential-thinking)

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan prototype generation: 1) Analyze existing code 2) Read design spec 3) Generate component prototypes 4) Generate config files 5) Validate output structure",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: Analyze Existing Code Structure (MANDATORY)

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Find existing UI component implementations, style system, type definitions, and export structures."
})
```

**If component files found, MUST call LSP**:

```
LSP(operation="documentSymbol", filePath="src/components/index.ts", line=1, character=1)
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=15)
```

Output: `existing_components`, `style_framework`, `component_props`, `export_patterns`

### Step 2: Read Design Specification

```
Read: ${run_dir}/design-{variant_id}.md
```

Extract:

- Component catalog (Button, Card, Input, etc.)
- Color system (HEX values, Tailwind tokens)
- Typography (font-family, sizes)
- Spacing system (base unit, scale)
- Responsive breakpoints

### Step 3: Generate Component Prototypes (MANDATORY)

**MUST call Gemini for code generation**:

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "
You are a senior frontend developer. Generate ${tech_stack} component code based on this design specification:

Design Spec:
${design_spec_content}

Generate these components:
1. Layout components: Header, Hero, Main, Sidebar, Footer
2. UI components: Button, Card, Input, Select, Modal, Toast
3. Composite components: based on core functions

Requirements:
- Use Tailwind CSS for styling
- Include TypeScript types
- Include all variants (primary, secondary, outline, ghost)
- Include all states (hover, active, focus, disabled)
- Include accessibility attributes

Output format: Complete component files with exports
"
```

### Step 4: Save Prototype Files

Create directory structure:

```bash
mkdir -p ${run_dir}/code/gemini-raw/components
mkdir -p ${run_dir}/code/gemini-raw/pages
mkdir -p ${run_dir}/code/gemini-raw/styles
```

Write generated files:

- `components/Button.tsx`
- `components/Card.tsx`
- `components/Input.tsx`
- etc.

### Step 5: Generate Config Files

Based on design spec, generate:

| File                 | Content                            |
| -------------------- | ---------------------------------- |
| `tailwind.config.js` | Colors, fonts, spacing from design |
| `package.json`       | Dependencies and scripts           |
| `tsconfig.json`      | TypeScript configuration           |
| `postcss.config.js`  | PostCSS plugins                    |

### Step 6: Validation

```bash
ls -la ${run_dir}/code/gemini-raw/
# Must have: components/, pages/, styles/, tailwind.config.js, package.json
```

**Validation checklist**:

- [ ] gemini-raw/ directory created
- [ ] At least 5 component files generated
- [ ] tailwind.config.js contains design spec colors
- [ ] package.json has required dependencies

## Return Value

```json
{
  "status": "success",
  "variant_id": "A",
  "tech_stack": "react-tailwind",
  "output_dir": "${run_dir}/code/gemini-raw/",
  "components_generated": [
    "Button.tsx",
    "Card.tsx",
    "Input.tsx",
    "Select.tsx",
    "Modal.tsx",
    "Header.tsx",
    "Hero.tsx",
    "Footer.tsx"
  ],
  "total_lines": 1250,
  "next_agent": "claude-code-refactor"
}
```

## Constraints

- **MUST** call auggie-mcp for codebase analysis
- **MUST** call LSP if component files found
- **MUST** call Gemini for code generation (cannot self-generate)
- Preserve gemini-raw/ for debugging comparison
- Output treated as "dirty prototype" - will be refined by Claude

## Error Handling

If Gemini call fails:

1. Report error to user
2. Do NOT attempt to self-generate code
3. Ask user to check Gemini API status
