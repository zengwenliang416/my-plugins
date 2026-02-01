# Image Analyzer Agent

## Overview

**Trigger**: When user provides `--image=<path>` parameter for design reference
**Output**: `${run_dir}/image-analysis.md` with design specifications extracted from image
**Core Capability**: 8 parallel Gemini visual analysis + Claude synthesis

## Required Tools

- `mcp__gemini__gemini` - Primary tool for image analysis (8 parallel calls)
- `mcp__sequential-thinking__sequentialthinking` - Planning strategy
- `Read` / `Write` / `Bash` - File operations
- `TaskOutput` - Retrieve background task results

## Execution Flow

### Step 0: Planning (sequential-thinking)

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan image analysis: 1) Verify image file 2) Launch 8 parallel Gemini analyses 3) Wait for completion 4) Synthesize results 5) Generate document",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: Verify Image File

```bash
if [ ! -f "${image_path}" ]; then
    echo "Error: Image file not found: ${image_path}"
    exit 1
fi
cp "${image_path}" "${run_dir}/reference-image.$(basename ${image_path##*.})"
```

### Step 2: Launch 8 Parallel Gemini Analysis Tasks

**MUST use `run_in_background=true` for all 8 tasks in a single message**:

| Task | Dimension              | Prompt Focus                                             |
| ---- | ---------------------- | -------------------------------------------------------- |
| 1    | Overall Style + Layout | Design style, grid system, visual hierarchy              |
| 2    | Color System           | Primary, secondary, accent, semantic colors (HEX values) |
| 3    | Typography System      | Font families, sizes, weights, line-height               |
| 4    | Spacing System         | Padding, margins, gaps (identify base unit)              |
| 5    | UI Components          | Button, card, input, modal styles                        |
| 6    | Interaction States     | Hover, active, focus, disabled states                    |
| 7    | Icon System            | Icon style, size, stroke width                           |
| 8    | Detail System          | Border-radius, shadows, borders                          |

**Command format**:

```bash
~/.claude/bin/codeagent-wrapper gemini --file "${image_path}" --prompt "${prompt_N}"
```

### Step 3: Wait for All Tasks

Use `TaskOutput` to retrieve results from all 8 background tasks.

### Step 4: Claude Synthesis

Based on 8 Gemini analysis results:

1. Validate consistency across analyses
2. Convert descriptions to Tailwind/CSS values
3. Identify reusable design patterns
4. Recommend matching icon library

### Step 5: Generate Analysis Document

**Output**: `${run_dir}/image-analysis.md`

Document structure:

- Design Style Summary
- Color System (HEX + Tailwind equivalents)
- Typography System (font-family, sizes in px/rem)
- Spacing System (base unit identified)
- Component Catalog
- Interaction States
- Icon System
- Detail System (radius, shadows, borders)
- Raw Gemini Analysis Records (all 8)

## Return Value

```json
{
  "status": "success",
  "output_file": "${run_dir}/image-analysis.md",
  "analysis_rounds": 8,
  "extracted_info": {
    "style_type": "Modern SaaS Dashboard",
    "color_count": 5,
    "component_count": 12,
    "font_family": "Inter",
    "layout_type": "Sidebar + Content",
    "icon_library": "Lucide"
  }
}
```

## Constraints

- **MUST** use Gemini for image analysis (no guessing)
- **MUST** launch all 8 tasks in parallel
- **MUST** save all Gemini raw responses
- Convert colors to HEX format
- Convert font sizes to px or rem

## Validation Checklist

- [ ] All 8 Gemini background tasks completed
- [ ] `${run_dir}/image-analysis.md` generated
- [ ] Document contains color system table
- [ ] Document contains spacing system
- [ ] Document contains component catalog
- [ ] Document contains all 8 Gemini raw records
